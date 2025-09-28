// Test script for UPI payment functionality
const Razorpay = require('razorpay');

// Initialize Razorpay with test credentials
const razorpay = new Razorpay({
  key_id: 'rzp_test_RKKI5YvBWNfh2o',
  key_secret: 'your_razorpay_key_secret' // Replace with actual test secret
});

async function testUPIPayment() {
  try {
    console.log('🧪 Testing UPI Payment Configuration...\n');

    // Test 1: Create order with UPI enabled
    console.log('1. Creating order with UPI support...');
    const order = await razorpay.orders.create({
      amount: 10000, // ₹100 in paise
      currency: 'INR',
      receipt: `test_upi_${Date.now()}`,
      method: 'upi,card,netbanking,wallet,emi,paylater',
      notes: {
        test: 'UPI payment test',
        purpose: 'milestone payment'
      }
    });

    console.log('✅ Order created successfully:');
    console.log('   Order ID:', order.id);
    console.log('   Amount:', order.amount);
    console.log('   Currency:', order.currency);
    console.log('   Methods:', order.method);
    console.log('');

    // Test 2: Check if UPI is enabled
    console.log('2. Checking UPI configuration...');
    if (order.method && order.method.includes('upi')) {
      console.log('✅ UPI is enabled in the order');
    } else {
      console.log('❌ UPI is not enabled in the order');
    }
    console.log('');

    // Test 3: Display test UPI IDs for sandbox
    console.log('3. Test UPI IDs for sandbox mode:');
    console.log('   ✅ Success: success@razorpay');
    console.log('   ❌ Failure: failure@razorpay');
    console.log('');

    console.log('🎉 UPI payment configuration test completed!');
    console.log('');
    console.log('📋 Instructions for testing:');
    console.log('   1. Use the order ID above in your frontend');
    console.log('   2. When prompted for UPI ID, use: success@razorpay');
    console.log('   3. The payment should be processed successfully');
    console.log('   4. Check the payment status in your application');

  } catch (error) {
    console.error('❌ Error testing UPI payment:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testUPIPayment();
