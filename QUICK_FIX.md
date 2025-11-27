# 🔧 Quick Fix for Disappearing Leads

## The Problem
Your leads appear briefly then disappear - this is a React Query cache issue.

## Instant Fix (Try These in Order):

### 1. Hard Refresh Browser
```
Press: Ctrl + Shift + R (Windows/Linux)
Or: Cmd + Shift + R (Mac)
```

### 2. Clear Browser Cache & Cookies
- Open DevTools (F12)
- Right-click the refresh button
- Select "Empty Cache and Hard Reload"

### 3. Clear React Query Cache
Open browser console (F12) and run:
```javascript
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### 4. Check Browser Console for Errors
- Press F12
- Go to Console tab
- Look for any red errors when loading /leads page
- Screenshot and send me any errors you see

### 5. Check Network Tab
- Press F12
- Go to Network tab
- Refresh the page
- Look for the `/api/leads` request
- Check if it returns 200 OK with data
- If it's 403 or 401, it's a permissions issue

## Most Likely Causes:

### A. Permission Issue
The `/api/leads` endpoint requires `canManageLeads` permission. 
Your admin user should have this, but check:

```sql
-- Run in database console
SELECT id, username, role, custom_permissions 
FROM users 
WHERE username = 'your-username';
```

### B. React Query Stale Data
The query might be returning cached empty data. 

### C. Frontend Filter Issue
The leads might be filtered out by the UI filters.

## Temporary Workaround

Add this to the leads query to force fresh data:

```typescript
const { data: leads = [], isLoading } = useQuery<Lead[]>({
  queryKey: ["/api/leads"],
  staleTime: 0,  // Always fetch fresh
  cacheTime: 0,  // Don't cache
  refetchOnMount: true,
  refetchOnWindowFocus: true,
});
```

## Let Me Know:
1. What do you see in browser console?
2. What does Network tab show for `/api/leads`?
3. Does hard refresh work?

