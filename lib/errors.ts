"use strict";

/**
 * Custom Error classes following CodeCanyon requirements
 * All errors implement the Error contract and are augmented with properties
 */

export class TripPlanError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly context?: Record<string, unknown>;

  constructor(message: string, code: string, statusCode: number = 500, context?: Record<string, unknown>) {
    super(message);
    this.name = "TripPlanError";
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TripPlanError);
    }
  }
}

export class AuthenticationError extends TripPlanError {
  constructor(message: string = "Please sign in to generate a travel plan.", context?: Record<string, unknown>) {
    super(message, "AUTHENTICATION_ERROR", 401, context);
    this.name = "AuthenticationError";
  }
}

export class InsufficientCreditsError extends TripPlanError {
  public readonly requiredCredits: number;
  public readonly currentCredits: number;

  constructor(requiredCredits: number, currentCredits: number, context?: Record<string, unknown>) {
    const message = `INSUFFICIENT_CREDITS: You need ${requiredCredits} credits to generate a plan, but you only have ${currentCredits} credits. Please purchase more credits to continue.`;
    super(message, "INSUFFICIENT_CREDITS", 402, context);
    this.name = "InsufficientCreditsError";
    this.requiredCredits = requiredCredits;
    this.currentCredits = currentCredits;
  }
}

export class ValidationError extends TripPlanError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 400, context);
    this.name = "ValidationError";
  }
}

export class AIServiceError extends TripPlanError {
  public readonly originalError?: Error;

  constructor(message: string, originalError?: Error, context?: Record<string, unknown>) {
    super(message, "AI_SERVICE_ERROR", 503, context);
    this.name = "AIServiceError";
    this.originalError = originalError;
    
    if (originalError && Error.captureStackTrace) {
      Error.captureStackTrace(this, AIServiceError);
    }
  }
}

export class DatabaseError extends TripPlanError {
  public readonly originalError?: Error;

  constructor(message: string, originalError?: Error, context?: Record<string, unknown>) {
    super(message, "DATABASE_ERROR", 500, context);
    this.name = "DatabaseError";
    this.originalError = originalError;
    
    if (originalError && Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseError);
    }
  }
}

