# Configuration API Implementation

This document describes the implementation of the Configuration API endpoints in the Stockly webapp, including the merged settings page and API documentation updates.

## Overview

The implementation adds support for the Configuration API endpoints that were implemented by the API team. This includes:
- Admin Configuration API endpoints
- User Settings API endpoints
- User Preferences API endpoints
- Integration into the Docs page for testing
- Merged settings page with all configuration options

---

## Files Created

### 1. `/src/api/userSettings.ts`

A new API client module for user settings and preferences endpoints.

**Exports:**
- `getUserSettings(userId: string): Promise<UserSettings>`
- `updateUserSettings(request: UpdateUserSettingsRequest): Promise<ApiResponse<UserSettings>>`
- `getUserPreferences(userId: string): Promise<NotificationPreferences>`
- `updateUserPreferences(request: UpdatePreferencesRequest): Promise<ApiResponse<void>>`

**TypeScript Types:**
```typescript
interface UserSettings {
  userId: string;
  refreshIntervalMinutes: number;
  updatedAt: string;
}

interface NotificationPreferences {
  userId: string;
  enabled: boolean;
  quietStart: string | null;
  quietEnd: string | null;
  allowedSymbols: string[] | null;
  maxDaily: number | null;
  updatedAt: string;
}
```

**Features:**
- Automatic error handling with descriptive error messages
- Uses the same API base URL configuration as other API clients
- Supports CORS and credentials
- Proper TypeScript typing for all requests and responses

---

## Files Modified

### 1. `/src/pages/DocsPage.tsx`

**Changes:**
- Added three new GET endpoints to the API documentation:
  1. **Get Admin Config** (`GET /config/get`)
     - Retrieves current admin configuration
     - No query parameters required
  2. **Get User Settings** (`GET /v1/api/settings/:userId`)
     - Retrieves user-specific settings
     - Requires `userId` as a path parameter
  3. **Get User Preferences** (`GET /v1/api/preferences/:userId`)
     - Retrieves user notification preferences
     - Requires `userId` as a path parameter

**Enhanced Request Handler:**
- Updated `handleSubmit` function to support path parameters (e.g., `:userId`)
- Automatically replaces path parameters with user input values
- Maintains backward compatibility with query parameters

**Usage:**
Users can now test these configuration endpoints directly from the Docs page by:
1. Selecting the endpoint from the list
2. Entering the required parameters (e.g., userId)
3. Clicking "Send request" to see the response

---

### 2. `/src/pages/SettingsPage.tsx`

**Major Changes:**

#### Tab Structure
- **Removed:** Separate "App Settings" and "Admin Settings" tabs
- **Added:** Single merged "Settings" tab
- **Kept:** "Monitoring" and "Developer Tools" tabs unchanged

#### New Settings Tab Structure

The merged settings page is organized into three sections:

##### 1. Admin Configuration Section
Contains system-wide admin settings:

- **Polling Interval (seconds)**
  - Field: `pollingIntervalSec`
  - Range: 10-300 seconds
  - Description: How often stock data is refreshed from Financial Modeling Prep API (server-side)
  - Updates: `POST /config/update`

- **Alert Throttle - Max Alerts**
  - Field: `alertThrottle.maxAlerts`
  - Minimum: 1
  - Updates: `POST /config/update`

- **Alert Throttle - Window (seconds)**
  - Field: `alertThrottle.windowSeconds`
  - Minimum: 10
  - Updates: `POST /config/update`

- **Feature Flags:**
  - **Enable Alerting** (`featureFlags.alerting`)
  - **Sandbox Mode** (`featureFlags.sandboxMode`)
  - **Simulate Provider Failure** (`featureFlags.simulateProviderFailure`)
  - All update via `POST /config/update`

##### 2. User Settings Section
Contains per-user client-side preferences:

- **Refresh Interval (minutes)**
  - Field: `refreshIntervalMinutes`
  - Range: 1-720 minutes (1 minute to 12 hours)
  - Description: Client-side refresh interval preference
  - Updates: `PUT /v1/api/settings`

##### 3. Notification Preferences Section
Contains per-user notification settings:

- **Enable Notifications**
  - Field: `enabled`
  - Type: Boolean checkbox
  - Updates: `PUT /v1/api/preferences`

- **Quiet Hours Start (HH:MM)**
  - Field: `quietStart`
  - Format: 24-hour time format (e.g., "22:00")
  - Type: Time input
  - Disabled when notifications are off
  - Updates: `PUT /v1/api/preferences`

- **Quiet Hours End (HH:MM)**
  - Field: `quietEnd`
  - Format: 24-hour time format (e.g., "08:00")
  - Type: Time input
  - Disabled when notifications are off
  - Updates: `PUT /v1/api/preferences`

- **Allowed Symbols (comma-separated)**
  - Field: `allowedSymbols`
  - Type: Text input
  - Format: Comma-separated list (e.g., "AAPL, MSFT, GOOGL")
  - Disabled when notifications are off
  - Updates: `PUT /v1/api/preferences`
  - Note: Leave empty to allow all symbols

- **Max Daily Notifications**
  - Field: `maxDaily`
  - Type: Number input
  - Minimum: 1
  - Disabled when notifications are off
  - Updates: `PUT /v1/api/preferences`
  - Note: Leave empty for no limit

#### Data Loading

The settings page loads data from three sources on mount:

1. **Admin Config** - Uses `useAdminConfig` hook
2. **User Settings** - Calls `getUserSettings(userId)`
3. **User Preferences** - Calls `getUserPreferences(userId)`

All three loads happen in parallel, and the page shows a loading state until all data is loaded.

#### Saving Settings

The page has a single "Save All Settings" button that:
1. Updates admin config via `saveConfig()` (which calls `POST /config/update`)
2. Updates user settings via `updateUserSettings()` (which calls `PUT /v1/api/settings`)
3. Updates user preferences via `updateUserPreferences()` (which calls `PUT /v1/api/preferences`)

All updates happen sequentially, and a status message is shown after completion.

#### Error Handling

- Loading errors are displayed in an error banner
- Save errors are shown in the status message
- Individual API errors are caught and logged with fallback to defaults

#### User ID

Currently uses a hardcoded `userId` of `"demo-user"`. In a production app, this should be retrieved from the authentication context.

---

## API Endpoints Used

### Admin Configuration

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/config/get` | GET | Retrieve admin configuration |
| `/config/update` | POST | Update admin configuration (partial updates supported) |

### User Settings

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/api/settings/:userId` | GET | Retrieve user settings |
| `/v1/api/settings` | PUT | Create or update user settings |

### User Preferences

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/api/preferences/:userId` | GET | Retrieve user preferences |
| `/v1/api/preferences` | PUT | Create or update user preferences |

---

## Implementation Details

### Type Safety

All API functions are fully typed with TypeScript interfaces matching the API documentation:
- Request types for all update operations
- Response types for all get operations
- Error handling with typed error responses

### Validation

Client-side validation is implemented for:
- `refreshIntervalMinutes`: Clamped to 1-720 range
- `pollingIntervalSec`: Clamped to 10-300 range
- `maxDaily`: Must be a positive number or empty
- `allowedSymbols`: Parsed and converted to uppercase array

### User Experience

- **Loading States:** Shows spinner while loading all settings
- **Error States:** Displays clear error messages
- **Success States:** Shows confirmation message after saving
- **Disabled States:** Notification preference fields are disabled when notifications are off
- **Visual Organization:** Settings are grouped into clear sections with dividers

---

## Usage Examples

### Testing Endpoints in Docs Page

1. Navigate to the Docs page
2. Select "Get Admin Config" from the endpoint list
3. Click "Send request"
4. View the JSON response showing current admin configuration

### Updating Settings

1. Navigate to Settings page
2. Modify any settings in the three sections:
   - Admin Configuration
   - User Settings
   - Notification Preferences
3. Click "Save All Settings"
4. Wait for confirmation message

### Programmatic Usage

```typescript
import {
  getUserSettings,
  updateUserSettings,
  getUserPreferences,
  updateUserPreferences,
} from "./api/userSettings";

// Get user settings
const settings = await getUserSettings("user123");
console.log(settings.refreshIntervalMinutes);

// Update user settings
await updateUserSettings({
  userId: "user123",
  refreshIntervalMinutes: 10,
});

// Get user preferences
const prefs = await getUserPreferences("user123");
console.log(prefs.enabled, prefs.allowedSymbols);

// Update user preferences
await updateUserPreferences({
  userId: "user123",
  enabled: true,
  quietStart: "22:00",
  quietEnd: "08:00",
  allowedSymbols: ["AAPL", "MSFT"],
  maxDaily: 10,
});
```

---

## Future Improvements

1. **User ID from Auth Context:** Replace hardcoded `"demo-user"` with actual user ID from authentication
2. **Real-time Updates:** Consider polling or WebSocket updates for admin config changes
3. **Validation Feedback:** Add inline validation messages for invalid inputs
4. **Partial Saves:** Allow saving individual sections instead of all at once
5. **Settings History:** Track and display settings change history
6. **Export/Import:** Allow exporting and importing settings as JSON

---

## Testing

### Manual Testing Checklist

- [ ] Docs page displays all three new GET endpoints
- [ ] Can test GET requests with path parameters
- [ ] Settings page loads all three data sources
- [ ] Can update admin configuration fields
- [ ] Can update user settings (refresh interval)
- [ ] Can update notification preferences
- [ ] All fields save correctly
- [ ] Error messages display correctly
- [ ] Loading states work correctly
- [ ] Notification preference fields disable when notifications are off

### API Testing

Test each endpoint:
- [ ] `GET /config/get` returns admin config
- [ ] `POST /config/update` updates admin config
- [ ] `GET /v1/api/settings/:userId` returns user settings
- [ ] `PUT /v1/api/settings` updates user settings
- [ ] `GET /v1/api/preferences/:userId` returns user preferences
- [ ] `PUT /v1/api/preferences` updates user preferences

---

## Dependencies

No new dependencies were added. The implementation uses:
- React hooks (`useState`, `useEffect`)
- Existing API client patterns
- TypeScript for type safety
- Fetch API for HTTP requests

---

## Notes

- The implementation follows the existing codebase patterns and conventions
- All API endpoints match the API documentation provided
- Error handling is consistent with other API clients in the codebase
- The UI maintains the existing design system and styling

---

## Related Documentation

- API Reference: See the Configuration API Reference document provided by the API team
- Existing API Clients: `/src/api/adminConfig.ts`, `/src/api/client.ts`
- Settings Context: `/src/state/SettingsContext.tsx` (note: this is now separate from backend settings)

---

**Last Updated:** January 2025
**Version:** 1.0.0

