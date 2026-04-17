// Simple test to verify cart API flow
const API_URL = 'http://localhost:5000/api';

async function testAddToCart() {
  console.log('=== Testing Cart Flow ===');
  
  // First, login to get a token
  try {
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginRes.json();
    if (!loginData.token) {
      console.error('Login failed:', loginData);
      return;
    }
    
    const token = loginData.token;
    console.log('✓ Logged in successfully');
    
    // Get products to find a valid product ID
    const productsRes = await fetch(`${API_URL}/products`);
    const products = await productsRes.json();
    console.log(`✓ Found ${products.length} products`);
    
    if (products.length === 0) {
      console.error('No products found');
      return;
    }
    
    const product = products[0];
    const productId = product._id;
    const variant = product.variants[0];
    
    console.log(`Using product: ${product.name} (${productId})`);
    console.log(`Using variant: ${variant.size} - PKR ${variant.price}`);
    
    // Add to cart
    const addRes = await fetch(`${API_URL}/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        productId,
        size: variant.size,
        quantity: 1
      })
    });
    
    const addData = await addRes.json();
    console.log('Add to cart response:', addData);
    
    if (!addRes.ok) {
      console.error('Failed to add to cart:', addData);
      return;
    }
    
    console.log('✓ Added to cart successfully');
    
    // Get cart
    const cartRes = await fetch(`${API_URL}/cart`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const cartData = await cartRes.json();
    console.log('Cart contents:', cartData);
    console.log(`✓ Cart has ${cartData.items?.length || 0} items`);
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testAddToCart();
