# Stock Details Page - Performance Optimization

## Issue Analysis

When clicking on a stock, the page was taking too long to load. This could be due to:

1. **Backend API latency** - `/v1/api/get-stock-details` endpoint response time
2. **Frontend optimizations** - Missing prefetching, no timeout, no request cancellation
3. **Large payload** - Chart data for all periods (1D, 1W, 1M, 3M, 1Y, ALL) in single response

## Optimizations Implemented

### 1. Prefetching on Hover/Touch ✅
- **Location**: `src/components/StockCard.tsx`
- **Implementation**: Prefetches stock details when user hovers over or touches a stock card
- **Benefit**: Data is ready when user clicks, reducing perceived load time

```typescript
const handleMouseEnter = () => {
  queryClient.prefetchQuery({
    queryKey: ["stockDetails", quote.symbol.toUpperCase()],
    queryFn: () => fetchStockDetails(quote.symbol.toUpperCase()),
    staleTime: 5 * 60 * 1000,
  });
};
```

### 2. Request Timeout ✅
- **Location**: `src/api/stockDetails.ts`
- **Implementation**: 30-second timeout with AbortController
- **Benefit**: Prevents hanging requests, shows error after reasonable time

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);
```

### 3. Optimized React Query Settings ✅
- **Location**: `src/hooks/useStockDetails.ts`
- **Changes**:
  - Reduced retries from 3 to 2 (faster failure)
  - Reduced max retry delay from 30s to 10s
  - Disabled `refetchOnWindowFocus` (uses cache)
  - Disabled `refetchOnMount` (uses cache if available)
- **Benefit**: Faster response, better caching behavior

### 4. Clickable Stock Cards ✅
- **Location**: `src/components/StockCard.tsx`
- **Implementation**: Wrapped stock card in Link component
- **Benefit**: Users can now click directly on stock cards to navigate

### 5. Visual Feedback ✅
- **Location**: `src/App.css`
- **Implementation**: Hover effects and transitions on stock cards
- **Benefit**: Better UX, indicates interactivity

## How to Diagnose Backend vs Frontend Issues

### Check Browser DevTools

1. **Network Tab**:
   - Open DevTools → Network tab
   - Click on a stock
   - Look for `/v1/api/get-stock-details` request
   - Check **Time** column:
     - **< 1s**: Good (frontend optimized)
     - **1-3s**: Acceptable (may be backend)
     - **> 3s**: Likely backend issue

2. **Performance Tab**:
   - Record performance while clicking stock
   - Check for:
     - Long tasks
     - Layout shifts
     - JavaScript execution time

### Backend API Testing

Test the API directly:

```bash
# Test API response time
time curl "https://stockly-api.ahmednasser1993.workers.dev/v1/api/get-stock-details?symbol=AAPL"
```

If this takes > 3 seconds, it's a **backend issue**.

### Frontend Indicators

If you see:
- ✅ Loading skeleton appears immediately → Frontend is working
- ✅ Prefetching works (hover shows faster load) → Frontend optimization working
- ❌ Long delay before skeleton → Navigation/routing issue
- ❌ Skeleton shows but data takes long → Backend API issue

## Expected Performance

### With Prefetching (Hover/Touch)
- **First click after hover**: ~100-500ms (from cache)
- **Subsequent clicks**: Instant (from cache)

### Without Prefetching (Direct click)
- **First load**: Depends on backend (should be < 3s)
- **Cached load**: Instant (5 min cache)

## Monitoring

### Check Network Timing

In browser console:
```javascript
// Check API response time
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('get-stock-details'))
  .forEach(r => console.log(r.name, r.duration + 'ms'));
```

### Backend Metrics to Check

1. **API Response Time**: Should be < 2s for stock details
2. **Database Query Time**: If using database
3. **External API Calls**: FMP API response time
4. **Caching**: Is backend caching responses?

## Recommendations

### If Backend is Slow:

1. **Backend Optimizations**:
   - Add caching layer (Redis/KV)
   - Optimize database queries
   - Batch external API calls
   - Use CDN for static data

2. **Reduce Payload**:
   - Only return chart data for selected period
   - Paginate news/articles
   - Compress responses

### If Frontend is Slow:

1. **Code Splitting**:
   - Lazy load StockDetailsPage
   - Split ECharts into separate chunk

2. **Optimize Rendering**:
   - Memoize expensive components
   - Virtualize long lists
   - Defer non-critical rendering

## Current Status

✅ **Frontend optimizations complete**:
- Prefetching implemented
- Timeout added (30s)
- Request cancellation
- Optimized React Query settings
- Clickable stock cards
- Visual feedback

⚠️ **If still slow, likely backend issue**:
- Check backend API response time
- Monitor backend logs
- Consider backend caching
- Optimize database queries

---

**Last Updated**: After performance optimization implementation

