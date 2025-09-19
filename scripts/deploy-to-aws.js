const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying AI Language Learning Companion to AWS...\n');

try {
  // Step 1: Setup environment
  console.log('1️⃣ Setting up environment...');
  execSync('node scripts/setup-env-for-deployment.js', { stdio: 'inherit' });
  
  // Step 2: Navigate to backend directory
  process.chdir(path.join(__dirname, '..', 'backend'));
  
  // Step 3: Install dependencies
  console.log('\n2️⃣ Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Step 4: Deploy to AWS
  console.log('\n3️⃣ Deploying to AWS...');
  console.log('   Region: ap-southeast-1 (Singapore - closest to Malaysia)');
  console.log('   Stage: dev');
  
  execSync('npx serverless deploy --stage dev --region ap-southeast-1', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  // Step 5: Get deployment info
  console.log('\n4️⃣ Getting deployment information...');
  execSync('npx serverless info --stage dev --region ap-southeast-1', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  console.log('\n✅ Deployment completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Copy the API Gateway URL from the output above');
  console.log('2. Update your frontend .env file with the API Gateway URL');
  console.log('3. Test the deployed endpoints');
  console.log('\n🔗 You can also find your API Gateway URL in the AWS Console:');
  console.log('   https://console.aws.amazon.com/apigateway/');
  
} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Check your AWS credentials in .env file');
  console.log('2. Verify you have the necessary AWS permissions');
  console.log('3. Make sure the Singapore region (ap-southeast-1) is available');
  console.log('4. Check the serverless logs for more details');
  process.exit(1);
}
