# Auto-Update Setup Guide

This guide will help you set up automatic updates for your MarketingOS application when you push changes to GitHub.

## 🚀 Quick Start

### Option 1: GitHub Webhook (Recommended for Replit)

This method automatically updates your Replit when you push to GitHub.

#### Step 1: Get Your Replit URL
Your Replit URL will be something like:
```
https://your-replit-name.your-username.repl.co
```

#### Step 2: Set Up GitHub Webhook

1. Go to your GitHub repository: `https://github.com/Bobbywealth/MarketingOS`
2. Click on **Settings** > **Webhooks** > **Add webhook**
3. Configure the webhook:
   - **Payload URL**: `https://your-replit-url/api/webhook/github`
   - **Content type**: `application/json`
   - **Secret**: (Optional but recommended - see below)
   - **Events**: Select "Just the push event"
   - **Active**: ✅ Check this box

4. Click **Add webhook**

#### Step 3: (Optional) Add Webhook Secret

For security, add a webhook secret:

1. Generate a random secret:
   ```bash
   openssl rand -hex 32
   ```

2. In Replit, add this to your Secrets (Environment Variables):
   - Key: `GITHUB_WEBHOOK_SECRET`
   - Value: Your generated secret

3. Use the same secret in GitHub webhook settings

### Option 2: Manual Update

If you prefer to update manually, you can:

**Via API:**
```bash
curl -X POST https://your-replit-url/api/update
```

**Via Script (in Replit Shell):**
```bash
./scripts/update.sh
```

**Via Git (in Replit Shell):**
```bash
git pull origin main
```

## 🔄 How It Works

1. You push changes to GitHub
2. GitHub sends a webhook to your Replit `/api/webhook/github`
3. Replit automatically runs `git pull origin main`
4. The server restarts automatically with new changes
5. Your app is updated! ✅

## 📋 Available Endpoints

- `POST /api/webhook/github` - GitHub webhook endpoint (handles push events)
- `POST /api/update` - Manual update trigger (useful for testing)

## 🧪 Testing the Webhook

After setting up the webhook, test it:

1. Make a small change to your repo
2. Commit and push to GitHub
3. Check GitHub webhook deliveries (Settings > Webhooks > Recent Deliveries)
4. Your Replit should automatically update and restart

## 🔍 Monitoring

Check the Replit console for update logs:
- `📦 Received push event from GitHub`
- `🔄 Pulling latest changes...`
- `✅ Git pull output: ...`
- `🔄 Changes pulled successfully. Server will restart automatically.`

## 🛠️ Troubleshooting

### Webhook not triggering?
- Check GitHub webhook delivery status
- Verify the payload URL is correct
- Check Replit console for errors

### Git conflicts?
- Run `./scripts/update.sh` in Replit shell
- Or manually resolve conflicts

### Permission issues?
- Make sure the update script is executable: `chmod +x scripts/update.sh`

## 🔐 Security Notes

- Always use a webhook secret in production
- The webhook verifies GitHub's signature if `GITHUB_WEBHOOK_SECRET` is set
- The manual update endpoint (`/api/update`) should be protected in production

## 📝 Manual Update Script

The update script at `scripts/update.sh` does:
1. Stashes local changes
2. Pulls from GitHub
3. Re-applies stashed changes
4. Installs new dependencies
5. Triggers auto-restart

## 🎯 Best Practices

1. **Always test locally first** before pushing to main
2. **Use the webhook** for automatic updates
3. **Monitor the console** after updates
4. **Keep dependencies updated** regularly
5. **Use feature branches** for major changes

## 📱 Replit-Specific Notes

- Replit automatically restarts when the process exits
- The webhook triggers a graceful exit after pulling changes
- No manual restart needed!
- Files are saved automatically

---

**Need help?** Check the Replit console logs for detailed information about updates.

