// Test script to verify Google Apps Script connectivity
// Run this with: node test-connection.js

const WEBAPP_URL = process.env.APPS_SCRIPT_WEBAPP_URL || 
  'https://script.google.com/macros/s/AKfycbwFb0KLOBrLLJCnFzBDM241DCfBHzlGiItT62JuBziATet-3EJlbRfzF2YBhKNicdHU-A/exec';

async function testConnection() {
  console.log('Testing connection to:', WEBAPP_URL);
  console.log('');
  
  try {
    // Test 1: Status check
    console.log('Test 1: Health check (status endpoint)');
    const statusUrl = `${WEBAPP_URL}?action=status`;
    const statusResponse = await fetch(statusUrl);
    const statusText = await statusResponse.text();
    console.log('Status Code:', statusResponse.status);
    console.log('Response:', statusText);
    console.log('');
    
    // Test 2: Basic endpoint
    console.log('Test 2: Basic endpoint (no params)');
    const basicResponse = await fetch(WEBAPP_URL);
    const basicText = await basicResponse.text();
    console.log('Status Code:', basicResponse.status);
    console.log('Response:', basicText.substring(0, 200));
    console.log('');
    
    console.log('✅ Connection successful!');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('');
    console.error('Possible issues:');
    console.error('1. The Google Apps Script is not deployed as a web app');
    console.error('2. The deployment URL has changed');
    console.error('3. Network connectivity issues');
    console.error('4. The web app permissions need to be set to "Anyone"');
  }
}

testConnection();
