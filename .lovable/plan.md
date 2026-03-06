

## Plan: Add Navigation Header with Settings Page

### Overview
Add a proper navigation bar to the header and create a dedicated Settings page containing profile editing and notification settings (moved from the main dashboard).

### Changes

**1. Create Settings page (`src/pages/Settings.tsx`)**
- Profile editing section: pre-populated form with current username and avatar, using the existing `useProfile` hook's `updateProfile` method and the same avatar grid from `ProfileSetup.tsx`
- Notification settings section: move the existing `NotificationSettings` component here
- Sign Out button at the bottom

**2. Update Header in `src/pages/Index.tsx`**
- Add a Settings icon (lucide `Settings`) next to the user avatar that navigates to `/settings`
- Remove the `NotificationSettings` section and its divider from the main dashboard
- Keep Sign Out in the header as well for quick access

**3. Update routing (`src/App.tsx`)**
- Add `<Route path="/settings" element={<Settings />} />`

**4. Files affected**
- **Create**: `src/pages/Settings.tsx` -- profile edit form + NotificationSettings component + sign out
- **Edit**: `src/pages/Index.tsx` -- add settings icon to header, remove NotificationSettings section
- **Edit**: `src/App.tsx` -- add `/settings` route

