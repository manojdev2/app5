"use strict";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import connectDB from "@/db/mongodb";
import User from "@/db/models/User";
import Transaction from "@/db/models/Transaction";
import { logger } from "@/lib/logger";
import { DatabaseError } from "@/lib/errors";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

// Validate webhook secret is configured
const getWebhookSecret = () => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured in environment variables");
  }
  return secret;
};

// Disable body parsing, need raw body for webhook signature verification
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = getWebhookSecret();
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      logger.error("Webhook request missing stripe-signature header");
      return NextResponse.json(
        { error: "No signature provided" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logger.log(`Webhook event received: ${event.type}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      logger.error("Webhook signature verification failed:", errorMessage);
      return NextResponse.json(
        { error: `Webhook Error: ${errorMessage}` },
        { status: 400 }
      );
    }

    // Handle the event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      try {
        await connectDB();

        const userId = session.metadata?.userId;
        const credits = parseInt(session.metadata?.credits || "0");
        const amount = session.amount_total || 0; // Amount in cents

        if (!userId || !credits) {
          logger.error("Missing userId or credits in session metadata", {
            userId,
            credits,
            metadata: session.metadata,
          });
          return NextResponse.json(
            { error: "Missing metadata" },
            { status: 400 }
          );
        }

        // Check if user exists first
        let user = await User.findOne({ clerkId: userId });

        if (!user) {
          try {
            // New user: give them 100 free credits + purchased credits
            user = new User({
              clerkId: userId,
              credits: 100 + credits, // 100 free + purchased credits
            });
            await user.save();
            logger.log(`Created new user ${userId} with ${100 + credits} credits (100 free + ${credits} purchased)`);
          } catch (saveError: unknown) {
            // Handle duplicate key error (might be from old index)
            if (saveError && typeof saveError === 'object' && 'code' in saveError) {
              const dbError = saveError as { code: number; codeName?: string };
              if (dbError.code === 11000 || dbError.codeName === 'DuplicateKey') {
                logger.warn(`Duplicate key error when creating user ${userId}. Attempting to find existing user...`);
                // Try to find user again (might have been created by another process)
                user = await User.findOne({ clerkId: userId });
                if (user) {
                  // User exists, just add credits
                  const previousCredits = user.credits || 0;
                  user.credits = previousCredits + credits;
                  await user.save();
                  logger.log(`Found existing user ${userId}. Updated: ${previousCredits} + ${credits} = ${user.credits} credits`);
                } else {
                  // Still can't find user, might be old index issue
                  logger.error(`Duplicate key error but user not found. This might indicate an old 'userId' index in the database.`);
                  throw new DatabaseError(`Database index conflict. Please contact support or drop the old 'userId' index from the users collection.`, saveError instanceof Error ? saveError : undefined);
                }
              } else {
                throw saveError instanceof Error ? saveError : new Error(String(saveError));
              }
            } else {
              throw saveError instanceof Error ? saveError : new Error(String(saveError));
            }
          }
        } else {
          // Existing user: just add purchased credits
          const previousCredits = user.credits || 0;
          user.credits = previousCredits + credits;
          await user.save();
          logger.log(`Updated user ${userId}: ${previousCredits} + ${credits} = ${user.credits} credits`);
        }

        // Create transaction record
        try {
          const transaction = new Transaction({
            userId,
            stripeSessionId: session.id,
            amount,
            credits,
            status: "completed",
          });
          await transaction.save();
          logger.log(`Transaction recorded: ${amount} cents, ${credits} credits for user ${userId}`);
        } catch (txnError: unknown) {
          // Log error but don't fail the webhook - credits were already added
          logger.error("Failed to create transaction record:", txnError);
        }

        logger.log(`✅ Successfully added ${credits} credits to user ${userId}. Total: ${user.credits}`);
      } catch (error: unknown) {
        logger.error("Error processing webhook:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
          { error: "Failed to process webhook", details: errorMessage },
          { status: 500 }
        );
      }
    } else {
      logger.log(`Unhandled webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    logger.error("Webhook handler error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}

