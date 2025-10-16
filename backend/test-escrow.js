// Simple test function to verify escrow service charge calculation
function testEscrowCalculations() {
  console.log('🧪 Testing Escrow Service Charge Calculations...\n');
  
  // Manual calculation function (since we can't import the service without DB connection)
  const calculateServiceCharges = (milestoneAmount, serviceChargePercentage = 5, fixedServiceCharge = 0) => {
    const percentageCharge = (milestoneAmount * serviceChargePercentage) / 100;
    const totalServiceCharge = percentageCharge + fixedServiceCharge;
    const totalAmount = milestoneAmount + totalServiceCharge;
    const amountToFreelancer = milestoneAmount;
    
    return {
      milestoneAmount,
      serviceCharge: totalServiceCharge,
      serviceChargePercentage,
      totalAmount,
      amountToFreelancer,
      breakdown: {
        percentageCharge,
        fixedServiceCharge
      }
    };
  };
  
  const testCases = [
    { amount: 1000, expectedCharge: 50, expectedTotal: 1050 }, // 5% of 1000 = ₹50
    { amount: 5000, expectedCharge: 250, expectedTotal: 5250 }, // 5% of 5000 = ₹250
    { amount: 500, expectedCharge: 25, expectedTotal: 525 },   // 5% of 500 = ₹25
    { amount: 25000, expectedCharge: 1250, expectedTotal: 26250 }, // 5% of 25000 = ₹1250
    { amount: 100, expectedCharge: 5, expectedTotal: 105 } // 5% of 100 = ₹5
  ];

  for (const testCase of testCases) {
    const result = calculateServiceCharges(testCase.amount, 5, 0);
    
    console.log(`Test: ₹${testCase.amount}`);
    console.log(`  Expected Service Charge: ₹${testCase.expectedCharge}`);
    console.log(`  Calculated Service Charge: ₹${result.serviceCharge}`);
    console.log(`  Expected Total: ₹${testCase.expectedTotal}`);
    console.log(`  Calculated Total: ₹${result.totalAmount}`);
    console.log(`  Amount to Freelancer: ₹${result.amountToFreelancer}`);
    
    const isCorrect = Math.abs(result.serviceCharge - testCase.expectedCharge) < 0.01 &&
                     Math.abs(result.totalAmount - testCase.expectedTotal) < 0.01;
    
    console.log(`  ${isCorrect ? '✅ PASS' : '❌ FAIL'}\n`);
  }
  
  console.log('🎯 All escrow calculations completed!');
}

// Run the test
testEscrowCalculations();