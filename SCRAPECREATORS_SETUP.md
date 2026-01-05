# ScrapeCreators Social Analytics Integration

This feature replaces the manual "Social Stats" with automated analytics powered by [ScrapeCreators](https://scrapecreators.com/).

## Environment Variables

Add the following to your environment:

```env
SCRAPECREATORS_API_KEY=your_api_key_here
SOCIAL_REFRESH_COOLDOWN_MINUTES=30
```

## Features

### For Clients
- **Connect Accounts**: Add Instagram, TikTok, or YouTube handles in the Analytics page.
- **Manual Refresh**: Click "Update Now" to trigger a fresh scrape and store a metric snapshot.
- **Throttling**: Refreshes are limited to once every 30 minutes (configurable via `SOCIAL_REFRESH_COOLDOWN_MINUTES`).
- **Growth Tracking**: View historical growth charts built from snapshots.

### For Admins
- **Full Visibility**: View all client social accounts and their sync status.
- **Admin Refresh**: Admins can trigger refreshes for any client account. The 30-minute cooldown is bypassed for admin-triggered refreshes.
- **Error Tracking**: See the last scrape error if a refresh fails.

## Implementation Details

- **Database**: 
  - `social_accounts`: Stores handle, platform, and sync metadata.
  - `social_account_metrics_snapshots`: Stores the actual metric values (followers, views, etc.) captured at each refresh.
- **Service Layer**: `server/scrapeCreatorsService.ts` handles the REST API calls.
- **API Endpoints**: `server/routes/social.ts` manages account lifecycle and refresh logic.

## Testing Locally

1. Set `SCRAPECREATORS_API_KEY` in your environment.
2. Run the application.
3. As a client, go to **Analytics**.
4. Use the **Connect Account** button to add a handle (e.g., `tiktok` with handle `tiktok`).
5. Click **Update Now**.
6. Verify that metrics appear and a new snapshot is created in the database.
7. Try clicking **Update Now** again immediately; you should see a message about the 30-minute cooldown.

