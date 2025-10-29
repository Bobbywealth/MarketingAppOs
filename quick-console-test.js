import { chromium } from 'playwright';

async function quickConsoleTest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Track errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`${page.url()}: ${msg.text()}`);
    }
  });
  
  const networkErrors = [];
  page.on('response', response => {
    if (!response.ok()) {
      networkErrors.push(`${response.status()} ${response.url()}`);
    }
  });

  console.log('🧪 Quick Console Test - Checking Fixed Issues...\n');

  try {
    // Test Admin Login
    console.log('📝 Testing Admin Login...');
    await page.goto('https://marketingappos.onrender.com/auth');
    await page.waitForTimeout(3000);
    
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    // Test the pages that had 500 errors
    const testPages = [
      { name: 'Content Calendar', url: '/content' },
      { name: 'Support Tickets', url: '/tickets' },
      { name: 'Push Notifications', url: '/push-notifications' },
      { name: 'Team', url: '/team' }
    ];

    console.log('🔧 Testing Previously Failing Pages...');
    for (const testPage of testPages) {
      console.log(`  📄 Testing ${testPage.name}...`);
      await page.goto(`https://marketingappos.onrender.com${testPage.url}`);
      await page.waitForTimeout(5000);
      
      const title = await page.title();
      console.log(`    ✅ ${testPage.name} loaded (title: ${title})`);
    }

    // Test Client Login
    console.log('\n👤 Testing Client Login...');
    await page.goto('https://marketingappos.onrender.com/auth');
    await page.waitForTimeout(2000);
    
    // Clear existing inputs
    await page.fill('input[type="text"]', '');
    await page.fill('input[type="password"]', '');
    
    await page.fill('input[type="text"]', 'carson');
    await page.fill('input[type="password"]', 'Welcome7411!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    // Test Client Campaigns (was 403 error)
    console.log('  📄 Testing Client Campaigns...');
    await page.goto('https://marketingappos.onrender.com/client-campaigns');
    await page.waitForTimeout(5000);
    
    const title = await page.title();
    console.log(`    ✅ Client Campaigns loaded (title: ${title})`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  // Report Results
  console.log('\n📊 QUICK TEST RESULTS');
  console.log('=' * 30);
  console.log(`Console Errors: ${errors.length}`);
  console.log(`Network Errors: ${networkErrors.length}`);
  
  if (errors.length > 0) {
    console.log('\n🔴 CONSOLE ERRORS:');
    errors.forEach(error => console.log(`  ${error}`));
  }
  
  if (networkErrors.length > 0) {
    console.log('\n🌐 NETWORK ERRORS:');
    networkErrors.forEach(error => console.log(`  ${error}`));
  }
  
  if (errors.length === 0 && networkErrors.length === 0) {
    console.log('\n🎉 ALL TESTED PAGES WORKING! No errors found.');
  } else {
    console.log(`\n⚠️ Found ${errors.length + networkErrors.length} total issues.`);
  }

  await browser.close();
}

quickConsoleTest().catch(console.error);
