# Stockly Webapp - Feature Index

> **Complete reference for all features and how to use/modify them**

---

## 📋 Table of Contents

1. [Stock Dashboard](#stock-dashboard)
2. [Price Alerts](#price-alerts)
3. [Stock Search](#stock-search)
4. [Theme System](#theme-system)
5. [Authentication](#authentication)
6. [Settings](#settings)
7. [Admin Panel](#admin-panel)
8. [API Documentation](#api-documentation)

---

## 1. Stock Dashboard

### 📍 Location
- **Page**: `src/pages/HomePage.tsx`
- **Route**: `/`
- **Components**: `SearchBar`, `TrackedSymbols`, `StockCard`

### 🎯 Features
- Track multiple stock symbols
- Real-time price updates
- Auto-refresh (configurable interval)
- Add/remove symbols
- Symbol autocomplete
- Persistent watchlist (localStorage)

### 🔧 How It Works
```typescript
// Data fetching
const stocksQuery = useQuery({
  queryKey: ["stocks", trackedSymbols],
  queryFn: () => fetchStocks(trackedSymbols),
  refetchInterval: refreshInterval * 1000,
});

// Storage
localStorage.setItem(TRACKED_STORAGE_KEY, JSON.stringify(trackedSymbols));
```

### 📝 Customization
**Change refresh interval:**
```typescript
// src/state/SettingsContext.tsx
const DEFAULT_REFRESH_INTERVAL = 30; // seconds
```

**Modify card layout:**
```css
/* src/App.css */
.grid {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}
```

### 🧪 Tests
- `src/__tests__/api-client.test.ts`

---

## 2. Price Alerts

### 📍 Location
- **Page**: `src/pages/AlertsPage.tsx`
- **Route**: `/alerts`
- **Components**: `AlertForm`, `DeleteAlertDialog`
- **API**: `src/api/alerts.ts`
- **Hook**: `src/hooks/useAlerts.ts`

### 🎯 Features
- Create price alerts (above/below threshold)
- Edit existing alerts
- Delete alerts with confirmation
- Pause/activate alerts
- Email or webhook notifications
- Real-time price display
- Distance to threshold calculation
- Search and filter alerts
- Sort by multiple columns
- Empty state handling

### 🔧 How It Works
```typescript
// Using the hook
const { alerts, createAlert, updateAlert, deleteAlert } = useAlerts();

// Create alert
await createAlert({
  symbol: "AAPL",
  direction: "above",
  threshold: 200.50,
  channel: "email",
  target: "user@example.com",
  notes: "Optional note"
});

// Update alert
await updateAlert(alertId, { status: "paused" });

// Delete alert
await deleteAlert(alertId);
```

### 📝 Customization
**Add new notification channel:**
1. Update types in `src/types.ts`:
```typescript
export type AlertChannel = "email" | "webhook" | "sms"; // Add "sms"
```

2. Update form in `src/components/AlertForm.tsx`:
```tsx
<label className="radio-label">
  <input type="radio" name="channel" value="sms" />
  <span>📱 SMS</span>
</label>
```

3. Update backend to support new channel

**Change table columns:**
Edit `src/pages/AlertsPage.tsx` table headers and cells

**Modify distance threshold warning:**
```typescript
// src/pages/AlertsPage.tsx
const isNearThreshold = 
  currentPrice &&
  Math.abs(alert.threshold - currentPrice) / currentPrice < 0.05; // 5%
```

### 🧪 Tests
- `src/__tests__/alerts-api.test.ts` (12 tests)
- `src/__tests__/alerts-page.test.tsx` (9 tests)

### 📚 Documentation
- `ALERTS_DOCUMENTATION.md` - Complete feature guide
- `ALERTS_IMPLEMENTATION_SUMMARY.md` - Implementation details
- `public/openapi-alerts.yaml` - API specification

---

## 3. Stock Search

### 📍 Location
- **Component**: `src/components/SearchBar.tsx`
- **API**: `src/api/client.ts` (`searchSymbols`)
- **Used in**: HomePage, AlertForm

### 🎯 Features
- Autocomplete suggestions
- Debounced search (via React Query)
- Keyboard navigation
- Click to select
- Loading states

### 🔧 How It Works
```typescript
// Search query
const searchQuery = useQuery({
  queryKey: ["search", query],
  queryFn: () => searchSymbols(query.trim()),
  enabled: query.trim().length >= 2,
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// API call
export async function searchSymbols(query: string): Promise<SearchResult[]> {
  const url = `${API_BASE_URL}/v1/api/search-stock?query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  return handleResponse<SearchResult[]>(res);
}
```

### 📝 Customization
**Change minimum search length:**
```typescript
// src/components/SearchBar.tsx or AlertForm.tsx
enabled: query.trim().length >= 3, // Change from 2 to 3
```

**Modify suggestion display:**
```tsx
// src/components/SearchBar.tsx
<button onClick={() => onSelectSuggestion(result.symbol)}>
  <span>{result.symbol}</span>
  <small>{result.name} - {result.stockExchange}</small>
</button>
```

### 🧪 Tests
- `src/__tests__/api-client.test.ts`

---

## 4. Theme System

### 📍 Location
- **Context**: `src/state/ThemeContext.tsx`
- **Component**: `src/components/ThemeToggle.tsx`
- **Styles**: `src/App.css` (CSS variables)

### 🎯 Features
- Aurora theme (dark)
- Sunrise theme (light)
- Persistent selection (localStorage)
- Smooth transitions
- System-wide color variables

### 🔧 How It Works
```typescript
// Theme context
const [theme, setTheme] = useState<Theme>(() => {
  const stored = localStorage.getItem("stockly-theme");
  return (stored as Theme) || "aurora";
});

// Apply theme
useEffect(() => {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("stockly-theme", theme);
}, [theme]);
```

### 📝 Customization
**Add new theme:**
1. Define CSS variables in `src/App.css`:
```css
[data-theme="ocean"] {
  --bg-gradient-start: #0a192f;
  --bg-gradient-end: #112240;
  --accent-color: #64ffda;
  /* ... more variables */
}
```

2. Update type in `src/state/ThemeContext.tsx`:
```typescript
export type Theme = "aurora" | "sunrise" | "ocean";
```

3. Add toggle option in `src/components/ThemeToggle.tsx`

**Modify existing theme colors:**
Edit CSS variables in `src/App.css` under `[data-theme="aurora"]` or `[data-theme="sunrise"]`

### 🎨 Color Variables
```css
--bg-gradient-start      /* Background gradient start */
--bg-gradient-end        /* Background gradient end */
--text-primary           /* Primary text color */
--text-muted             /* Muted text color */
--surface-color          /* Card background */
--surface-border         /* Card border */
--accent-color           /* Primary accent */
--accent-soft            /* Soft accent background */
--accent-border          /* Accent border */
--warning-border         /* Warning color */
--warning-bg             /* Warning background */
--danger-border          /* Danger color */
--danger-bg              /* Danger background */
--input-bg               /* Input background */
--input-border           /* Input border */
```

---

## 5. Authentication

### 📍 Location
- **Context**: `src/state/AuthContext.tsx`
- **Page**: `src/pages/LoginPage.tsx`
- **Component**: `src/components/ProtectedRoute.tsx`
- **Function**: `functions/api/login.ts`

### 🎯 Features
- Login form with validation
- Session persistence (localStorage)
- Protected routes
- Fallback credentials (development)
- Cloudflare Function authentication
- Auto-redirect after login

### 🔧 How It Works
```typescript
// Login
const login = async (username: string, password: string) => {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  
  if (response.ok) {
    setIsAuthenticated(true);
    localStorage.setItem("stockly-auth", "true");
  }
};

// Protected route
<ProtectedRoute>
  <AppLayout />
</ProtectedRoute>
```

### 📝 Customization
**Add JWT tokens:**
1. Update backend to return JWT
2. Store token in localStorage
3. Add Authorization header to API calls:
```typescript
headers: {
  "Authorization": `Bearer ${token}`,
  "Content-Type": "application/json"
}
```

**Add user roles:**
1. Return role from `/api/login`
2. Store in AuthContext
3. Check role in ProtectedRoute

### 🔐 Security Notes
- Credentials stored as Cloudflare secrets
- Session token in localStorage (consider httpOnly cookies for production)
- No sensitive data in frontend code
- HTTPS enforced in production

### 🧪 Tests
- `src/__tests__/auth-context.test.tsx`

---

## 6. Settings

### 📍 Location
- **Context**: `src/state/SettingsContext.tsx`
- **Page**: `src/pages/SettingsPage.tsx`

### 🎯 Features
- Configurable auto-refresh interval
- Persistent settings (localStorage)
- Real-time updates

### 🔧 How It Works
```typescript
// Settings context
const [refreshInterval, setRefreshInterval] = useState<number>(() => {
  const stored = localStorage.getItem("stockly-refresh-interval");
  return stored ? parseInt(stored, 10) : 30;
});

// Usage in components
const { refreshInterval } = useSettings();
```

### 📝 Customization
**Add new settings:**
1. Update context:
```typescript
// src/state/SettingsContext.tsx
const [newSetting, setNewSetting] = useState<boolean>(true);
```

2. Add to localStorage
3. Update SettingsPage UI
4. Use in components

**Change default interval:**
```typescript
const DEFAULT_REFRESH_INTERVAL = 60; // 60 seconds
```

### 🧪 Tests
- `src/__tests__/settings-context.test.tsx`

---

## 7. Admin Panel

### 📍 Location
- **Pages**: 
  - `src/pages/AdminSettingsPage.tsx`
  - `src/pages/AdminMonitoringPage.tsx`
  - `src/pages/AdminDocsPage.tsx`
- **API**: `src/api/adminConfig.ts`
- **Hooks**: `src/hooks/useAdminConfig.ts`, `src/hooks/useMonitoringSnapshot.ts`

### 🎯 Features
- Backend configuration management
- Real-time monitoring metrics
- Feature flags
- OpenAPI documentation viewer
- Fallback data for offline mode

### 🔧 How It Works
```typescript
// Get config
const { config, isLoading } = useAdminConfig();

// Update config
await updateAdminConfig({
  pollingIntervalSec: 60,
  featureFlags: { alerting: true }
});

// Get metrics
const { snapshot } = useMonitoringSnapshot();
```

### 📝 Customization
**Add new config field:**
1. Update type in `src/api/adminConfig.ts`:
```typescript
export type AdminConfig = {
  // existing fields...
  newField: string;
};
```

2. Update fallback config
3. Add UI in AdminSettingsPage
4. Update backend to handle new field

**Add new metric:**
1. Update MonitoringSnapshot type
2. Update fallback metrics
3. Display in AdminMonitoringPage

### 🧪 Tests
- `src/__tests__/useAdminConfig.test.tsx`
- `src/__tests__/useMonitoringSnapshot.test.tsx`
- `src/__tests__/admin-settings-page.test.tsx`
- `src/__tests__/admin-monitoring-page.test.tsx`
- `src/__tests__/admin-docs-page.test.tsx`

---

## 8. API Documentation

### 📍 Location
- **Page**: `src/pages/DocsPage.tsx`
- **Admin Page**: `src/pages/AdminDocsPage.tsx`
- **Component**: Swagger UI
- **Specs**: `public/openapi-alerts.yaml`

### 🎯 Features
- Interactive API documentation
- Try-it-out functionality
- Request/response examples
- Schema definitions
- Swagger UI integration

### 🔧 How It Works
```typescript
// Fetch OpenAPI spec
const { spec } = useOpenApiSpec();

// Render Swagger UI
<SwaggerUI 
  spec={spec} 
  docExpansion="list" 
  defaultModelsExpandDepth={1} 
/>
```

### 📝 Customization
**Update API documentation:**
1. Edit `public/openapi-alerts.yaml`
2. Or update backend to serve updated spec
3. Refresh page to see changes

**Customize Swagger UI:**
```typescript
<SwaggerUI 
  spec={spec}
  docExpansion="full"        // Expand all sections
  defaultModelsExpandDepth={2} // Show nested models
  displayRequestDuration={true} // Show request timing
  filter={true}              // Enable search filter
/>
```

### 🧪 Tests
- `src/__tests__/useOpenApiSpec.test.tsx`
- `src/__tests__/admin-docs-page.test.tsx`

---

## 🎨 UI Components Reference

### Reusable Components

#### SearchBar
```tsx
<SearchBar
  query={query}
  onQueryChange={setQuery}
  onSubmit={handleAddSymbol}
  suggestions={searchQuery.data ?? []}
  onSelectSuggestion={handleSelectSuggestion}
  loading={searchQuery.isFetching}
/>
```

#### StockCard
```tsx
<StockCard quote={quote} />
```

#### TrackedSymbols
```tsx
<TrackedSymbols
  symbols={trackedSymbols}
  onRemove={handleRemoveSymbol}
/>
```

#### ThemeToggle
```tsx
<ThemeToggle />
```

#### AlertForm
```tsx
<AlertForm
  alert={editingAlert}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  isSubmitting={isSubmitting}
/>
```

#### DeleteAlertDialog
```tsx
<DeleteAlertDialog
  alert={alert}
  onConfirm={handleDelete}
  onCancel={handleCancel}
  isDeleting={isDeleting}
/>
```

---

## 🔌 API Integration Patterns

### React Query Pattern
```typescript
// Query (GET)
const { data, isLoading, error } = useQuery({
  queryKey: ["resource", id],
  queryFn: () => fetchResource(id),
  staleTime: 30 * 1000,
});

// Mutation (POST/PUT/DELETE)
const mutation = useMutation({
  mutationFn: createResource,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["resources"] });
  },
});
```

### Error Handling
```typescript
async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || `Request failed with ${res.status}`);
  }
  return res.json();
}
```

### Loading States
```typescript
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
return <DataDisplay data={data} />;
```

---

## 🎯 Common Patterns

### Form Validation
```typescript
const validate = (): boolean => {
  const errors: Record<string, string> = {};
  
  if (!field.trim()) {
    errors.field = "Field is required";
  }
  
  setErrors(errors);
  return Object.keys(errors).length === 0;
};
```

### Toast Notifications
```typescript
const [toast, setToast] = useState<{
  message: string;
  type: "success" | "error";
} | null>(null);

const showToast = (message: string, type: "success" | "error") => {
  setToast({ message, type });
  setTimeout(() => setToast(null), 3000);
};
```

### Modal Management
```typescript
const [showModal, setShowModal] = useState(false);
const [editingItem, setEditingItem] = useState<Item | null>(null);

// Open for create
const handleCreate = () => setShowModal(true);

// Open for edit
const handleEdit = (item: Item) => setEditingItem(item);

// Close
const handleClose = () => {
  setShowModal(false);
  setEditingItem(null);
};
```

---

## 📊 Performance Tips

### Memoization
```typescript
const filteredData = useMemo(() => {
  return data.filter(item => item.status === filter);
}, [data, filter]);
```

### Debouncing
```typescript
// Use React Query's built-in stale time
const searchQuery = useQuery({
  queryKey: ["search", query],
  queryFn: () => search(query),
  enabled: query.length >= 2,
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### Optimistic Updates
```typescript
const mutation = useMutation({
  mutationFn: updateItem,
  onMutate: async (newItem) => {
    await queryClient.cancelQueries({ queryKey: ["items"] });
    const previousItems = queryClient.getQueryData(["items"]);
    queryClient.setQueryData(["items"], (old) => [...old, newItem]);
    return { previousItems };
  },
  onError: (err, newItem, context) => {
    queryClient.setQueryData(["items"], context.previousItems);
  },
});
```

---

## 🚀 Adding New Features

### Checklist
1. ✅ Create types in `src/types.ts`
2. ✅ Create API client in `src/api/`
3. ✅ Create custom hook in `src/hooks/`
4. ✅ Create page component in `src/pages/`
5. ✅ Add route in `src/App.tsx`
6. ✅ Add navigation link in `src/components/Header.tsx`
7. ✅ Add styles in `src/App.css`
8. ✅ Write tests in `src/__tests__/`
9. ✅ Update documentation
10. ✅ Test thoroughly

---

**For more details on specific features, see the dedicated documentation files in the project root.**






