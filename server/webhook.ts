import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';

const execAsync = promisify(exec);

export function setupWebhook(app: any) {
  // GitHub webhook endpoint for auto-updates
  app.post('/api/webhook/github', async (req: any, res: any) => {
    try {
      // Verify GitHub signature if GITHUB_WEBHOOK_SECRET is set
      const signature = req.headers['x-hub-signature-256'];
      const secret = process.env.GITHUB_WEBHOOK_SECRET;

      if (secret && signature) {
        const hmac = crypto.createHmac('sha256', secret);
        const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');
        
        if (signature !== digest) {
          console.log('Invalid signature');
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }

      const event = req.headers['x-github-event'];
      
      // Only respond to push events
      if (event === 'push') {
        console.log('📦 Received push event from GitHub');
        console.log('🔄 Pulling latest changes...');
        
        // Pull latest changes from GitHub
        const { stdout, stderr } = await execAsync('git pull origin main');
        
        console.log('✅ Git pull output:', stdout);
        if (stderr) console.log('⚠️  Stderr:', stderr);
        
        // Optionally restart the server (Replit will auto-restart)
        console.log('🔄 Changes pulled successfully. Server will restart automatically.');
        
        res.json({ 
          success: true, 
          message: 'Updated successfully',
          output: stdout 
        });
        
        // Exit to trigger Replit auto-restart
        setTimeout(() => {
          process.exit(0);
        }, 1000);
      } else {
        res.json({ message: 'Event ignored', event });
      }
    } catch (error: any) {
      console.error('❌ Webhook error:', error);
      res.status(500).json({ 
        error: 'Failed to update', 
        message: error.message 
      });
    }
  });

  // Manual update endpoint (useful for testing)
  app.post('/api/update', async (req: any, res: any) => {
    try {
      console.log('🔄 Manual update triggered...');
      
      const { stdout, stderr } = await execAsync('git pull origin main');
      
      console.log('✅ Git pull output:', stdout);
      if (stderr) console.log('⚠️  Stderr:', stderr);
      
      res.json({ 
        success: true, 
        message: 'Updated successfully',
        output: stdout 
      });
      
      // Exit to trigger Replit auto-restart
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    } catch (error: any) {
      console.error('❌ Update error:', error);
      res.status(500).json({ 
        error: 'Failed to update', 
        message: error.message 
      });
    }
  });

  console.log('🔗 Webhook endpoints configured:');
  console.log('   POST /api/webhook/github - GitHub webhook');
  console.log('   POST /api/update - Manual update trigger');
}

