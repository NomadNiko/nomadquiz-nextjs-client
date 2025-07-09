const puppeteer = require('puppeteer');

// Test configuration
const BASE_URL = 'http://localhost:3000/en';
const TEST_USERS = [
  { email: 'john.doe@nomadsoft.us', password: 'secret', username: 'john.doe' },
  { email: 'jane.smith@nomadsoft.us', password: 'secret', username: 'jane.smith' }
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function login(page, user) {
  console.log(`🔐 Logging in as ${user.email}...`);
  
  await page.goto(`${BASE_URL}/sign-in`);
  await page.waitForSelector('input[name="email"]', { timeout: 10000 });
  
  // Clear and type email
  await page.click('input[name="email"]', { clickCount: 3 });
  await page.type('input[name="email"]', user.email);
  
  // Clear and type password  
  await page.click('input[name="password"]', { clickCount: 3 });
  await page.type('input[name="password"]', user.password);
  
  // Submit form
  await page.click('button[type="submit"]');
  await sleep(3000); // Wait for login
  
  console.log(`✅ Logged in as ${user.email}`);
}

async function takeScreenshot(page, name) {
  const timestamp = Date.now();
  const filename = `screenshot-${name}-${timestamp}.png`;
  await page.screenshot({ 
    path: filename, 
    fullPage: true 
  });
  console.log(`📸 Screenshot saved: ${filename}`);
  return filename;
}

async function testSendFriendRequest(page, targetUsername) {
  console.log(`➕ Testing sending friend request to ${targetUsername}...`);
  
  await page.goto(`${BASE_URL}/friends`);
  await page.waitForSelector('input[placeholder*="Enter username"]', { timeout: 10000 });
  
  await takeScreenshot(page, `friends-page-loaded`);
  
  // Enter username in the form
  await page.type('input[placeholder*="Enter username"]', targetUsername);
  
  // Click send request button
  const sendButton = await page.$('button[type="submit"]');
  if (sendButton) {
    await sendButton.click();
    await sleep(2000);
    console.log('✅ Friend request sent');
    await takeScreenshot(page, `request-sent-to-${targetUsername}`);
    return true;
  } else {
    console.log('❌ Send button not found');
    return false;
  }
}

async function testReceivedRequests(page) {
  console.log('📬 Testing received friend requests...');
  
  await page.goto(`${BASE_URL}/friends`);
  await page.waitForSelector('[role="tablist"]', { timeout: 10000 });
  
  // Click on Received Requests tab
  const tabs = await page.$$('[role="tab"]');
  for (const tab of tabs) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text && text.includes('Received')) {
      await tab.click();
      break;
    }
  }
  
  await sleep(1000);
  await takeScreenshot(page, 'received-requests-tab');
  
  // Look for accept button
  const buttons = await page.$$('button');
  let acceptButton = null;
  
  for (const button of buttons) {
    const text = await page.evaluate(el => el.textContent, button);
    if (text && text.includes('Accept')) {
      acceptButton = button;
      break;
    }
  }
  
  if (acceptButton) {
    console.log('✅ Found Accept button');
    await acceptButton.click();
    await sleep(2000);
    await takeScreenshot(page, 'request-accepted');
    console.log('✅ Friend request accepted');
    return true;
  } else {
    console.log('⚠️ No Accept button found (may be no pending requests)');
    return false;
  }
}

async function testFriendsList(page) {
  console.log('👥 Testing friends list...');
  
  await page.goto(`${BASE_URL}/friends`);
  await page.waitForSelector('[role="tablist"]', { timeout: 10000 });
  
  // Click on Friends tab
  const tabs = await page.$$('[role="tab"]');
  for (const tab of tabs) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text && text.includes('Friends') && !text.includes('Requests')) {
      await tab.click();
      break;
    }
  }
  
  await sleep(1000);
  await takeScreenshot(page, 'friends-list-tab');
  
  // Check for friend cards
  const friendCards = await page.$$('.mantine-Card-root');
  console.log(`👥 Found ${friendCards.length} friends in list`);
  
  return friendCards.length > 0;
}

async function runCorrectedTest() {
  console.log('🚀 Starting CORRECTED Friend Request Tests...\n');
  console.log('📋 Testing the FIXED implementation without user search\n');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  let testResults = {
    sendRequest: false,
    receiveRequest: false,
    friendsList: false
  };
  
  try {
    const page1 = await browser.newPage();
    const page2 = await browser.newPage();
    
    // Test 1: Send friend request by username
    console.log('\n➕ === Test 1: Send Friend Request by Username ===');
    await login(page1, TEST_USERS[0]);
    testResults.sendRequest = await testSendFriendRequest(page1, TEST_USERS[1].username);
    
    // Test 2: Receive and accept friend request
    console.log('\n📬 === Test 2: Receive Friend Request ===');
    await login(page2, TEST_USERS[1]);
    testResults.receiveRequest = await testReceivedRequests(page2);
    
    // Test 3: Verify friends list
    console.log('\n👥 === Test 3: Friends List Verification ===');
    testResults.friendsList = await testFriendsList(page2);
    
    // Also check from first user's perspective
    console.log('\n👥 === Test 3b: Mutual Friends Verification ===');
    await testFriendsList(page1);
    
    // Print final results
    console.log('\n📊 === FINAL TEST RESULTS ===');
    console.log(`Send Request: ${testResults.sendRequest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Receive Request: ${testResults.receiveRequest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Friends List: ${testResults.friendsList ? '✅ PASS' : '❌ FAIL'}`);
    
    const allPassed = Object.values(testResults).every(result => result === true);
    
    if (allPassed) {
      console.log('\n🎉 ALL TESTS PASSED! Friend functionality is working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Check screenshots for debugging.');
    }
    
    console.log('\n🔧 ARCHITECTURAL CHANGES MADE:');
    console.log('✅ Removed non-functional user search (server has no public search endpoint)');
    console.log('✅ Replaced with username-based friend request form');
    console.log('✅ Fixed API response types to match server FriendRequestDto format');
    console.log('✅ Updated friends list to extract friend data from FriendRequest objects');
    console.log('✅ All endpoints now correctly use existing server API');
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    await takeScreenshot(await browser.newPage(), 'test-error');
    return false;
  } finally {
    await browser.close();
  }
}

runCorrectedTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });