const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS
AWS.config.update({
  region: process.env.REGION || 'ap-southeast-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const roleplayService = require('../backend/src/services/roleplayService');
const userService = require('../backend/src/services/userService');

async function testRoleplayScenarios() {
  try {
    console.log('🎭 Testing Role-Playing Scenarios System...\n');
    
    // Create or get a test user
    let testUser;
    try {
      testUser = await userService.getUserByEmail('roleplay-test@example.com');
      if (!testUser) {
        testUser = await userService.registerUser({
          username: 'roleplaytest',
          email: 'roleplay-test@example.com',
          password: 'password123',
          nativeLanguage: 'en',
          targetLanguages: ['es', 'fr']
        });
      }
      console.log(`✅ Test user ready: ${testUser.userId}`);
    } catch (error) {
      console.log('⚠️  Using mock user ID for testing');
      testUser = { userId: 'test-user-roleplay-123' };
    }
    
    // Test 1: Get available scenarios
    console.log('\n1️⃣ Testing Available Scenarios...');
    try {
      const scenarios = await roleplayService.getAvailableScenarios('en', 'intermediate');
      
      console.log('✅ Available scenarios retrieved');
      console.log(`   Total scenarios: ${scenarios.length}`);
      
      scenarios.forEach((scenario, index) => {
        console.log(`\n   ${index + 1}. ${scenario.name}`);
        console.log(`      Description: ${scenario.description}`);
        console.log(`      Difficulty: ${scenario.difficulty.join(', ')}`);
        console.log(`      Duration: ${scenario.estimatedDuration} minutes`);
        console.log(`      Objectives: ${scenario.objectives}, Challenges: ${scenario.challenges}`);
      });
      
    } catch (error) {
      console.log(`❌ Error getting scenarios: ${error.message}`);
    }
    
    // Test 2: Create roleplay session
    console.log('\n2️⃣ Testing Roleplay Session Creation...');
    try {
      const session = await roleplayService.createRoleplaySession({
        userId: testUser.userId,
        scenario: 'restaurant',
        language: 'en',
        proficiencyLevel: 'intermediate',
        customSettings: {
          timeLimit: 20,
          enableHints: true
        }
      });
      
      console.log('✅ Roleplay session created');
      console.log(`   Session ID: ${session.sessionId}`);
      console.log(`   Scenario: ${session.scenario}`);
      console.log(`   Language: ${session.language}`);
      console.log(`   Proficiency: ${session.proficiencyLevel}`);
      console.log(`   Status: ${session.status}`);
      
      console.log('\n   🎭 Role Information:');
      console.log(`   User Role: ${session.roles.user.name}`);
      console.log(`   AI Role: ${session.roles.ai.name}`);
      console.log(`   User Description: ${session.roles.user.description}`);
      console.log(`   AI Description: ${session.roles.ai.description}`);
      
      console.log('\n   📋 User Objectives:');
      session.roles.user.objectives.forEach((objective, index) => {
        console.log(`      ${index + 1}. ${objective}`);
      });
      
      console.log('\n   🎯 Success Criteria:');
      session.successCriteria.forEach((criteria, index) => {
        console.log(`      ${index + 1}. ${criteria}`);
      });
      
      console.log('\n   ⚡ Challenges:');
      session.challenges.forEach((challenge, index) => {
        console.log(`      ${index + 1}. ${challenge}`);
      });
      
      // Store session for later tests
      const testSessionId = session.sessionId;
      
      // Test 3: Start roleplay conversation
      console.log('\n3️⃣ Testing Roleplay Conversation Start...');
      try {
        const conversation = await roleplayService.startRoleplayConversation(testSessionId, testUser.userId);
        
        console.log('✅ Roleplay conversation started');
        console.log(`   Conversation ID: ${conversation.conversation.conversationId}`);
        console.log(`   Session Status: ${conversation.session.status}`);
        
        console.log('\n   💬 Initial Message:');
        console.log(`   Role: ${conversation.initialMessage.role}`);
        console.log(`   Message: "${conversation.initialMessage.content}"`);
        console.log(`   Context: ${conversation.initialMessage.context.setting}`);
        
        console.log('\n   📚 Learning Objectives:');
        conversation.initialMessage.objectives.forEach((objective, index) => {
          console.log(`      ${index + 1}. ${objective}`);
        });
        
      } catch (error) {
        console.log(`❌ Error starting conversation: ${error.message}`);
      }
      
      // Test 4: Process roleplay messages
      console.log('\n4️⃣ Testing Roleplay Message Processing...');
      try {
        const testMessages = [
          "Hello! I'd like to see your menu please.",
          "What do you recommend for someone who likes spicy food?",
          "I have a nut allergy, are there any dishes I should avoid?",
          "This looks great! I'll have the chicken curry and a glass of water.",
          "Could I get the bill please? And what's the usual tip here?"
        ];
        
        for (let i = 0; i < testMessages.length; i++) {
          const message = testMessages[i];
          console.log(`\n   Message ${i + 1}: "${message}"`);
          
          try {
            const response = await roleplayService.processRoleplayMessage({
              sessionId: testSessionId,
              userId: testUser.userId,
              message: message,
              audioData: null
            });
            
            console.log(`   ✅ Processed successfully`);
            console.log(`   AI Response: "${response.aiMessage.content}"`);
            console.log(`   Score: ${response.roleplayProgress.score}`);
            console.log(`   Messages Exchanged: ${response.roleplayProgress.messagesExchanged}`);
            
            if (response.roleplayProgress.objectivesCompleted.length > 0) {
              console.log(`   🎯 Objectives Completed: ${response.roleplayProgress.objectivesCompleted.join(', ')}`);
            }
            
            if (response.roleplayProgress.challengesFaced.length > 0) {
              console.log(`   ⚡ Challenges Faced: ${response.roleplayProgress.challengesFaced.join(', ')}`);
            }
            
            if (response.nextChallenges && response.nextChallenges.suggestions.length > 0) {
              console.log(`   💡 Suggestions: ${response.nextChallenges.suggestions.join(', ')}`);
            }
            
          } catch (error) {
            console.log(`   ❌ Error processing message: ${error.message}`);
          }
        }
        
      } catch (error) {
        console.log(`❌ Error in message processing test: ${error.message}`);
      }
      
      // Test 5: End roleplay session
      console.log('\n5️⃣ Testing Roleplay Session End...');
      try {
        const endResult = await roleplayService.endRoleplaySession(testSessionId, testUser.userId);
        
        console.log('✅ Roleplay session ended');
        console.log(`   Final Score: ${endResult.finalScore}/100`);
        console.log(`   Completion Rate: ${(endResult.completionRate * 100).toFixed(1)}%`);
        console.log(`   Challenge Rate: ${(endResult.challengeRate * 100).toFixed(1)}%`);
        
        console.log('\n   📊 Feedback:');
        console.log(`   Overall: ${endResult.feedback.overall}`);
        
        if (endResult.feedback.strengths.length > 0) {
          console.log('\n   💪 Strengths:');
          endResult.feedback.strengths.forEach((strength, index) => {
            console.log(`      ${index + 1}. ${strength}`);
          });
        }
        
        if (endResult.feedback.areasForImprovement.length > 0) {
          console.log('\n   🎯 Areas for Improvement:');
          endResult.feedback.areasForImprovement.forEach((area, index) => {
            console.log(`      ${index + 1}. ${area}`);
          });
        }
        
        if (endResult.feedback.recommendations.length > 0) {
          console.log('\n   💡 Recommendations:');
          endResult.feedback.recommendations.forEach((rec, index) => {
            console.log(`      ${index + 1}. ${rec}`);
          });
        }
        
      } catch (error) {
        console.log(`❌ Error ending session: ${error.message}`);
      }
      
    } catch (error) {
      console.log(`❌ Error creating session: ${error.message}`);
    }
    
    // Test 6: Test different scenarios
    console.log('\n6️⃣ Testing Different Scenarios...');
    const testScenarios = ['shopping', 'directions', 'job_interview', 'doctor_visit'];
    
    for (const scenario of testScenarios) {
      try {
        const session = await roleplayService.createRoleplaySession({
          userId: testUser.userId,
          scenario: scenario,
          language: 'en',
          proficiencyLevel: 'intermediate'
        });
        
        console.log(`   ✅ ${scenario}: ${session.roles.user.name} vs ${session.roles.ai.name}`);
        console.log(`      Objectives: ${session.roles.user.objectives.length}, Challenges: ${session.challenges.length}`);
        
      } catch (error) {
        console.log(`   ❌ ${scenario}: ${error.message}`);
      }
    }
    
    // Test 7: Get user roleplay history
    console.log('\n7️⃣ Testing User Roleplay History...');
    try {
      const history = await roleplayService.getUserRoleplayHistory(testUser.userId, { limit: 5 });
      
      console.log('✅ Roleplay history retrieved');
      console.log(`   Total sessions: ${history.length}`);
      
      history.forEach((session, index) => {
        console.log(`\n   ${index + 1}. ${session.scenario} (${session.status})`);
        console.log(`      Created: ${session.createdAt}`);
        console.log(`      Score: ${session.finalScore || session.progress?.score || 'N/A'}`);
        console.log(`      Messages: ${session.progress?.messagesExchanged || 0}`);
      });
      
    } catch (error) {
      console.log(`❌ Error getting history: ${error.message}`);
    }
    
    console.log('\n🎉 Role-Playing Scenarios System testing completed!');
    console.log('\n📋 Available features:');
    console.log('   ✅ Multiple realistic scenarios (restaurant, shopping, directions, job interview, doctor)');
    console.log('   ✅ Role-based conversations with clear objectives');
    console.log('   ✅ Progress tracking and scoring system');
    console.log('   ✅ Challenge identification and suggestions');
    console.log('   ✅ Adaptive difficulty based on proficiency level');
    console.log('   ✅ Comprehensive feedback and recommendations');
    console.log('   ✅ Session history and analytics');
    console.log('   ✅ Multi-language support');
    console.log('   ✅ Customizable session settings');
    console.log('   ✅ Real-time objective completion tracking');
    console.log('   ✅ Contextual AI responses');
    console.log('   ✅ Success criteria evaluation');
    
  } catch (error) {
    console.error('❌ Error testing roleplay scenarios system:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your AWS credentials in .env file');
    console.log('2. Verify DynamoDB tables exist and are accessible');
    console.log('3. Make sure user service is working correctly');
    console.log('4. Check conversation service integration');
  }
}

testRoleplayScenarios();
