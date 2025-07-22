// Simple test script to check API connectivity
const http = require('http');

console.log('Testing backend server connectivity...');

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/documents',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer test-token'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`Body: ${chunk}`);
  });
  
  res.on('end', () => {
    console.log('Response ended');
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
  console.log('❌ Backend server is not running on port 4000');
  console.log('💡 To start the backend server:');
  console.log('   1. Open a terminal');
  console.log('   2. Navigate to the backend folder: cd backend');
  console.log('   3. Run: npm start');
});

req.setTimeout(5000, () => {
  console.log('Request timeout - server may not be running');
  req.destroy();
});

req.end();
