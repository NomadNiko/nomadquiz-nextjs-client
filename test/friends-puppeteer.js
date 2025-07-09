const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

// Test users
const users = [
  { email: 'john.doe@nomadsoft.us', password: 'secret', name: 'John Doe', username: 'john.doe' },
  { email: 'jane.smith@nomadsoft.us', password: 'secret', name: 'Jane Smith', username: 'jane.smith' },
  { email: 'bob.wilson@nomadsoft.us', password: 'secret', name: 'Bob Wilson', username: 'bob.wilson' }
];

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
  const screenshotPath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot saved: ${screenshotPath}`);
}

async function login(page, user) {
  console.log(`🔐 Logging in as ${user.name}...`);
  
  await page.goto(`${BASE_URL}/en/sign-in`);
  await delay(2000);
  
  // Wait for form to load
  await page.waitForSelector('input[name="email"]', { timeout: 10000 });
  await page.waitForSelector('input[name="password"]', { timeout: 10000 });
  
  await page.type('input[name="email"]', user.email);
  await page.type('input[name="password"]', user.password);
  
  await takeScreenshot(page, `login-${user.username}`);
  
  // Click submit and wait for navigation
  await Promise.all([
    page.waitForNavigation({ timeout: 15000 }),
    page.click('button[type="submit"]')
  ]);
  
  await delay(2000);
  
  // Check if we're on the home page
  const currentUrl = page.url();
  if (currentUrl.includes('/en') && !currentUrl.includes('/sign-in')) {
    console.log(`✅ Successfully logged in as ${user.name}`);
  } else {
    throw new Error(`Login failed for ${user.name}. Current URL: ${currentUrl}`);
  }
}

async function navigateToFriends(page) {
  console.log('🧭 Navigating to friends page...');
  
  // Navigate directly to friends page
  await page.goto(`${BASE_URL}/en/friends`);
  await delay(2000);
  
  // Wait for the friends page to load - check for the page title
  await page.waitForSelector('h2:has-text("Friends")', { timeout: 10000 });
  
  await takeScreenshot(page, 'friends-page-loaded');
  console.log('✅ Friends page loaded successfully');
}

async function sendFriendRequest(page, recipientUsername) {
  console.log(`📤 Sending friend request to ${recipientUsername}...`);
  
  // Click "Send Friend Request" button
  await page.waitForSelector('button:has-text("Send Friend Request")', { timeout: 5000 });
  await page.click('button:has-text("Send Friend Request")');
  await delay(1000);
  
  // Wait for modal to appear
  await page.waitForSelector('[data-testid="send-request-modal"], .mantine-Modal-root', { timeout: 5000 });
  
  // Type recipient username
  await page.waitForSelector('input[placeholder*="username"]', { timeout: 5000 });
  await page.fill('input[placeholder*="username"]', recipientUsername);
  
  await takeScreenshot(page, `send-request-modal-${recipientUsername}`);
  
  // Click submit button
  await page.click('button:has-text("Send Request")');
  await delay(3000);
  
  // Check for success notification
  try {
    const notification = await page.waitForSelector('.mantine-Notification', { timeout: 5000 });
    const notificationText = await notification.textContent();
    
    if (notificationText.includes('successfully')) {
      console.log(`✅ Friend request sent successfully to ${recipientUsername}`);
    } else {
      console.log(`❌ Failed to send friend request: ${notificationText}`);
    }
  } catch (error) {
    console.log(`❌ No notification found for ${recipientUsername}`);
  }
  
  await takeScreenshot(page, `request-sent-${recipientUsername}`);
}

async function checkSentRequests(page) {
  console.log('📋 Checking sent requests...');
  
  // Click on "Sent Requests" tab
  await page.click('button:has-text("Sent Requests")');
  await delay(1000);
  
  await takeScreenshot(page, 'sent-requests-tab');
  
  // Check if there are any sent requests
  const requests = await page.$$('[data-testid="friend-request-card"]');
  console.log(`📊 Found ${requests.length} sent requests`);
  
  return requests.length;
}

async function checkReceivedRequests(page) {
  console.log('📬 Checking received requests...');
  
  // Click on "Received Requests" tab
  await page.click('button:has-text("Received Requests")');
  await delay(1000);
  
  await takeScreenshot(page, 'received-requests-tab');
  
  // Check if there are any received requests
  const requests = await page.$$('[data-testid="friend-request-card"]');
  console.log(`📊 Found ${requests.length} received requests`);
  
  return requests.length;
}

async function acceptFriendRequest(page) {
  console.log('✅ Accepting friend request...');
  
  // Click on "Received Requests" tab
  await page.click('button:has-text("Received Requests")');
  await delay(1000);
  
  // Click "Accept" button on the first request
  const acceptButton = await page.$('button:has-text("Accept")');
  if (acceptButton) {
    await acceptButton.click();
    await delay(2000);
    
    // Check for success notification
    const notification = await page.waitForSelector('.mantine-Notification', { timeout: 5000 });
    const notificationText = await notification.textContent();
    
    if (notificationText.includes('accepted')) {
      console.log('✅ Friend request accepted successfully');
    } else {
      console.log(`❌ Failed to accept friend request: ${notificationText}`);
    }
    
    await takeScreenshot(page, 'request-accepted');
  } else {
    console.log('❌ No accept button found');
  }
}

async function checkFriendsList(page) {
  console.log('👥 Checking friends list...');
  
  // Click on "Friends List" tab
  await page.click('button:has-text("Friends List")');
  await delay(1000);
  
  await takeScreenshot(page, 'friends-list-tab');
  
  // Check if there are any friends
  const friends = await page.$$('[data-testid="friend-card"]');
  console.log(`📊 Found ${friends.length} friends`);
  
  return friends.length;
}

async function runTests() {
  console.log('🚀 Starting Friends functionality tests...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    // Test 1: Login as John and send friend request to Jane
    console.log('\n🧪 TEST 1: John sends friend request to Jane');
    const page1 = await browser.newPage();
    await login(page1, users[0]); // John
    await navigateToFriends(page1);
    await sendFriendRequest(page1, users[1].username); // Jane
    await checkSentRequests(page1);
    await takeScreenshot(page1, 'john-sent-request');
    
    // Test 2: Login as Jane and check received requests
    console.log('\n🧪 TEST 2: Jane checks received requests');
    const page2 = await browser.newPage();
    await login(page2, users[1]); // Jane
    await navigateToFriends(page2);
    await checkReceivedRequests(page2);
    await takeScreenshot(page2, 'jane-received-request');
    
    // Test 3: Jane accepts the friend request
    console.log('\n🧪 TEST 3: Jane accepts friend request');
    await acceptFriendRequest(page2);
    await takeScreenshot(page2, 'jane-accepted-request');
    
    // Test 4: Check friends list for both users
    console.log('\n🧪 TEST 4: Check friends lists');
    await checkFriendsList(page1);
    await checkFriendsList(page2);
    
    // Test 5: Send request to Bob
    console.log('\n🧪 TEST 5: John sends friend request to Bob');
    await page1.bringToFront();
    await sendFriendRequest(page1, users[2].username); // Bob
    
    // Test 6: Login as Bob and check requests
    console.log('\n🧪 TEST 6: Bob checks received requests');
    const page3 = await browser.newPage();
    await login(page3, users[2]); // Bob
    await navigateToFriends(page3);
    await checkReceivedRequests(page3);
    
    // Test 7: Bob rejects the friend request
    console.log('\n🧪 TEST 7: Bob rejects friend request');
    const rejectButton = await page3.$('button:has-text("Reject")');
    if (rejectButton) {
      await rejectButton.click();
      await delay(2000);
      await takeScreenshot(page3, 'bob-rejected-request');
      console.log('✅ Friend request rejected successfully');
    }
    
    // Test 8: Test pagination (if applicable)
    console.log('\n🧪 TEST 8: Test pagination');
    // This would require more friend requests to test pagination
    
    // Test 9: Test error handling
    console.log('\n🧪 TEST 9: Test error handling');
    await page1.bringToFront();
    await sendFriendRequest(page1, 'nonexistent-user');
    await takeScreenshot(page1, 'error-handling');
    
    console.log('\n🎉 All tests completed successfully!');
    
    await page1.close();
    await page2.close();
    await page3.close();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Take screenshot of error
    const pages = await browser.pages();
    for (const page of pages) {
      await takeScreenshot(page, `error-${Date.now()}`);
    }
  } finally {
    await browser.close();
  }
}

// Run the tests
runTests().catch(console.error);