const puppeteer = require('puppeteer');

// Test configuration
const BASE_URL = 'http://localhost:3000/en';
const TEST_USERS = [
  { email: 'john.doe@nomadsoft.us', password: 'secret', username: 'john.doe' },
  { email: 'jane.smith@nomadsoft.us', password: 'secret', username: 'jane.smith' },
  { email: 'bob.wilson@nomadsoft.us', password: 'secret', username: 'bob.wilson' }
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
  
  // Wait for navigation or dashboard
  try {
    await page.waitForNavigation({ timeout: 5000 });
  } catch (e) {
    // Sometimes the page doesn't navigate, check if we're logged in
    await sleep(2000);
  }
  
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

async function testUserSearch(page) {
  console.log('🔍 Testing user search functionality...');
  
  await page.goto(`${BASE_URL}/friends`);
  await page.waitForSelector('input[placeholder*="Search"]', { timeout: 10000 });
  
  await takeScreenshot(page, 'friends-page-loaded');
  
  // Clear the search input and type a search term
  const searchInput = await page.$('input[placeholder*="Search"]');
  await searchInput.click({ clickCount: 3 });
  await searchInput.type('jane');
  
  console.log('🔍 Typed "jane" in search box');
  await sleep(1500); // Wait for debounced search
  
  await takeScreenshot(page, 'search-results');
  
  // Check if search results appear
  const searchResults = await page.$$('[data-testid="user-card"], .mantine-Card-root');
  console.log(`📊 Found ${searchResults.length} search result cards`);
  
  return searchResults.length > 0;
}

async function testSendFriendRequest(page, targetUsername) {
  console.log(`➕ Testing sending friend request to ${targetUsername}...`);
  
  await page.goto(`${BASE_URL}/friends`);
  await page.waitForSelector('input[placeholder*="Search"]', { timeout: 10000 });
  
  // Search for target user
  const searchInput = await page.$('input[placeholder*="Search"]');
  await searchInput.click({ clickCount: 3 });
  await searchInput.type(targetUsername);
  
  await sleep(2000); // Wait for search results
  await takeScreenshot(page, `search-for-${targetUsername}`);
  
  // Look for Add Friend button
  const addFriendButtons = await page.$$('button');
  let addFriendButton = null;
  
  for (const button of addFriendButtons) {
    const text = await page.evaluate(el => el.textContent, button);
    if (text && text.includes('Add Friend')) {
      addFriendButton = button;
      break;
    }
  }
  
  if (addFriendButton) {
    console.log('🎯 Found Add Friend button');
    await addFriendButton.click();
    await sleep(2000);
    await takeScreenshot(page, 'friend-request-sent');
    console.log('✅ Friend request sent');
    return true;
  } else {
    console.log('❌ Add Friend button not found');
    await takeScreenshot(page, 'add-friend-button-missing');
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
    if (text && (text.includes('Friends') && !text.includes('Requests'))) {
      await tab.click();
      break;
    }
  }
  
  await sleep(1000);
  await takeScreenshot(page, 'friends-list-tab');
  
  // Check for friend cards
  const friendCards = await page.$$('[data-testid="friend-card"], .mantine-Card-root');
  console.log(`👥 Found ${friendCards.length} friends in list`);
  
  return friendCards.length > 0;
}

async function runFullTest() {
  console.log('🚀 Starting Comprehensive Friend Request Tests...\n');
  
  const browser = await puppeteer.launch({ 
    headless: true, // Run headless for CI/automated testing
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  let testResults = {
    userSearch: false,
    sendRequest: false,
    receiveRequest: false,
    friendsList: false
  };
  
  try {
    const page1 = await browser.newPage();
    const page2 = await browser.newPage();
    
    // Test 1: User search functionality
    console.log('\n🔍 === Test 1: User Search Functionality ===');
    await login(page1, TEST_USERS[0]);
    testResults.userSearch = await testUserSearch(page1);
    
    // Test 2: Send friend request
    console.log('\n➕ === Test 2: Send Friend Request ===');
    testResults.sendRequest = await testSendFriendRequest(page1, TEST_USERS[1].username);
    
    // Test 3: Receive and accept friend request
    console.log('\n📬 === Test 3: Receive Friend Request ===');
    await login(page2, TEST_USERS[1]);
    testResults.receiveRequest = await testReceivedRequests(page2);
    
    // Test 4: Verify friends list
    console.log('\n👥 === Test 4: Friends List Verification ===');
    testResults.friendsList = await testFriendsList(page2);
    
    // Also check from first user's perspective
    console.log('\n👥 === Test 4b: Mutual Friends Verification ===');
    await testFriendsList(page1);
    
    // Print final results
    console.log('\n📊 === FINAL TEST RESULTS ===');
    console.log(`User Search: ${testResults.userSearch ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Send Request: ${testResults.sendRequest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Receive Request: ${testResults.receiveRequest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Friends List: ${testResults.friendsList ? '✅ PASS' : '❌ FAIL'}`);
    
    const allPassed = Object.values(testResults).every(result => result === true);
    
    if (allPassed) {
      console.log('\n🎉 ALL TESTS PASSED! Friend functionality is working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Check screenshots for debugging.');
    }
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    await takeScreenshot(await browser.newPage(), 'test-error');
    return false;
  } finally {
    await browser.close();
  }
}

// Run the tests and exit with appropriate code
runFullTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });