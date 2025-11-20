# Webapp Stockly - Stock Details Page Implementation Plan

> **Comprehensive analysis and implementation plan for the Stock Details screen (React + Vite + Radix + React Query + Tailwind)**

---

## 📋 Table of Contents

1. [API Analysis](#api-analysis)
2. [Architecture Overview](#architecture-overview)
3. [Data Models (TypeScript)](#data-models-typescript)
4. [Hooks & Services](#hooks--services)
5. [UI Components](#ui-components)
6. [State Management](#state-management)
7. [Implementation Checklist](#implementation-checklist)
8. [File Structure](#file-structure)
9. [Dependencies](#dependencies)
10. [Styling Guide](#styling-guide)

---

## 🔍 API Analysis

### Endpoint Specification

**Endpoint:** `GET /v1/api/get-stock-details?symbol=AMZN`

**Base URL:** `https://stockly-api.ahmednasser1993.workers.dev`

**Response Structure (EXACT CONTRACT):**
```json
{
  "symbol": "AMZN",
  "profile": {
    "companyName": "Amazon.com Inc.",
    "industry": "Internet Retail",
    "sector": "Consumer Cyclical",
    "description": "Amazon.com, Inc. engages in the retail sale of consumer products...",
    "website": "https://www.amazon.com",
    "image": "https://financialmodelingprep.com/image-stock/AMZN.png"
  },
  "quote": {
    "price": 145.50,
    "change": 1.30,
    "changesPercentage": 0.90,
    "dayHigh": 146.20,
    "dayLow": 143.80,
    "open": 144.50,
    "previousClose": 144.20,
    "volume": 45234567,
    "marketCap": 1500000000000
  },
  "chart": {
    "1D": [
      {
        "date": "2025-01-15T09:30:00Z",
        "price": 144.50,
        "volume": 1234567
      }
    ],
    "1W": [...],
    "1M": [...],
    "3M": [...],
    "1Y": [...],
    "ALL": [...]
  },
  "financials": {
    "income": [
      {
        "date": "2024-09-30",
        "revenue": 143100000000,
        "netIncome": 9870000000,
        "eps": 0.94
      }
    ],
    "keyMetrics": {
      "peRatio": 45.2,
      "priceToBook": 8.5,
      "debtToEquity": 0.85
    },
    "ratios": {
      "currentRatio": 1.15,
      "quickRatio": 0.95,
      "debtToEquity": 0.85
    }
  },
  "news": [
    {
      "title": "Amazon Reports Strong Q3 Earnings",
      "source": "Reuters",
      "publishedDate": "2025-01-15T10:00:00Z",
      "url": "https://example.com/news/1",
      "image": "https://example.com/image.jpg",
      "summary": "Amazon exceeded analyst expectations..."
    }
  ],
  "peers": [
    {
      "symbol": "WMT",
      "price": 165.30,
      "change": 2.10,
      "changesPercentage": 1.29
    }
  ]
}
```

### API Requirements

- ✅ **Never call FMP directly** - Only use `/v1/api/get-stock-details`
- ✅ **Mobile-first webapp** - PWA-like experience
- ✅ **React Query caching** - Automatic caching and refetching
- ✅ **Error handling** - Graceful degradation for missing fields
- ✅ **Retry logic** - Built into React Query

---

## 🏗️ Architecture Overview

### Component Hierarchy

```
StockDetailsPage
├── StockDetailsHeader (Sticky)
│   ├── BackButton
│   ├── Symbol & Company Name
│   ├── Price & Change
│   ├── WatchlistToggle (Radix)
│   └── AlertButton
├── ChartSection
│   ├── PeriodTabs (Radix Tabs: 1D, 1W, 1M, 3M, 1Y, ALL)
│   └── Chart Component (ECharts)
├── QuickStatsGrid
│   └── KeyStatCard (x6)
├── CompanyOverview
│   ├── Sector/Industry
│   ├── Website Link
│   └── Description (Expandable)
├── FinancialsSection
│   ├── FinancialTabs (Radix Tabs: Income, Key Metrics, Ratios)
│   └── FinancialCard (Stacked cards, NOT tables)
├── NewsSection
│   └── NewsCard (Vertical list)
└── PeersSection
    └── PeersList (Horizontal scroll)
```

### Data Flow

```
User navigates to /stocks/AMZN
    ↓
useStockDetails("AMZN") hook
    ↓
React Query fetches /v1/api/get-stock-details?symbol=AMZN
    ↓
Parse JSON → StockDetails type
    ↓
React Query caches data
    ↓
Components render with data
    ↓
User interacts (tabs, expand, etc.)
    ↓
Local state updates (no API call)
```

---

## 📦 Data Models (TypeScript)

### Type Definitions

```typescript
// src/types/stockDetails.ts

export type StockDetails = {
  symbol: string;
  profile: StockProfile;
  quote: StockQuote;
  chart: StockChart;
  financials: StockFinancials;
  news: StockNews[];
  peers: StockPeer[];
};

export type StockProfile = {
  companyName: string;
  industry?: string;
  sector?: string;
  description?: string;
  website?: string;
  image?: string;
};

export type StockQuote = {
  price: number;
  change: number;
  changesPercentage: number;
  dayHigh: number;
  dayLow: number;
  open: number;
  previousClose: number;
  volume: number;
  marketCap: number;
};

export type StockChart = {
  "1D": ChartDataPoint[];
  "1W": ChartDataPoint[];
  "1M": ChartDataPoint[];
  "3M": ChartDataPoint[];
  "1Y": ChartDataPoint[];
  "ALL": ChartDataPoint[];
};

export type ChartDataPoint = {
  date: string; // ISO 8601
  price: number;
  volume?: number;
};

export type StockFinancials = {
  income: IncomeStatement[];
  keyMetrics?: KeyMetrics;
  ratios?: Ratios;
};

export type IncomeStatement = {
  date: string; // YYYY-MM-DD
  revenue?: number;
  netIncome?: number;
  eps?: number;
  grossProfit?: number;
};

export type KeyMetrics = {
  peRatio?: number;
  priceToBook?: number;
  debtToEquity?: number;
  currentRatio?: number;
  roe?: number;
  roa?: number;
};

export type Ratios = {
  currentRatio?: number;
  quickRatio?: number;
  debtToEquity?: number;
  debtToAssets?: number;
  interestCoverage?: number;
};

export type StockNews = {
  title: string;
  source: string;
  publishedDate: string; // ISO 8601
  url: string;
  image?: string;
  summary?: string;
};

export type StockPeer = {
  symbol: string;
  price: number;
  change: number;
  changesPercentage: number;
};

// Chart period type
export type ChartPeriod = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";

// Financial tab type
export type FinancialTab = "income" | "keyMetrics" | "ratios";
```

---

## 🔧 Hooks & Services

### useStockDetails Hook

```typescript
// src/hooks/useStockDetails.ts

import { useQuery } from "@tanstack/react-query";
import { fetchStockDetails } from "../api/stockDetails";
import type { StockDetails } from "../types/stockDetails";

export function useStockDetails(symbol: string) {
  return useQuery<StockDetails, Error>({
    queryKey: ["stockDetails", symbol.toUpperCase()],
    queryFn: () => fetchStockDetails(symbol.toUpperCase()),
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
```

### API Service

```typescript
// src/api/stockDetails.ts

import { API_BASE_URL } from "./client";
import type { StockDetails } from "../types/stockDetails";

export async function fetchStockDetails(symbol: string): Promise<StockDetails> {
  const url = new URL(`${API_BASE_URL}/v1/api/get-stock-details`);
  url.searchParams.set("symbol", symbol.toUpperCase());

  const response = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Failed to fetch stock details: ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data as StockDetails;
}
```

---

## 🎨 UI Components

### Component Specifications

#### 1. StockDetailsPage
- **Layout:** Single column, max-width centered
- **Container:** `max-w-xl mx-auto px-4`
- **Sections:** Vertical stack with spacing
- **Sticky Header:** `sticky top-0 z-50 bg-white shadow-sm`

#### 2. StockDetailsHeader
- **Height:** Auto (flex column)
- **Background:** White with shadow
- **Layout:** Flex column on mobile
- **Elements:**
  - Back button (left)
  - Symbol + Company name (center)
  - Price + Change (large, colored)
  - Watchlist toggle + Alert button (right)

#### 3. ChartSection
- **Height:** 300px (mobile), 400px (desktop)
- **Chart Library:** ECharts via `echarts-for-react`
- **Tabs:** Radix Tabs for period selection
- **Features:**
  - Responsive container
  - Smooth transitions
  - Tooltip on hover
  - Y-axis labels visible

#### 4. KeyStatCard
- **Size:** Grid item (2 columns on mobile)
- **Style:** `rounded-xl shadow-sm p-4 bg-white`
- **Content:** Icon, Label, Value
- **Icons:** Heroicons or Lucide React

#### 5. CompanyOverview
- **Layout:** Card with padding
- **Sections:** Sector, Industry, Website, Description
- **Description:** 3-line clamp with "Show More" expand

#### 6. FinancialCard
- **Layout:** Stacked cards (NOT tables)
- **Style:** Card per row/item
- **Content:** Label + Value pairs

#### 7. NewsCard
- **Height:** Auto (flex row)
- **Layout:** Thumbnail (left) + Content (right)
- **Thumbnail:** 80x80px rounded
- **Content:** Title, Source, Date, Summary
- **Tap:** Opens URL in new tab

#### 8. PeersList
- **Layout:** Horizontal scroll
- **Items:** PeerCard components
- **Navigation:** Click navigates to `/stocks/:symbol`

---

## 📱 State Management

### React Query Setup

```typescript
// Already configured in main.tsx or App.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});
```

### Local State (useState)

- Chart period selection
- Description expanded state
- Financial tab selection
- Watchlist toggle state

---

## ✅ Implementation Checklist

### Phase 1: Foundation
- [ ] Create TypeScript types for StockDetails
- [ ] Implement `fetchStockDetails` API function
- [ ] Create `useStockDetails` React Query hook
- [ ] Set up routing for `/stocks/:symbol`
- [ ] Add ECharts dependency

### Phase 2: Core Page
- [ ] Create StockDetailsPage scaffold
- [ ] Implement StockDetailsHeader (sticky)
- [ ] Add back button navigation
- [ ] Implement watchlist toggle (Radix)
- [ ] Add alert button

### Phase 3: Chart Section
- [ ] Create Chart component wrapper
- [ ] Implement period tabs (Radix Tabs)
- [ ] Configure ECharts with mobile-responsive options
- [ ] Add tooltip and interactions
- [ ] Implement smooth transitions

### Phase 4: Content Sections
- [ ] Create KeyStatCard component
- [ ] Build QuickStatsGrid (2-column)
- [ ] Implement CompanyOverview with expandable description
- [ ] Create FinancialCard component
- [ ] Build FinancialsSection with Radix Tabs
- [ ] Implement NewsCard component
- [ ] Build NewsSection (vertical list)
- [ ] Create PeerCard component
- [ ] Implement PeersList (horizontal scroll)

### Phase 5: Polish
- [ ] Add skeleton loaders
- [ ] Implement error UI with retry
- [ ] Add loading states
- [ ] Implement smooth animations (Tailwind transitions)
- [ ] Add accessibility labels
- [ ] Test responsive breakpoints
- [ ] Optimize images (lazy loading)

### Phase 6: Testing
- [ ] Unit tests for API function
- [ ] Unit tests for hooks
- [ ] Component tests for UI
- [ ] Integration tests for full flow
- [ ] E2E tests for navigation

---

## 📁 File Structure

```
src/
├── types/
│   └── stockDetails.ts
├── api/
│   └── stockDetails.ts
├── hooks/
│   └── useStockDetails.ts
├── pages/
│   └── StockDetailsPage.tsx
├── components/
│   ├── Chart.tsx
│   ├── KeyStatCard.tsx
│   ├── CompanyOverview.tsx
│   ├── NewsCard.tsx
│   ├── PeersList.tsx
│   ├── PeerCard.tsx
│   ├── FinancialCard.tsx
│   ├── FinancialsSection.tsx
│   ├── SectionHeader.tsx
│   └── StockDetailsHeader.tsx
├── utils/
│   ├── formatters.ts
│   └── constants.ts
└── App.tsx (add route)
```

---

## 📦 Dependencies

### Required Packages

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "@tanstack/react-query": "^5.0.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toggle": "^1.0.3",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-toast": "^1.1.5",
    "echarts": "^5.4.3",
    "echarts-for-react": "^3.0.2",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.3.0",
    "vite": "^7.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

---

## 🎨 Styling Guide

### Tailwind Configuration

```javascript
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          light: '#3B82F6',
          dark: '#1E40AF',
        },
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}
```

### Color Palette

```typescript
// Tailwind classes
const colors = {
  primary: 'bg-blue-600 text-white', // #2563EB
  primaryLight: 'bg-blue-500',
  primaryDark: 'bg-blue-700',
  success: 'text-green-600', // Positive change
  danger: 'text-red-600', // Negative change
  background: 'bg-gray-50',
  surface: 'bg-white',
  textPrimary: 'text-gray-900',
  textSecondary: 'text-gray-600',
  textMuted: 'text-gray-400',
  border: 'border-gray-200',
};
```

### Spacing & Layout

```typescript
// Common Tailwind patterns
const layout = {
  container: 'max-w-xl mx-auto px-4',
  card: 'bg-white rounded-xl shadow-sm p-4',
  grid: 'grid grid-cols-2 gap-3',
  flex: 'flex items-center justify-between',
  sticky: 'sticky top-0 z-50 bg-white shadow-sm',
  section: 'mb-6',
};
```

### Responsive Breakpoints

```typescript
// Mobile-first approach
const breakpoints = {
  sm: '640px',   // Small tablets
  md: '768px',   // Tablets
  lg: '1024px', // Desktop
  xl: '1280px',  // Large desktop
};
```

---

## 📊 Chart Implementation (ECharts)

### ECharts Configuration

```typescript
// src/components/Chart.tsx

import ReactECharts from 'echarts-for-react';
import type { ChartDataPoint } from '../types/stockDetails';

interface ChartProps {
  data: ChartDataPoint[];
  period: string;
}

export function Chart({ data, period }: ChartProps) {
  const option = {
    grid: {
      left: '10%',
      right: '10%',
      top: '10%',
      bottom: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map((point) => {
        const date = new Date(point.date);
        // Format based on period
        if (period === '1D') {
          return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      axisLabel: {
        fontSize: 10,
        rotate: period === 'ALL' ? 45 : 0,
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => `$${value.toFixed(2)}`,
        fontSize: 10,
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#E5E7EB',
        },
      },
    },
    series: [
      {
        type: 'line',
        data: data.map((point) => point.price),
        smooth: true,
        lineStyle: {
          color: '#2563EB',
          width: 2,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(37, 99, 235, 0.3)' },
              { offset: 1, color: 'rgba(37, 99, 235, 0.0)' },
            ],
          },
        },
        symbol: 'none',
      },
    ],
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const point = data[params[0].dataIndex];
        return `
          <div class="p-2">
            <div class="font-semibold">$${params[0].value.toFixed(2)}</div>
            <div class="text-sm text-gray-600">${new Date(point.date).toLocaleString()}</div>
          </div>
        `;
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      textStyle: {
        color: '#1F2937',
      },
    },
  };

  return (
    <div className="w-full h-[300px] md:h-[400px]">
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
}
```

---

## 🚨 Error Handling Strategy

### Error Types

1. **Network Error**
   - Show error message
   - Display retry button
   - Use React Query's `refetch`

2. **API Error (4xx/5xx)**
   - Show user-friendly message
   - Provide retry option
   - Log error for debugging

3. **Missing Data**
   - Gracefully handle undefined/null
   - Show "N/A" for missing fields
   - Don't break UI

### Error UI Component

```typescript
// In StockDetailsPage.tsx
{isError && (
  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
    <div className="flex items-center gap-2 mb-2">
      <AlertCircle className="w-5 h-5 text-red-600" />
      <h3 className="font-semibold text-red-900">Failed to load stock details</h3>
    </div>
    <p className="text-sm text-red-700 mb-4">{error?.message || 'Unknown error'}</p>
    <button
      onClick={() => refetch()}
      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
    >
      Retry
    </button>
  </div>
)}
```

---

## ⚡ Performance Optimizations

### 1. Code Splitting
```typescript
// Lazy load StockDetailsPage
const StockDetailsPage = lazy(() => import('./pages/StockDetailsPage'));
```

### 2. Image Optimization
```typescript
// Lazy load images
<img
  src={profile.image}
  alt={profile.companyName}
  loading="lazy"
  className="w-16 h-16 rounded-lg object-cover"
/>
```

### 3. Memoization
```typescript
// Memoize expensive calculations
const formattedPrice = useMemo(
  () => formatCurrency(quote.price),
  [quote.price]
);
```

### 4. Virtual Scrolling (if needed)
- For long news lists, consider `react-window` or `react-virtual`

---

## 🎯 Key Implementation Notes

1. **Mobile-First Design**
   - Start with mobile layout
   - Use Tailwind responsive classes
   - Test on real devices

2. **Accessibility**
   - Semantic HTML
   - ARIA labels
   - Keyboard navigation
   - Screen reader support

3. **Performance**
   - Lazy load components
   - Optimize images
   - Use React.memo where appropriate
   - Minimize re-renders

4. **Error Resilience**
   - Handle all null/undefined cases
   - Graceful degradation
   - User-friendly error messages

5. **Responsive Design**
   - Test on multiple screen sizes
   - Use Tailwind breakpoints
   - Ensure touch targets are 44x44px minimum

---

## 📝 Component Code Structure Template

### Example: KeyStatCard

```typescript
// src/components/KeyStatCard.tsx

import { LucideIcon } from 'lucide-react';

interface KeyStatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  format?: (val: number) => string;
}

export function KeyStatCard({ icon: Icon, label, value, format }: KeyStatCardProps) {
  const displayValue = typeof value === 'number' && format 
    ? format(value) 
    : value;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-5 h-5 text-blue-600" />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className="text-lg font-semibold text-gray-900">
        {displayValue}
      </div>
    </div>
  );
}
```

---

## 🔄 Routing Setup

### Add Route to App.tsx

```typescript
// src/App.tsx
import { Route, Routes } from 'react-router-dom';
import { StockDetailsPage } from './pages/StockDetailsPage';

function App() {
  return (
    <Routes>
      {/* ... other routes */}
      <Route path="/stocks/:symbol" element={<StockDetailsPage />} />
    </Routes>
  );
}
```

### Navigation Helper

```typescript
// src/utils/navigation.ts
import { useNavigate } from 'react-router-dom';

export function useStockNavigation() {
  const navigate = useNavigate();
  
  return {
    goToStock: (symbol: string) => navigate(`/stocks/${symbol}`),
    goBack: () => navigate(-1),
  };
}
```

---

## 🧪 Testing Strategy

### Unit Tests
- API function (`fetchStockDetails`)
- Hook (`useStockDetails`)
- Formatters and utilities

### Component Tests
- KeyStatCard rendering
- NewsCard interactions
- Chart rendering
- Tabs switching

### Integration Tests
- Full page load
- Navigation flow
- Error handling
- Retry functionality

---

## 📱 Mobile-Specific Considerations

1. **Touch Targets**
   - Minimum 44x44px
   - Adequate spacing between buttons

2. **Scrolling**
   - Smooth scrolling
   - Sticky headers
   - Horizontal scroll for peers

3. **Performance**
   - Optimize for 60fps
   - Lazy load images
   - Minimize layout shifts

4. **Offline Support**
   - React Query cache
   - Show cached data when offline
   - Display offline indicator

---

## 🚀 Deployment Checklist

- [ ] Build passes without errors
- [ ] All TypeScript types resolved
- [ ] No console errors
- [ ] Responsive on mobile devices
- [ ] Accessibility tested
- [ ] Performance optimized
- [ ] Error handling tested
- [ ] Cloudflare Pages deployment configured

---

**End of Implementation Plan**

