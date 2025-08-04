# 7Voices - AI Text-to-Speech Platform

## Overview

7Voices is a modern text-to-speech application that transforms text into natural, human-like speech using OpenAI's advanced TTS API. The platform features a sleek web interface with voice customization options, real-time audio generation, and instant MP3 downloads. Built as a full-stack application with a React frontend and Express backend, it provides both free and premium tiers for different user needs.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- Switched from GitHub OAuth to email-based authentication (August 4, 2025)
- Renamed application from "7Voice" to "7Voices" throughout the project
- Added automatic redirect to dashboard after successful login/signup
- Fixed database schema compatibility with existing columns

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety and modern development
- **UI Library**: Radix UI components with shadcn/ui for consistent, accessible design
- **Styling**: Tailwind CSS with custom CSS variables for theming support
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript for API development
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Validation**: Zod schemas for runtime type validation and API contracts
- **Storage**: Dual storage approach with in-memory storage for development and PostgreSQL for production
- **File Serving**: Static file serving for client assets in production

### Data Models
- **TTS Requests**: Stores text input, voice selection, speed, pitch, and tone parameters
- **Users**: Complete user management with email-based authentication and Stripe subscription data
- **Voice Mapping**: Hardcoded mapping between user-friendly voice names and OpenAI voice IDs
- **Subscriptions**: User subscription status, Stripe customer/subscription IDs, and plan information

### API Design
- **TTS Endpoints**: `/api/tts/generate` for speech synthesis, `/api/tts/voices` for voice options
- **Authentication**: `/api/auth/login` for email login, `/api/auth/user` for session management, `/api/auth/logout` for sign out
- **Payment Processing**: `/api/stripe/create-subscription`, `/api/stripe/subscription-status` for Stripe integration
- **Request/Response**: JSON-based API with proper error handling and validation
- **Audio Delivery**: Direct MP3 streaming with appropriate headers for file downloads

### Audio Processing
- **TTS Provider**: OpenAI's `tts-1` model for speech generation
- **Voice Options**: Six distinct voices mapped to OpenAI's voice models (nova, onyx, shimmer, fable, alloy, echo)
- **Customization**: Speed control (0.5x-2.0x), pitch adjustment (-20 to +20), and tone selection
- **Output Format**: MP3 audio files with proper Content-Type headers

### Development Environment
- **Development Server**: Vite dev server with HMR for frontend, tsx for backend hot reloading
- **Database Management**: Drizzle Kit for schema migrations and database operations
- **Build Process**: Separate frontend (Vite) and backend (esbuild) build pipelines
- **Environment**: Replit-optimized with cartographer plugin for development

## External Dependencies

### Core Services
- **OpenAI API**: Text-to-speech generation using the OpenAI TTS API with API key authentication
- **Neon Database**: PostgreSQL database hosting for production data persistence
- **Stripe**: Payment processing for Pro ($9.99/month) and Premium ($19.99/month) subscription plans
- **Email Authentication**: Simple email-based user authentication and session management
- **Twilio SMS**: SMS notifications sent to DTAC number upon successful subscription payments

### UI and Styling
- **Radix UI**: Comprehensive component library for accessible, unstyled components
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **shadcn/ui**: Pre-built component templates based on Radix UI

### Development Tools
- **TypeScript**: Static type checking across frontend, backend, and shared schemas
- **Drizzle ORM**: Type-safe database operations with PostgreSQL dialect
- **TanStack Query**: Server state management, caching, and API integration
- **React Hook Form**: Form state management with Zod validation integration

### Build and Deployment
- **Vite**: Frontend development server and build tool
- **esbuild**: Backend bundling for production deployment
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer