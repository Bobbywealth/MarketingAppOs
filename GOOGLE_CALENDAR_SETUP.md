# Google Calendar Integration Setup

This guide will help you set up Google Calendar sync for your Marketing OS app.

## Prerequisites
- A Google Cloud Platform account
- Your Marketing OS app deployed and running

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name your project (e.g., "Marketing OS Calendar")
4. Click "Create"

## Step 2: Enable Google Calendar API

1. In your Google Cloud project, go to **APIs & Services** → **Library**
2. Search for "Google Calendar API"
3. Click on it and click **"Enable"**

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. If prompted, configure the OAuth consent screen:
   - Choose **"External"** (unless you have a Google Workspace)
   - Fill in:
     - App name: "Marketing OS"
     - User support email: your email
     - Developer contact: your email
   - Click **"Save and Continue"**
   - Skip scopes for now
   - Add test users if needed
   - Click **"Save and Continue"**

4. Back to creating OAuth client ID:
   - Application type: **"Web application"**
   - Name: "Marketing OS Web Client"
   - Authorized redirect URIs: Add these URLs:
     - `http://localhost:5000/api/google/callback` (for local dev)
     - `https://your-domain.com/api/google/callback` (for production)
   - Click **"Create"**

5. Copy your **Client ID** and **Client Secret**

## Step 4: Add Environment Variables

Add these to your `.env` file (or Render environment variables):

```env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=https://your-domain.com/api/google/callback
```

For **Render**:
1. Go to your service dashboard
2. Click "Environment"
3. Add the three environment variables above
4. Click "Save Changes"

## Step 5: Run Database Migration

On Render (or your local/server):
```bash
node --import tsx migrate.js
```

This will add the necessary Google Calendar fields to your users table.

## Step 6: Test the Integration

1. Go to your app's **Company Calendar** page
2. Click **"Connect Google"** button
3. Authorize the app in the Google popup
4. Once connected, click **"Sync Now"** to sync events

## Features

- ✅ **Connect** - Link your Google Calendar account
- ✅ **Sync** - Push local events to Google Calendar
- ✅ **Two-way sync** - Events created in Marketing OS appear in Google Calendar
- ✅ **Auto-update** - Updates to events sync automatically
- ✅ **Disconnect** - Remove Google Calendar connection anytime

## Troubleshooting

### "Invalid Client" Error
- Make sure your OAuth redirect URI in Google Cloud Console matches exactly
- Check that environment variables are set correctly

### "Access Denied" Error
- Make sure you've enabled the Google Calendar API
- Check that your OAuth consent screen is configured

### Events Not Syncing
- Click "Sync Now" button manually
- Check Render logs for any errors
- Verify your Google access token is valid

## Production Checklist

- [ ] Google Cloud project created
- [ ] Google Calendar API enabled
- [ ] OAuth credentials created
- [ ] Redirect URIs configured (production URL)
- [ ] Environment variables set on Render
- [ ] Database migration run
- [ ] Tested connection and sync

## Support

If you encounter issues:
1. Check Render logs for errors
2. Verify all environment variables are set
3. Test the OAuth flow in incognito mode
4. Check Google Calendar API quotas

---

🎉 **Once set up, your team can sync calendar events between Marketing OS and Google Calendar seamlessly!**

