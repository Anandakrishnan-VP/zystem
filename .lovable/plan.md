

# Set Up Capacitor for Native Android App

## What This Does
Configures your Zystem project to be wrapped in a native Android shell using Capacitor, so you can build and run it as a real Android app.

## Steps

### 1. Install Capacitor Dependencies
Add these npm packages:
- `@capacitor/core`
- `@capacitor/cli` (dev dependency)
- `@capacitor/android`

### 2. Initialize Capacitor
Run `npx cap init` which creates `capacitor.config.ts` in the project root with:
- **appId**: `app.lovable.9fb4131573014bd08fae17e5b130c2d0`
- **appName**: `zystem`
- **webDir**: `dist`
- **server.url**: `https://9fb41315-7301-4bd0-8fae-17e5b130c2d0.lovableproject.com?forceHideBadge=true` (for live reload during development)
- **server.cleartext**: `true`

### 3. What You Need To Do Locally
After I configure the project, you'll need to:

1. **Export to GitHub** — use the "Export to GitHub" button in Lovable settings
2. **Clone and install** — `git clone <repo>` then `npm install`
3. **Add Android platform** — `npx cap add android`
4. **Build and sync** — `npm run build && npx cap sync`
5. **Open in Android Studio** — `npx cap open android`
6. **Run on device/emulator** — Build and run from Android Studio

**Prerequisite**: You need [Android Studio](https://developer.android.com/studio) installed on your computer.

For a detailed walkthrough, check out the Lovable blog post on building mobile apps with Capacitor.

