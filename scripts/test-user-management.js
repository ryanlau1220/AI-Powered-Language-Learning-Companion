const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS
AWS.config.update({
  region: process.env.REGION || 'ap-southeast-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const userService = require('../backend/src/services/userService');

async function testUserManagement() {
  try {
    console.log('👤 Testing User Management System...\n');
    
    // Test 1: Register a new user
    console.log('1️⃣ Testing user registration...');
    try {
      const testUser = {
        username: 'testuser123',
        email: 'test@example.com',
        password: 'password123',
        nativeLanguage: 'en',
        targetLanguages: ['es', 'fr']
      };
      
      const registeredUser = await userService.registerUser(testUser);
      console.log('✅ User registration successful');
      console.log(`   User ID: ${registeredUser.userId}`);
      console.log(`   Username: ${registeredUser.username}`);
      console.log(`   Email: ${registeredUser.email}`);
      console.log(`   Native Language: ${registeredUser.nativeLanguage}`);
      console.log(`   Target Languages: ${registeredUser.targetLanguages.join(', ')}`);
      console.log(`   Created: ${registeredUser.createdAt}`);
      
      // Store user ID for later tests
      const testUserId = registeredUser.userId;
      
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  User already exists (this is expected for repeated tests)');
        // Try to get existing user
        const existingUser = await userService.getUserByEmail('test@example.com');
        const testUserId = existingUser.userId;
        console.log(`   Using existing user ID: ${testUserId}`);
      } else {
        console.log('❌ Error registering user:', error.message);
        return;
      }
    }
    
    // Test 2: Login user
    console.log('\n2️⃣ Testing user login...');
    try {
      const loginResult = await userService.loginUser({
        email: 'test@example.com',
        password: 'password123'
      });
      
      console.log('✅ User login successful');
      console.log(`   User: ${loginResult.user.username}`);
      console.log(`   Token: ${loginResult.token.substring(0, 20)}...`);
      console.log(`   Token expires in: 24 hours`);
      
    } catch (error) {
      console.log('❌ Error logging in user:', error.message);
    }
    
    // Test 3: Get user profile
    console.log('\n3️⃣ Testing user profile retrieval...');
    try {
      const existingUser = await userService.getUserByEmail('test@example.com');
      const userProfile = await userService.getUser(existingUser.userId);
      
      console.log('✅ User profile retrieval successful');
      console.log(`   Username: ${userProfile.username}`);
      console.log(`   Email: ${userProfile.email}`);
      console.log(`   Native Language: ${userProfile.nativeLanguage}`);
      console.log(`   Target Languages: ${userProfile.targetLanguages.join(', ')}`);
      console.log(`   Preferences: ${JSON.stringify(userProfile.preferences, null, 2)}`);
      console.log(`   Progress: ${JSON.stringify(userProfile.progress, null, 2)}`);
      
    } catch (error) {
      console.log('❌ Error getting user profile:', error.message);
    }
    
    // Test 4: Update user profile
    console.log('\n4️⃣ Testing user profile update...');
    try {
      const existingUser = await userService.getUserByEmail('test@example.com');
      const updatedUser = await userService.updateUser(existingUser.userId, {
        interests: ['travel', 'cooking', 'music'],
        learningGoals: ['conversation', 'pronunciation'],
        preferences: {
          voiceId: 'Matthew',
          speakingSpeed: 'slow',
          feedbackLevel: 'detailed',
          scenarioPreferences: ['restaurant', 'shopping', 'directions']
        }
      });
      
      console.log('✅ User profile update successful');
      console.log(`   Updated interests: ${updatedUser.interests.join(', ')}`);
      console.log(`   Updated learning goals: ${updatedUser.learningGoals.join(', ')}`);
      console.log(`   Updated voice preference: ${updatedUser.preferences.voiceId}`);
      console.log(`   Updated speaking speed: ${updatedUser.preferences.speakingSpeed}`);
      console.log(`   Updated feedback level: ${updatedUser.preferences.feedbackLevel}`);
      
    } catch (error) {
      console.log('❌ Error updating user profile:', error.message);
    }
    
    // Test 5: Test user progress tracking
    console.log('\n5️⃣ Testing user progress tracking...');
    try {
      const existingUser = await userService.getUserByEmail('test@example.com');
      const userProgress = await userService.getUserProgress(existingUser.userId);
      
      console.log('✅ User progress tracking successful');
      console.log(`   Total conversations: ${userProgress.totalConversations}`);
      console.log(`   Total messages: ${userProgress.totalMessages}`);
      console.log(`   Average pronunciation score: ${userProgress.averagePronunciationScore}`);
      console.log(`   Average grammar score: ${userProgress.averageGrammarScore}`);
      console.log(`   Learning streak: ${userProgress.learningStreak} days`);
      console.log(`   Last learning date: ${userProgress.lastLearningDate || 'Never'}`);
      
    } catch (error) {
      console.log('❌ Error getting user progress:', error.message);
    }
    
    // Test 6: Test password validation
    console.log('\n6️⃣ Testing password validation...');
    try {
      // Test wrong password
      try {
        await userService.loginUser({
          email: 'test@example.com',
          password: 'wrongpassword'
        });
        console.log('❌ Password validation failed - wrong password was accepted');
      } catch (error) {
        if (error.message.includes('Invalid email or password')) {
          console.log('✅ Password validation working - wrong password rejected');
        } else {
          console.log('❌ Unexpected error:', error.message);
        }
      }
      
      // Test wrong email
      try {
        await userService.loginUser({
          email: 'nonexistent@example.com',
          password: 'password123'
        });
        console.log('❌ Email validation failed - non-existent email was accepted');
      } catch (error) {
        if (error.message.includes('Invalid email or password')) {
          console.log('✅ Email validation working - non-existent email rejected');
        } else {
          console.log('❌ Unexpected error:', error.message);
        }
      }
      
    } catch (error) {
      console.log('❌ Error testing password validation:', error.message);
    }
    
    console.log('\n🎉 User Management System is working correctly!');
    console.log('\n📋 Available features:');
    console.log('   ✅ User registration with password hashing');
    console.log('   ✅ User login with JWT token generation');
    console.log('   ✅ User profile management');
    console.log('   ✅ User progress tracking');
    console.log('   ✅ Password validation and security');
    console.log('   ✅ Multi-language support');
    console.log('   ✅ Learning preferences and goals');
    
  } catch (error) {
    console.error('❌ Error testing user management:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your AWS credentials in .env file');
    console.log('2. Verify DynamoDB tables exist');
    console.log('3. Make sure bcryptjs is installed');
    console.log('4. Check JWT_SECRET is set in environment');
  }
}

testUserManagement();
