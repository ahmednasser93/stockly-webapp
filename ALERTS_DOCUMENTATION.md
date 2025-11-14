# Stockly Alerts Feature Documentation

## Overview

The Alerts feature allows users to set up price notifications for their tracked stocks. Users will be notified via Expo Push Notifications on their mobile devices when a stock price crosses their specified threshold.

## Features

### 🔔 Alert Management
- **Create Alerts**: Set up new price alerts with customizable thresholds
- **Edit Alerts**: Update existing alert configurations
- **Delete Alerts**: Remove alerts you no longer need
- **Pause/Activate**: Temporarily disable alerts without deleting them

### 📊 Alert Configuration
- **Symbol**: Stock ticker symbol (e.g., AAPL, MSFT)
- **Direction**: Alert when price goes above or below threshold
- **Threshold**: Target price point
- **Channel**: Mobile push notifications (Expo)
- **Status**: Active or paused
- **Notes**: Optional description for your reference

### 📈 Live Monitoring
- View current prices alongside your alerts
- See distance to threshold (percentage away)
- Visual indicators when price is near threshold (within 5%)
- Color-coded status badges

## User Interface

### Alerts Dashboard (`/alerts`)

The main alerts page includes:

1. **Header Section**
   - Page title and description
   - "Create Alert" button

2. **Controls Bar**
   - Search box for filtering alerts
   - Filter tabs: All, Active, Paused

3. **Alerts Table**
   - Symbol with current price
   - Direction indicator (↑ Above / ↓ Below)
   - Threshold price
   - Distance to threshold
   - Status badge (🟢 Active / ⏸️ Paused)
   - Channel (mobile notification)
   - Target (Expo Push Token)
   - Created date
   - Action buttons (pause/activate, edit, delete)

4. **Empty State**
   - Displayed when no alerts exist
   - Quick access to create first alert

### Create/Edit Alert Form

Modal dialog with the following fields:

- **Stock Symbol** (required)
  - Text input with autocomplete
  - Uses existing stock search API
  - Cannot be changed when editing

- **Direction** (required)
  - Radio buttons: Above / Below
  - Visual indicators (↑/↓)

- **Threshold Price** (required)
  - Number input
  - Must be positive
  - Displays with 2 decimal places

- **Status** (edit only)
  - Radio buttons: Active / Paused
  - Not shown when creating new alert

- **Notification Channel** (required)
  - Radio buttons: Email / Webhook
  - Changes placeholder for target field

- **Target** (required)
  - Email address (validated) or webhook URL (validated)
  - Switches based on channel selection

- **Notes** (optional)
  - Textarea for user notes
  - Can be set to null to clear

### Delete Confirmation Dialog

Shows:
- Alert symbol
- Current configuration summary
- Warning that action cannot be undone
- Confirm/Cancel buttons

## API Integration

### Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/v1/api/alerts` | List all alerts |
| POST | `/v1/api/alerts` | Create new alert |
| GET | `/v1/api/alerts/{id}` | Get single alert |
| PUT | `/v1/api/alerts/{id}` | Update alert |
| DELETE | `/v1/api/alerts/{id}` | Delete alert |

### Data Fetching

- **React Query** for data management
- Automatic cache invalidation on mutations
- Real-time price updates (60-second intervals)
- Optimistic UI updates

## Validation Rules

### Create Alert
- Symbol: Required, non-empty string
- Direction: Must be "above" or "below"
- Threshold: Required, positive number
- Channel: Must be "email" or "webhook"
- Target: Required, valid email or URL based on channel
- Notes: Optional string

### Update Alert
- All fields optional (partial updates)
- At least one field must be provided
- Same validation rules as create for provided fields
- Status: Must be "active" or "paused"

## State Management

### Local State
- Form inputs and validation errors
- Modal visibility (create/edit/delete)
- Filter and sort preferences
- Search query

### Server State (React Query)
- Alerts list with 30-second stale time
- Current stock prices with 60-second refetch interval
- Mutations with automatic cache invalidation

### Toast Notifications
- Success messages (green)
- Error messages (red)
- Auto-dismiss after 3 seconds
- Manual close option

## Styling & Responsiveness

### Desktop View
- Full table layout with all columns
- Modal dialogs centered on screen
- Toast notifications in bottom-right

### Tablet View
- Condensed table columns
- Horizontal scroll if needed
- Adjusted modal padding

### Mobile View
- Horizontal scroll for table
- Full-width modals
- Stacked filter controls
- Toast spans full width

## Testing

### Unit Tests

**Alerts API Client** (`alerts-api.test.ts`)
- List alerts
- Get single alert
- Create alert with validation
- Update alert (partial and full)
- Delete alert
- Error handling

**Alerts Page** (`alerts-page.test.tsx`)
- Render loading state
- Display alerts table
- Empty state
- Error state
- Current prices
- Filter tabs
- Sort functionality

### Integration Testing Checklist

- [ ] Create alert with valid data
- [ ] Create alert with invalid data (validation)
- [ ] Symbol autocomplete works
- [ ] Edit alert updates data
- [ ] Pause/activate toggle
- [ ] Delete alert with confirmation
- [ ] Filter by status
- [ ] Search functionality
- [ ] Sort by different columns
- [ ] Current price fetching
- [ ] Distance calculation
- [ ] Toast notifications appear
- [ ] Responsive layout on mobile

## Performance Considerations

### Optimizations
- Memoized filtered/sorted alerts
- Price map for O(1) lookups
- Debounced search input (could be added)
- Skeleton loaders during fetch
- Optimistic UI updates

### Caching Strategy
- Alerts: 30-second stale time
- Prices: 60-second refetch interval
- Invalidate alerts cache after mutations
- Preserve previous data during refetch (placeholderData)

## Accessibility

- Semantic HTML structure
- ARIA labels where appropriate
- Keyboard navigation support
- Focus management in modals
- Color-blind friendly status indicators (icons + colors)

## Error Handling

### Network Errors
- Display error card with retry option
- Toast notification for user feedback
- Preserve UI state where possible

### Validation Errors
- Inline field-level errors
- Red border on invalid inputs
- Error messages below fields
- Prevent form submission

### API Errors
- 400: Show validation error message
- 404: Show "not found" error
- 500: Show generic server error
- Network timeout: Show connectivity error

## Future Enhancements

Potential improvements:
- Bulk operations (delete multiple, pause all)
- Alert history/logs
- Notification preferences
- Alert templates
- Price charts next to alerts
- Export alerts to CSV
- Import alerts from file
- Alert groups/categories
- Advanced filtering options
- Alert statistics dashboard

## Related Files

### Core Implementation
- `src/types.ts` - TypeScript interfaces
- `src/api/alerts.ts` - API client functions
- `src/hooks/useAlerts.ts` - React Query hook
- `src/pages/AlertsPage.tsx` - Main page component
- `src/components/AlertForm.tsx` - Create/edit form
- `src/components/DeleteAlertDialog.tsx` - Delete confirmation

### Tests
- `src/__tests__/alerts-api.test.ts`
- `src/__tests__/alerts-page.test.tsx`

### Documentation
- `public/openapi-alerts.yaml` - OpenAPI specification
- `ALERTS_DOCUMENTATION.md` - This file

### Backend
Backend API is deployed at: `https://stockly-api.ahmednasser1993.workers.dev`

The backend includes:
- Alert CRUD endpoints
- Durable Objects for alert state
- KV storage for persistence
- Cron job for price checking (every 5 minutes)
- Email and webhook notification support

## Support

For API issues or questions, refer to:
- OpenAPI spec: `public/openapi-alerts.yaml`
- Backend repository (separate project)
- Production API: `https://stockly-api.ahmednasser1993.workers.dev`

