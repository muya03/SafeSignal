# SafeSignal

## Overview

SafeSignal is a Progressive Web App (PWA) designed for crisis communication between two people - specifically for emotional support situations where someone with depression needs to signal their support person. The app prioritizes clarity, speed, and emotional safety with a simple "hold to alert" mechanism that instantly notifies the paired partner through real-time WebSocket connections. Now includes Capacitor configuration for native Android and iOS builds.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled using Vite
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, React hooks for local state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming (light/dark mode support)
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Real-time Communication**: Native WebSocket server (ws library) for instant state synchronization
- **API Pattern**: WebSocket-first architecture - no REST endpoints for core functionality
- **Build**: esbuild for server bundling, Vite for client bundling

### Data Storage
- **Primary Storage**: In-memory storage for pair rooms and connection state (MemStorage class)
- **Client Persistence**: localStorage for user session data (name, pair code, user ID)
- **Database Schema**: Drizzle ORM with PostgreSQL configured but not actively used for core features - schema exists in shared/schema.ts

### Real-time Communication Pattern
- WebSocket connection established on user pairing
- Message types: join, leave, alert_on, alert_off, alert_ack, state_update, joined, error
- Broadcast mechanism for room-based state synchronization
- Automatic reconnection handling on client side
- Alert acknowledgment system: partner can respond with "Estoy aquí" without deactivating alert

### Native App Configuration (Capacitor)
- **Capacitor Config**: capacitor.config.ts defines app ID, name, and plugin settings
- **Platforms**: Android and iOS support configured
- **Native Plugins**: 
  - @capacitor/push-notifications for push notifications
  - @capacitor/local-notifications for local alerts
  - @capacitor/haptics for native vibration feedback
  - @capacitor/status-bar for status bar customization
  - @capacitor/app for app lifecycle events
- **Build Guide**: NATIVE_BUILD_GUIDE.md contains detailed instructions

### PWA Configuration
- Service worker ready with manifest.json
- Standalone display mode for app-like experience
- Mobile-first design with viewport restrictions
- Audio notifications using Web Audio API
- Vibration API support for haptic feedback

### Key Design Decisions
1. **No traditional authentication**: Simple name + pair code matching stored in localStorage
2. **Hold-to-activate button**: 2-second press requirement prevents accidental alerts
3. **Calming color palette**: Purple/green for normal state, soft orange for alert state (never aggressive red)
4. **Shared schema**: Zod schemas in /shared directory used by both client and server for type safety
5. **Alert ownership**: Only the person who triggered an alert can deactivate it with "Estoy bien"
6. **Acknowledgment system**: Partner can respond with "Estoy aquí" to notify without deactivating

## External Dependencies

### Core Services
- **PostgreSQL**: Database configured via DATABASE_URL environment variable (Drizzle ORM ready)
- **WebSocket**: Native ws library for real-time bidirectional communication

### Native App (Capacitor)
- **@capacitor/core**: Core Capacitor runtime
- **@capacitor/cli**: Build and sync tools
- **@capacitor/android**: Android platform support
- **@capacitor/ios**: iOS platform support
- **@capacitor/push-notifications**: Push notification support (requires Firebase/APNs)
- **@capacitor/local-notifications**: Local notification scheduling
- **@capacitor/haptics**: Native haptic feedback

### UI/Component Libraries
- **Radix UI**: Full suite of accessible, unstyled primitives
- **shadcn/ui**: Pre-built component library (new-york style variant)
- **Lucide React**: Icon library
- **Embla Carousel**: Carousel functionality
- **Vaul**: Drawer component
- **cmdk**: Command palette component

### Build & Development
- **Vite**: Development server and build tool with React plugin
- **esbuild**: Server-side bundling for production
- **Tailwind CSS**: Utility-first CSS with PostCSS/Autoprefixer
- **TypeScript**: Type checking across client, server, and shared code

### Form & Validation
- **React Hook Form**: Form state management
- **Zod**: Schema validation shared between client and server
- **drizzle-zod**: Zod schema generation from Drizzle schemas

## Native App Build Instructions

See `NATIVE_BUILD_GUIDE.md` for complete instructions. Quick overview:

1. Build web app: `npm run build`
2. Add platforms: `npx cap add android` / `npx cap add ios`
3. Sync code: `npx cap sync`
4. Open IDE: `npx cap open android` / `npx cap open ios`
5. Build in Android Studio or Xcode

**Requirements:**
- Android: Android Studio, JDK 17, Android SDK
- iOS: macOS, Xcode 15+, Apple Developer account ($99/year)
