/**
 * Test Dynamic Service Charge Calculation
 * This script verifies that service charges are calculated correctly based on project budget
 */

const EscrowService = require('./services/escrowService');

console.log('\n🧪 TESTING DYNAMIC SERVICE CHARGE CALCULATION\n');
console.log('═'.repeat(70));

const testCases = [
  {
    name: 'Small Project (Under ₹5,000)',
    projectBudget: 3000,
    milestoneAmount: 1500,
    expectedPercentage: 8
  },
  {
    name: 'Medium Project (₹5,000 - ₹20,000)',
    projectBudget: 15000,
    milestoneAmount: 7500,
    expectedPercentage: 6
  },
  {
    name: 'Medium-Large Project (₹20,000 - ₹50,000)',
    projectBudget: 35000,
    milestoneAmount: 10000,
    expectedPercentage: 5
  },
  {
    name: 'Large Project (₹50,000 - ₹1,00,000)',
    projectBudget: 80000,
    milestoneAmount: 20000,
    expectedPercentage: 4
  },
  {
    name: 'Very Large Project (Above ₹1,00,000)',
    projectBudget: 250000,
    milestoneAmount: 50000,
    expectedPercentage: 3
  }
];

let allPassed = true;

testCases.forEach((testCase, index) => {
  console.log(`\nTest ${index + 1}: ${testCase.name}`);
  console.log('─'.repeat(70));
  
  const result = EscrowService.calculateServiceCharges(
    testCase.milestoneAmount,
    testCase.projectBudget,
    null
  );
  
  const expectedServiceCharge = (testCase.milestoneAmount * testCase.expectedPercentage) / 100;
  const expectedTotal = testCase.milestoneAmount + expectedServiceCharge;
  
  console.log(`  Input:`);
  console.log(`    Project Budget: ₹${testCase.projectBudget.toLocaleString('en-IN')}`);
  console.log(`    Milestone Amount: ₹${testCase.milestoneAmount.toLocaleString('en-IN')}`);
  console.log(`  \n  Expected:`);
  console.log(`    Service Charge %: ${testCase.expectedPercentage}%`);
  console.log(`    Service Charge: ₹${expectedServiceCharge.toLocaleString('en-IN')}`);
  console.log(`    Total Amount: ₹${expectedTotal.toLocaleString('en-IN')}`);
  console.log(`  \n  Actual Result:`);
  console.log(`    Service Charge %: ${result.serviceChargePercentage}%`);
  console.log(`    Service Charge: ₹${result.serviceCharge.toLocaleString('en-IN')}`);
  console.log(`    Total Amount: ₹${result.totalAmount.toLocaleString('en-IN')}`);
  console.log(`    Amount to Freelancer: ₹${result.amountToFreelancer.toLocaleString('en-IN')}`);
  
  const percentageMatch = result.serviceChargePercentage === testCase.expectedPercentage;
  const chargeMatch = Math.abs(result.serviceCharge - expectedServiceCharge) < 0.01;
  const totalMatch = Math.abs(result.totalAmount - expectedTotal) < 0.01;
  const passed = percentageMatch && chargeMatch && totalMatch;
  
  console.log(`  \n  Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (!passed) {
    allPassed = false;
    if (!percentageMatch) console.log(`    ❌ Percentage mismatch`);
    if (!chargeMatch) console.log(`    ❌ Service charge mismatch`);
    if (!totalMatch) console.log(`    ❌ Total amount mismatch`);
  }
});

console.log('\n' + '═'.repeat(70));
console.log(`\n${allPassed ? '✅ ALL TESTS PASSED!' : '❌ SOME TESTS FAILED'}\n`);

// Test edge cases
console.log('🔍 EDGE CASE TESTS\n');
console.log('─'.repeat(70));

console.log('\nEdge Case 1: Exactly ₹5,000 (should use 6%, not 8%)');
const edge1 = EscrowService.calculateServiceCharges(2500, 5000, null);
console.log(`  Project Budget: ₹5,000 → ${edge1.serviceChargePercentage}% ${edge1.serviceChargePercentage === 6 ? '✅' : '❌'}`);

console.log('\nEdge Case 2: Exactly ₹20,000 (should use 5%, not 6%)');
const edge2 = EscrowService.calculateServiceCharges(10000, 20000, null);
console.log(`  Project Budget: ₹20,000 → ${edge2.serviceChargePercentage}% ${edge2.serviceChargePercentage === 5 ? '✅' : '❌'}`);

console.log('\nEdge Case 3: Exactly ₹50,000 (should use 4%, not 5%)');
const edge3 = EscrowService.calculateServiceCharges(25000, 50000, null);
console.log(`  Project Budget: ₹50,000 → ${edge3.serviceChargePercentage}% ${edge3.serviceChargePercentage === 4 ? '✅' : '❌'}`);

console.log('\nEdge Case 4: Exactly ₹1,00,000 (should use 3%, not 4%)');
const edge4 = EscrowService.calculateServiceCharges(50000, 100000, null);
console.log(`  Project Budget: ₹1,00,000 → ${edge4.serviceChargePercentage}% ${edge4.serviceChargePercentage === 3 ? '✅' : '❌'}`);

console.log('\nEdge Case 5: No project budget provided (should use default 5%)');
const edge5 = EscrowService.calculateServiceCharges(10000, null, null);
console.log(`  Project Budget: null → ${edge5.serviceChargePercentage}% ${edge5.serviceChargePercentage === 5 ? '✅' : '❌'}`);

console.log('\n' + '═'.repeat(70) + '\n');
