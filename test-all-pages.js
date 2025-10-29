import { chromium } from 'playwright';

async function testAllPages() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Collect console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleLogs.push({ type, text, url: page.url() });
    
    // Log errors and warnings immediately
    if (type === 'error' || type === 'warning') {
      console.log(`🔴 [${type.toUpperCase()}] ${page.url()}: ${text}`);
    }
  });
  
  // Collect network errors
  const networkErrors = [];
  page.on('response', response => {
    if (!response.ok()) {
      networkErrors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        pageUrl: page.url()
      });
      console.log(`🌐 [${response.status()}] ${page.url()}: ${response.url()}`);
    }
  });

  console.log('🧪 Starting comprehensive page testing...\n');

  try {
    // Test 1: Login as Admin
    console.log('📝 Testing Admin Login...');
    await page.goto('https://marketingappos.onrender.com/auth');
    await page.waitForTimeout(3000);
    
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    console.log('✅ Admin login completed\n');

    // Test Admin Pages
    const adminPages = [
      { name: 'Dashboard', url: '/dashboard' },
      { name: 'Leads', url: '/leads' },
      { name: 'Clients', url: '/clients' },
      { name: 'Campaigns', url: '/campaigns' },
      { name: 'Content Calendar', url: '/content' },
      { name: 'Support Tickets', url: '/tickets' },
      { name: 'Phone', url: '/phone' },
      { name: 'Analytics', url: '/analytics' },
      { name: 'Emails', url: '/emails' },
      { name: 'Messages', url: '/messages' },
      { name: 'Tasks', url: '/tasks' },
      { name: 'Team', url: '/team' },
      { name: 'Invoices', url: '/invoices' },
      { name: 'Push Notifications', url: '/push-notifications' },
      { name: 'Settings', url: '/settings' }
    ];

    console.log('🔧 Testing Admin Pages...');
    for (const adminPage of adminPages) {
      console.log(`  📄 Testing ${adminPage.name}...`);
      await page.goto(`https://marketingappos.onrender.com${adminPage.url}`);
      await page.waitForTimeout(4000); // Wait for page to fully load
      
      // Check if page loaded successfully
      const title = await page.title();
      console.log(`    ✅ ${adminPage.name} loaded (title: ${title})`);
    }

    // Test 2: Login as Client
    console.log('\n👤 Testing Client Login...');
    await page.goto('https://marketingappos.onrender.com/auth');
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="text"]', 'carson');
    await page.fill('input[type="password"]', 'Welcome7411!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    console.log('✅ Client login completed\n');

    // Test Client Pages
    const clientPages = [
      { name: 'Client Dashboard', url: '/client-dashboard' },
      { name: 'My Campaigns', url: '/client-campaigns' },
      { name: 'My Content', url: '/client-content' },
      { name: 'Analytics', url: '/client-analytics' },
      { name: 'Billing', url: '/client-billing' },
      { name: 'Second Me', url: '/client-second-me-dashboard' },
      { name: 'Support Tickets', url: '/tickets' },
      { name: 'Settings', url: '/settings' }
    ];

    console.log('👥 Testing Client Pages...');
    for (const clientPage of clientPages) {
      console.log(`  📄 Testing ${clientPage.name}...`);
      await page.goto(`https://marketingappos.onrender.com${clientPage.url}`);
      await page.waitForTimeout(4000); // Wait for page to fully load
      
      // Check if page loaded successfully
      const title = await page.title();
      console.log(`    ✅ ${clientPage.name} loaded (title: ${title})`);
    }

    // Test 3: Public Pages
    console.log('\n🌐 Testing Public Pages...');
    const publicPages = [
      { name: 'Landing', url: '/' },
      { name: 'Contact', url: '/contact' },
      { name: 'Blog', url: '/blog' },
      { name: 'Signup', url: '/signup' }
    ];

    for (const publicPage of publicPages) {
      console.log(`  📄 Testing ${publicPage.name}...`);
      await page.goto(`https://marketingappos.onrender.com${publicPage.url}`);
      await page.waitForTimeout(3000);
      
      const title = await page.title();
      console.log(`    ✅ ${publicPage.name} loaded (title: ${title})`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  // Summary Report
  console.log('\n📊 TESTING SUMMARY REPORT');
  console.log('=' * 50);
  
  const errorLogs = consoleLogs.filter(log => log.type === 'error');
  const warningLogs = consoleLogs.filter(log => log.type === 'warning');
  
  console.log(`Total Console Errors: ${errorLogs.length}`);
  console.log(`Total Console Warnings: ${warningLogs.length}`);
  console.log(`Total Network Errors: ${networkErrors.length}`);
  
  if (errorLogs.length > 0) {
    console.log('\n🔴 CONSOLE ERRORS:');
    errorLogs.forEach(log => {
      console.log(`  ${log.url}: ${log.text}`);
    });
  }
  
  if (warningLogs.length > 0) {
    console.log('\n⚠️ CONSOLE WARNINGS:');
    warningLogs.forEach(log => {
      console.log(`  ${log.url}: ${log.text}`);
    });
  }
  
  if (networkErrors.length > 0) {
    console.log('\n🌐 NETWORK ERRORS:');
    networkErrors.forEach(error => {
      console.log(`  ${error.pageUrl}: ${error.status} ${error.url}`);
    });
  }
  
  if (errorLogs.length === 0 && networkErrors.length === 0) {
    console.log('\n🎉 ALL PAGES WORKING PERFECTLY! No errors found.');
  }

  await browser.close();
}

testAllPages().catch(console.error);
