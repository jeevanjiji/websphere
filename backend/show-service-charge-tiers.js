/**
 * Service Charge Tier Calculator
 * Shows how service charges are calculated based on project budget
 */

const getServiceChargePercentage = (projectBudget) => {
  if (projectBudget < 5000) {
    return 8; // 8% for small projects
  } else if (projectBudget < 20000) {
    return 6; // 6% for medium projects
  } else if (projectBudget < 50000) {
    return 5; // 5% for medium-large projects
  } else if (projectBudget < 100000) {
    return 4; // 4% for large projects
  } else {
    return 3; // 3% for very large projects
  }
};

const calculateServiceCharge = (milestoneAmount, projectBudget) => {
  const percentage = getServiceChargePercentage(projectBudget);
  const serviceCharge = (milestoneAmount * percentage) / 100;
  const totalAmount = milestoneAmount + serviceCharge;
  
  return {
    projectBudget,
    milestoneAmount,
    percentage,
    serviceCharge,
    totalAmount,
    amountToFreelancer: milestoneAmount
  };
};

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║         SERVICE CHARGE TIERS - BUDGET BASED PRICING          ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('📊 Tier Structure:\n');
console.log('  Tier 1: Under ₹5,000        → 8% service charge');
console.log('  Tier 2: ₹5,000 - ₹20,000    → 6% service charge');
console.log('  Tier 3: ₹20,000 - ₹50,000   → 5% service charge');
console.log('  Tier 4: ₹50,000 - ₹1,00,000 → 4% service charge');
console.log('  Tier 5: Above ₹1,00,000     → 3% service charge');
console.log('\n' + '─'.repeat(65) + '\n');

console.log('💡 Examples:\n');

const examples = [
  { projectBudget: 3000, milestoneAmount: 1500 },
  { projectBudget: 10000, milestoneAmount: 5000 },
  { projectBudget: 30000, milestoneAmount: 10000 },
  { projectBudget: 75000, milestoneAmount: 25000 },
  { projectBudget: 150000, milestoneAmount: 50000 }
];

examples.forEach((example, index) => {
  const result = calculateServiceCharge(example.milestoneAmount, example.projectBudget);
  
  console.log(`Example ${index + 1}:`);
  console.log(`  Project Budget: ₹${result.projectBudget.toLocaleString('en-IN')}`);
  console.log(`  Milestone Amount: ₹${result.milestoneAmount.toLocaleString('en-IN')}`);
  console.log(`  Service Charge: ${result.percentage}% (₹${result.serviceCharge.toLocaleString('en-IN')})`);
  console.log(`  Total Client Pays: ₹${result.totalAmount.toLocaleString('en-IN')}`);
  console.log(`  Freelancer Receives: ₹${result.amountToFreelancer.toLocaleString('en-IN')}`);
  console.log('');
});

console.log('─'.repeat(65));
console.log('\n✅ Service charges are automatically calculated based on project budget tier\n');
