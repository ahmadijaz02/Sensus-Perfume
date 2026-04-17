// Quick test script to verify admin product edit flow
// Run this in browser console to test

async function testAdminFlow() {
  const API_URL = 'http://localhost:5000/api';
  
  console.log('=== Testing Admin Product Flow ===');
  
  // Step 1: Get all products
  console.log('\n1. Fetching all products...');
  let productsResponse = await fetch(`${API_URL}/products`);
  let productsData = await productsResponse.json();
  console.log('Products response format:', Object.keys(productsData));
  
  const products = Array.isArray(productsData) ? productsData : (productsData?.data || []);
  const testProduct = products[0];
  
  if (!testProduct) {
    console.error('❌ No products found!');
    return;
  }
  
  console.log('First product (list version):', {
    _id: testProduct._id,
    name: testProduct.name,
    hasDescription: !!testProduct.description,
    fields: Object.keys(testProduct)
  });
  
  // Step 2: Fetch full product by ID
  console.log('\n2. Fetching full product by ID...');
  const productId = testProduct._id;
  let detailResponse = await fetch(`${API_URL}/products/${productId}`);
  let fullProduct = await detailResponse.json();
  
  console.log('Full product:', {
    _id: fullProduct._id,
    name: fullProduct.name,
    description: fullProduct.description ? `${fullProduct.description.substring(0, 50)}...` : 'MISSING',
    descriptionLength: fullProduct.description?.length,
    hasVariants: !!fullProduct.variants,
    variants: fullProduct.variants,
    fields: Object.keys(fullProduct)
  });
  
  // Step 3: Try to update product
  console.log('\n3. Updating product...');
  const token = localStorage.getItem('auth-token');
  if (!token) {
    console.error('❌ No auth token found!');
    return;
  }
  
  const updateData = {
    ...fullProduct,
    name: fullProduct.name + ' (Updated)',
    description: fullProduct.description + ' [TEST UPDATE]'
  };
  
  let updateResponse = await fetch(`${API_URL}/products/${productId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updateData)
  });
  
  if (!updateResponse.ok) {
    const error = await updateResponse.json();
    console.error('❌ Update failed:', error);
    return;
  }
  
  const updatedProduct = await updateResponse.json();
  console.log('✅ Update successful:', {
    name: updatedProduct.name,
    descriptionEndsWithTest: updatedProduct.description?.endsWith('[TEST UPDATE]')
  });
}

testAdminFlow();
