# PWA Setup Instructions

## ✅ What's Already Done

- ✅ PWA manifest configured (`client/public/manifest.json`)
- ✅ Service worker created (`client/public/sw.js`)
- ✅ Loading screen with your logo
- ✅ Install button prompts
- ✅ Offline support
- ✅ All PWA meta tags added

## 📱 Generate App Icons (Required)

You need to create PNG icons from your `mta-logo-blue.png` in the following sizes and place them in `client/public/`:

### Required Icon Sizes:
- `icon-72x72.png` (72x72 pixels)
- `icon-96x96.png` (96x96 pixels)
- `icon-128x128.png` (128x128 pixels)
- `icon-144x144.png` (144x144 pixels)
- `icon-152x152.png` (152x152 pixels)
- `icon-192x192.png` (192x192 pixels)
- `icon-384x384.png` (384x384 pixels)
- `icon-512x512.png` (512x512 pixels)

### Option 1: Use an Online Tool (Easiest)
1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload `attached_assets/mta-logo-blue.png`
3. Download the generated icon pack
4. Place all icons in `client/public/`

### Option 2: Use ImageMagick (Terminal)
```bash
cd "/Users/bobbyc/Downloads/MarketingOS 2"

# Install ImageMagick if needed
brew install imagemagick

# Generate all icon sizes
convert attached_assets/mta-logo-blue.png -resize 72x72 client/public/icon-72x72.png
convert attached_assets/mta-logo-blue.png -resize 96x96 client/public/icon-96x96.png
convert attached_assets/mta-logo-blue.png -resize 128x128 client/public/icon-128x128.png
convert attached_assets/mta-logo-blue.png -resize 144x144 client/public/icon-144x144.png
convert attached_assets/mta-logo-blue.png -resize 152x152 client/public/icon-152x152.png
convert attached_assets/mta-logo-blue.png -resize 192x192 client/public/icon-192x192.png
convert attached_assets/mta-logo-blue.png -resize 384x384 client/public/icon-384x384.png
convert attached_assets/mta-logo-blue.png -resize 512x512 client/public/icon-512x512.png
```

### Option 3: Use a Figma/Photoshop Template
1. Create a square artboard for each size
2. Export as PNG with your logo centered
3. Save all files in `client/public/`

## 🚀 Testing Your PWA

### Desktop (Chrome/Edge)
1. Open your app in Chrome
2. Click the install icon in the address bar (⊕)
3. Or use the install button that appears at the bottom

### Mobile (iOS Safari)
1. Open your app in Safari
2. Tap the share button
3. Select "Add to Home Screen"
4. Your app icon will appear on the home screen!

### Mobile (Android Chrome)
1. Open your app in Chrome
2. Tap the menu (⋮)
3. Select "Add to Home Screen"
4. Or use the install banner that appears

## 🎨 Features Enabled

✅ **Offline Support** - Works without internet (cached pages)
✅ **Home Screen Icon** - Installs like a native app
✅ **Splash Screen** - Beautiful loading screen with your logo
✅ **Standalone Mode** - Opens without browser UI
✅ **Push Notifications** - Ready for future features
✅ **Auto-updates** - Service worker updates automatically

## 🔧 Customization

### Change App Colors
Edit `client/public/manifest.json`:
```json
{
  "theme_color": "#3b82f6",  // Top bar color
  "background_color": "#ffffff"  // Loading screen background
}
```

### Change Loading Screen Duration
Edit `client/src/main.tsx` line 34:
```typescript
const minLoadTime = 1000; // Change this value (in milliseconds)
```

### Disable Install Button
Remove `<PWAInstallButton />` from `client/src/App.tsx`

## 📊 PWA Audit

Test your PWA with Chrome DevTools:
1. Open DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "Progressive Web App"
4. Click "Generate report"

Target score: 90+ ✅

