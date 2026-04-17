import http from 'http';

function makeRequest(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test() {
  try {
    // Step 1: Login
    console.log('🔐 Logging in...');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@sensus.com',
      password: 'admin123'
    });
    
    if (loginRes.status !== 200) {
      console.error('❌ Login failed:', loginRes);
      return;
    }
    
    const token = loginRes.data.token;
    console.log('✅ Login successful, token:', token.substring(0, 20) + '...');
    
    // Step 2: Update product
    console.log('\n📝 Updating product...');
    const productId = '6969393b95e5cca4db948b81';
    const updateData = {
      name: 'Alba - Update Test ' + Date.now(),
      description: 'Testing update with timestamp'
    };
    
    const updateRes = await makeRequest('PATCH', `/api/products/${productId}`, updateData, token);
    
    console.log('Response status:', updateRes.status);
    console.log('Response:', JSON.stringify(updateRes.data, null, 2));
    
    if (updateRes.status === 200) {
      console.log('✅ Update successful!');
      console.log('Updated product name:', updateRes.data.name);
    } else {
      console.log('❌ Update failed');
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

test();
