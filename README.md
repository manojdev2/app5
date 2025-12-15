# AI Travel Planner - Next.js Application

A comprehensive AI-powered travel planning application built with Next.js 14, TypeScript, and MongoDB. This application helps users create personalized travel itineraries using AI technology.

## 📋 Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Dependencies](#dependencies)
- [Server Settings](#server-settings)
- [File Permissions](#file-permissions)
- [Version Information](#version-information)
- [Development](#development)
- [Building for Production](#building-for-production)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## ✨ Features

### User Features
- **AI-Powered Trip Planning**: Generate personalized travel itineraries using OpenAI GPT-4o-mini
- **User Authentication**: Secure authentication using Clerk
- **Credit System**: Purchase credits to generate travel plans
- **Weather Integration**: Real-time weather data for destinations
- **Places Integration**: Discover attractions, restaurants, and hotels via Google Maps API
- **Hotel Search**: Search and compare hotel prices
- **Plan Management**: Save, view, and manage your travel plans
- **Export Options**: Export plans as PDF or DOCX
- **Calendar Integration**: Add plans to your calendar

### Admin Panel Features
- **Dashboard**: Overview of users, plans, and system statistics
- **User Management**: View, manage users, add credits, and track user activity
- **Destination Management**: Add, edit, and manage featured destinations
- **Landing Page Editor**: Edit homepage sections including:
  - Why Choose Alto.trip section
  - Featured Explorations
  - Choose Your Destination
  - Contact Adventure section
  - Image and JSON animation file uploads
- **FAQ Management**: Create and manage frequently asked questions
- **Pricing Management**: Configure credit packages and pricing plans
- **Page Management**: Edit static pages (About, Contact, Terms, Privacy)
- **Site Settings**: Configure SEO metadata, logos, and footer content
- **Visual Icon Picker**: Easy icon selection for various sections

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher (or yarn/pnpm)
- **MongoDB**: MongoDB Atlas account (free tier available) or local MongoDB instance
- **Git**: For cloning the repository

## 🚀 Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd aitrip-planner-main
```

### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Step 3: Set Up Environment Variables

Create a `.env` file in the root directory and add the following variables:

```env
# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# OpenWeather API
OPENWEATHER_API_KEY=your_openweather_api_key

# Unsplash API (Optional - for destination images)
UNSPLASH_ACCESS_KEY=your_unsplash_access_key

# Stripe Payment (Optional - for credit purchases)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Hotel Search APIs (Optional)
BOOKINGAPI_DEV_API_KEY=your_bookingapi_dev_key
STAYAPI_API_KEY=your_stayapi_key

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Set Up MongoDB

1. Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (free tier available)
3. Create a database user
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string and add it to `.env` as `MONGODB_URI`

### Step 5: Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 6: Access Admin Panel

The default admin user is automatically created when you start the application:

- **Email:** `admin@admin.com`
- **Password:** `admin123`
- **Access:** Navigate to `/admin` and log in

<div class="callout info">
  <strong>💡 Auto-Admin Creation:</strong> The default admin user is automatically created when you run <code>npm run dev</code> or <code>npm run build</code>. No manual setup required!
</div>

## 🔑 Environment Variables

### Required Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `MONGODB_URI` | MongoDB connection string | MongoDB Atlas Dashboard |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | Clerk Dashboard |
| `CLERK_SECRET_KEY` | Clerk secret key | Clerk Dashboard |
| `OPENAI_API_KEY` | OpenAI API key | https://platform.openai.com/api-keys |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key | Google Cloud Console |
| `OPENWEATHER_API_KEY` | OpenWeather API key | https://openweathermap.org/api |

### Optional Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `UNSPLASH_ACCESS_KEY` | Unsplash API key for images | https://unsplash.com/developers |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public key | Stripe Dashboard |
| `STRIPE_SECRET_KEY` | Stripe secret key | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Stripe Dashboard |
| `BOOKINGAPI_DEV_API_KEY` | BookingAPI.dev key | https://rapidapi.com/bookingapi/api/booking-com13 |
| `STAYAPI_API_KEY` | StayAPI key | https://rapidapi.com/apidojo/api/stayapi |

## 📚 Dependencies

### Core Dependencies

- **next**: ^14.2.33 - React framework for production
- **react**: ^18 - UI library
- **react-dom**: ^18 - React DOM renderer
- **typescript**: ^5 - TypeScript support
- **mongodb**: ^8.5.1 - MongoDB driver
- **mongoose**: ^8.5.1 - MongoDB object modeling

### Authentication

- **@clerk/nextjs**: ^5.7.1 - Authentication and user management

### AI & APIs

- **openai**: (via API) - AI trip generation
- **zod**: ^3.23.8 - Schema validation

### UI Components

- **@radix-ui/react-*** - Accessible UI components
- **tailwindcss**: ^3.4.1 - Utility-first CSS framework
- **framer-motion**: ^11.11.1 - Animation library
- **lucide-react**: ^0.447.0 - Icon library

### Utilities

- **date-fns**: ^3.6.0 - Date manipulation
- **file-saver**: ^2.0.5 - File download
- **jspdf**: ^3.0.3 - PDF generation
- **docx**: ^9.5.1 - DOCX generation

### Development Dependencies

- **eslint**: ^8 - Code linting
- **eslint-config-next**: 14.2.14 - Next.js ESLint config
- **tsx**: ^4.19.2 - TypeScript execution for scripts
- **@types/node**: ^20 - Node.js type definitions
- **@types/react**: ^18 - React type definitions

### Security

- **glob**: ^10.5.0 (overridden) - Fixed security vulnerability in glob package
- All dependencies are regularly audited and updated

See `package.json` for the complete list of dependencies.

## ⚙️ Server Settings

### Node.js Version

- **Minimum**: Node.js 18.x
- **Recommended**: Node.js 20.x LTS

### Port Configuration

- **Development**: Port 3000 (default)
- **Production**: Configure via `PORT` environment variable

### Build Settings

- **Output**: Standalone (configured in `next.config.mjs`)
- **Image Optimization**: Enabled via Next.js Image component
- **API Routes**: Server-side API routes in `/app/api`

## 📁 File Permissions

Ensure the following directories have write permissions:

- `node_modules/` - For npm packages
- `.next/` - Build directory (created automatically)
- `public/uploads/` - For user-uploaded images and JSON files (created automatically)
- All source files should have read permissions

## 🔢 Version Information

- **Node.js**: 18.x or higher
- **Next.js**: 14.2.33
- **React**: 18.x
- **TypeScript**: 5.x
- **MongoDB**: Compatible with MongoDB 4.4+

## 💻 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint

# Utilities
npm run cleanup-users           # Clean up orphaned users from Clerk
```

### Project Structure

```
aitrip-planner-main/
├── app/                    # Next.js app router pages
│   ├── admin/             # Admin panel pages
│   │   ├── dashboard/     # Admin dashboard
│   │   ├── user/          # User management
│   │   ├── destination/   # Destination management
│   │   ├── landing/       # Landing page editor
│   │   ├── faq/           # FAQ management
│   │   ├── pricing/       # Pricing management
│   │   ├── pages/         # Static page editor
│   │   └── settings/      # Site settings
│   ├── api/               # API routes
│   │   └── admin/         # Admin API routes (upload, etc.)
│   ├── dashboard/         # User dashboard
│   ├── travel-planner/    # Travel planner page
│   └── ...
├── components/            # React components
│   ├── features/          # Feature components
│   ├── shared/            # Shared components
│   └── ui/                # UI components
├── db/                    # Database models
│   ├── models/            # Mongoose models
│   └── mongodb.ts         # MongoDB connection
├── lib/                   # Utility libraries
│   ├── migrations/        # Database migration scripts
│   └── admin-auth.ts      # Admin authentication
├── server/                 # Server-side functions
│   ├── admin/             # Admin server actions
│   ├── public/            # Public server actions
│   ├── ai.ts              # AI trip generation
│   ├── credits.ts         # Credit management
│   ├── weather.ts         # Weather API
│   └── ...
├── scripts/               # Utility scripts
│   └── create-admin.ts    # Admin user creation script
└── public/                # Static assets
    └── uploads/           # User-uploaded files (images, JSON)
```

## 🏗️ Building for Production

### Step 1: Build the Application

```bash
npm run build
```

This creates an optimized production build in the `.next` directory.

### Step 3: Start Production Server

```bash
npm start
```

The application will be available at `http://localhost:3000` (or your configured port).

### Step 3: Access Admin Panel

The default admin user is automatically created:

- **Email:** `admin@admin.com`
- **Password:** `admin123`
- **Access:** Navigate to `/admin` and log in

> **⚠️ Security Note:** Change the default admin password in production environments!

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### AWS EC2

See `Documentation/install-aws-ec2.html` for detailed instructions.

### Other Platforms

The application can be deployed to any platform that supports Node.js:
- Heroku
- DigitalOcean App Platform
- Railway
- Render

## 🐛 Troubleshooting

### Common Issues

#### MongoDB Connection Error

**Error**: `MongoNetworkError` or connection timeout

**Solution**:
1. Verify `MONGODB_URI` is correct in `.env`
2. Check MongoDB Atlas IP whitelist
3. Ensure MongoDB cluster is running

#### Clerk Authentication Error

**Error**: Authentication not working

**Solution**:
1. Verify Clerk keys are correct
2. Check `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
3. Ensure Clerk application URL matches your domain

#### OpenAI API Error

**Error**: `OpenAI API error` or quota exceeded

**Solution**:
1. Verify `OPENAI_API_KEY` is valid
2. Check OpenAI account billing and quota
3. Ensure API key has sufficient credits

#### Build Errors

**Error**: TypeScript or build errors

**Solution**:
1. Run `npm install` to ensure all dependencies are installed
2. Check `tsconfig.json` configuration
3. Verify all environment variables are set
4. Ensure all database migrations have been run

#### Admin Panel Access Issues

**Error**: Cannot access admin panel or authentication fails

**Solution**:
1. Ensure you've created an admin user using `npm run create-admin`
2. Verify admin credentials are correct
3. Check that MongoDB connection is working
4. Ensure admin user exists in the database

#### Admin Panel Access Issues

**Error**: Cannot access admin panel or authentication fails

**Solution**:
1. Ensure MongoDB connection is working
2. Default admin credentials:
   - Email: `admin@admin.com`
   - Password: `admin123`
3. The admin user is automatically created on app startup
4. Check server logs for admin creation messages
5. Verify admin collection exists in MongoDB

### Getting Help

For additional support:
1. Check the `Documentation/` folder for detailed guides
2. Review error messages in the browser console
3. Check server logs for detailed error information

## 📝 Code Standards

This project follows CodeCanyon requirements:

- **Strict Mode**: All JavaScript/TypeScript files use `"use strict"`
- **Error Handling**: Custom Error classes with proper Error contract
- **Function Length**: Functions kept under 100 lines
- **Code Quality**: ESLint configured and enforced
- **Type Safety**: Full TypeScript support
- **Semicolons**: All statements end with semicolons
- **React Hooks**: Proper dependency arrays and memoization
- **JSHint Compliance**: See `JSHINT_NOTE.md` for details

### Code Quality

- All ESLint warnings have been resolved
- React Hook dependencies are properly configured
- TypeScript strict mode enabled
- No security vulnerabilities (npm audit clean)

### JSHint Note

This project is written in TypeScript. JSHint checks should be run on the compiled JavaScript output (after `npm run build`). See `JSHINT_NOTE.md` for complete details.

## 📄 License

This project is licensed for sale on CodeCanyon. See the license file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- OpenAI for AI capabilities
- Clerk for authentication
- All open-source contributors

## 🔐 Security

### Security Updates

- **glob package**: Fixed high severity vulnerability by overriding to version ^10.5.0
- All dependencies are regularly audited using `npm audit`
- Admin routes are protected with authentication middleware
- File uploads are validated and sanitized

### Admin Authentication

- Admin users are stored in MongoDB with bcrypt-hashed passwords
- Admin routes require authentication via `requireAdmin()` middleware
- Session management handled securely

---

**Version**: 1.1.0  
**Last Updated**: 2025  
**Node.js**: 18.x+  
**Next.js**: 14.2.33  
**Security**: All vulnerabilities patched
