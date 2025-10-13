#!/bin/bash

echo "🔄 Updating MarketingOS..."
echo ""

# Stash any local changes
echo "📦 Stashing local changes..."
git stash

# Pull latest changes
echo "⬇️  Pulling from GitHub..."
git pull origin main

# Re-apply stashed changes if any
STASH_COUNT=$(git stash list | wc -l)
if [ $STASH_COUNT -gt 0 ]; then
    echo "📝 Re-applying local changes..."
    git stash pop
fi

# Install any new dependencies
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Update complete!"
echo "🔄 Replit will automatically restart the server..."

