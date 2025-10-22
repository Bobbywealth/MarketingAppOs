# 🔔 OneSignal Push Notifications Setup Guide

## ✅ What's Already Done:
- ✅ OneSignal SDK integrated into service worker
- ✅ OneSignal script loaded in HTML
- ✅ OneSignal initialization code added
- ✅ Auto-login users to OneSignal when they log in
- ✅ Auto-logout from OneSignal when they log out
- ✅ User role tags for segmented notifications

---

## 🚀 Setup Steps (You Need To Do This):

### 1. Create OneSignal Account (FREE)
1. Go to: **https://onesignal.com/**
2. Click "Get Started Free"
3. Sign up with your email

### 2. Create a New App
1. After login, click "New App/Website"
2. Name it: **"Marketing Team App"**
3. Select: **"Web Push"**

### 3. Configure Web Push
1. **Site Name**: Marketing Team App
2. **Site URL**: `https://marketingappos.onrender.com`
3. **Auto Resubscribe**: Enable (recommended)
4. **Default Notification Icon**: Upload your MTA logo
5. Click "Save"

### 4. Get Your App ID
1. Go to **Settings** → **Keys & IDs**
2. Copy your **OneSignal App ID** (looks like: `12345678-abcd-1234-abcd-123456789abc`)
3. **IMPORTANT**: Copy the Safari Web ID too (for iOS Safari)

### 5. Add to Render Environment Variables
Go to your Render dashboard → Environment tab and add:

```
VITE_ONESIGNAL_APP_ID=your_app_id_here
VITE_ONESIGNAL_SAFARI_WEB_ID=your_safari_web_id_here
```

⚠️ **IMPORTANT**: The `VITE_` prefix is required for client-side env vars!

---

## 📱 How It Works:

### Automatic Features:
- ✅ User logs in → Automatically subscribed to push notifications
- ✅ User logs out → Automatically unsubscribed
- ✅ User role (admin/manager/staff/client) is tagged for targeted notifications

### Sending Notifications:
You can send push notifications from:
1. **OneSignal Dashboard** (manual)
2. **OneSignal API** (automated from your backend)

### Example: Send notification via API
```javascript
// From your backend (server/routes.ts)
const sendPushNotification = async (userId: string, title: string, message: string) => {
  await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
    },
    body: JSON.stringify({
      app_id: process.env.ONESIGNAL_APP_ID,
      include_external_user_ids: [userId],
      contents: { en: message },
      headings: { en: title }
    })
  });
};
```

---

## 🎯 Test It:
1. Deploy to Render with env vars
2. Open your app in browser
3. When prompted, click "Allow" for notifications
4. From OneSignal dashboard, send a test notification
5. You should receive it even if the app is closed!

---

## 💡 Benefits Over Current System:
- ✅ **Real-time**: Instant notifications (no 30-second polling)
- ✅ **Works offline**: Receive notifications even when app is closed
- ✅ **Cross-platform**: Works on Desktop & Mobile (Chrome, Firefox, Safari)
- ✅ **Segmented**: Target specific users/roles
- ✅ **Reliable**: 99.9% uptime from OneSignal
- ✅ **FREE**: Up to 10,000 subscribers

---

## 🔗 OneSignal Docs:
- **Dashboard**: https://app.onesignal.com
- **Web SDK Docs**: https://documentation.onesignal.com/docs/web-push-quickstart
- **API Docs**: https://documentation.onesignal.com/reference/create-notification

---

**Once you add the env vars to Render and redeploy, push notifications will be live!** 🚀

