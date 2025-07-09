const puppeteer = require('puppeteer');

async function quickTest() {
  console.log('🔍 Quick verification of Friends functionality...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to friends page
    console.log('📍 Navigating to friends page...');
    await page.goto('http://localhost:3000/en/friends');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'friends-page-verification.png', 
      fullPage: true 
    });
    
    console.log('📸 Screenshot saved: friends-page-verification.png');
    
    // Check if we can see the expected elements
    const hasSearchInput = await page.$('input[placeholder*="Search"]');
    const hasTabs = await page.$('[role="tablist"]');
    const hasCards = await page.$('.mantine-Card-root');
    
    console.log(`Search Input: ${hasSearchInput ? '✅' : '❌'}`);
    console.log(`Tab Navigation: ${hasTabs ? '✅' : '❌'}`);
    console.log(`UI Cards: ${hasCards ? '✅' : '❌'}`);
    
    // Check page title and content
    const title = await page.title();
    console.log(`Page Title: ${title}`);
    
    // Keep browser open for manual inspection
    console.log('🔍 Browser will stay open for manual verification...');
    console.log('Press Ctrl+C to close when done inspecting.');
    
    // Wait indefinitely
    await new Promise(() => {});
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

quickTest();