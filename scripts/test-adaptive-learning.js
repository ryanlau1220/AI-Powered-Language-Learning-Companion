const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS
AWS.config.update({
  region: process.env.REGION || 'ap-southeast-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const adaptiveLearningService = require('../backend/src/services/adaptiveLearningService');
const userService = require('../backend/src/services/userService');

async function testAdaptiveLearning() {
  try {
    console.log('🧠 Testing Adaptive Learning System...\n');
    
    // Create or get a test user with some progress data
    let testUser;
    try {
      testUser = await userService.getUserByEmail('adaptive-test@example.com');
      if (!testUser) {
        testUser = await userService.registerUser({
          username: 'adaptivetest',
          email: 'adaptive-test@example.com',
          password: 'password123',
          nativeLanguage: 'en',
          targetLanguages: ['es', 'fr']
        });
      }
      console.log(`✅ Test user ready: ${testUser.userId}`);
    } catch (error) {
      console.log('⚠️  Using mock user ID for testing');
      testUser = { userId: 'test-user-adaptive-123' };
    }
    
    // Test 1: Analyze user progress
    console.log('\n1️⃣ Testing User Progress Analysis...');
    try {
      const progressAnalysis = await adaptiveLearningService.analyzeUserProgress(testUser.userId);
      
      console.log('✅ Progress analysis completed');
      console.log(`   Current Proficiency: ${JSON.stringify(progressAnalysis.currentProficiency)}`);
      console.log(`   Learning Streak: ${progressAnalysis.learningStreak} days`);
      console.log(`   Total Conversations: ${progressAnalysis.totalConversations}`);
      console.log(`   Average Scores:`);
      console.log(`     - Pronunciation: ${(progressAnalysis.averageScores.pronunciation * 100).toFixed(1)}%`);
      console.log(`     - Grammar: ${(progressAnalysis.averageScores.grammar * 100).toFixed(1)}%`);
      console.log(`   Learning Velocity: ${progressAnalysis.learningVelocity.toFixed(3)}`);
      console.log(`   Engagement Level: ${progressAnalysis.engagementLevel}`);
      console.log(`   Difficulty Adjustment: ${progressAnalysis.difficultyAdjustment.toFixed(2)}`);
      
      // Display strengths
      if (progressAnalysis.strengths && progressAnalysis.strengths.length > 0) {
        console.log('\n   💪 Strengths:');
        progressAnalysis.strengths.forEach((strength, index) => {
          console.log(`      ${index + 1}. ${strength.area}: ${strength.language || strength.scenario} (${(strength.confidence * 100).toFixed(1)}% confidence)`);
        });
      }
      
      // Display weaknesses
      if (progressAnalysis.weaknesses && progressAnalysis.weaknesses.length > 0) {
        console.log('\n   🎯 Areas for Improvement:');
        progressAnalysis.weaknesses.forEach((weakness, index) => {
          console.log(`      ${index + 1}. ${weakness.area}: ${weakness.description}`);
        });
      }
      
    } catch (error) {
      console.log(`❌ Error in progress analysis: ${error.message}`);
    }
    
    // Test 2: Generate focus recommendations
    console.log('\n2️⃣ Testing Focus Recommendations...');
    try {
      const progressAnalysis = await adaptiveLearningService.analyzeUserProgress(testUser.userId);
      const recommendations = progressAnalysis.recommendedFocus;
      
      console.log('✅ Focus recommendations generated');
      console.log(`   Total recommendations: ${recommendations.length}`);
      
      recommendations.forEach((rec, index) => {
        console.log(`\n   ${index + 1}. ${rec.area.toUpperCase()} (${rec.priority} priority)`);
        console.log(`      Description: ${rec.description}`);
        console.log(`      Exercises: ${rec.exercises.join(', ')}`);
        console.log(`      Estimated Time: ${rec.estimatedTime}`);
      });
      
    } catch (error) {
      console.log(`❌ Error generating recommendations: ${error.message}`);
    }
    
    // Test 3: Generate milestones
    console.log('\n3️⃣ Testing Milestone Generation...');
    try {
      const progressAnalysis = await adaptiveLearningService.analyzeUserProgress(testUser.userId);
      const milestones = progressAnalysis.nextMilestones;
      
      console.log('✅ Milestones generated');
      console.log(`   Total milestones: ${milestones.length}`);
      
      milestones.forEach((milestone, index) => {
        console.log(`\n   ${index + 1}. ${milestone.type.toUpperCase()} Milestone`);
        console.log(`      Description: ${milestone.description}`);
        console.log(`      Progress: ${milestone.current}/${milestone.target} (${((milestone.current / milestone.target) * 100).toFixed(1)}%)`);
        console.log(`      Reward: ${milestone.reward}`);
        console.log(`      Estimated Time: ${milestone.estimatedTime}`);
      });
      
    } catch (error) {
      console.log(`❌ Error generating milestones: ${error.message}`);
    }
    
    // Test 4: Generate personalized lesson
    console.log('\n4️⃣ Testing Personalized Lesson Generation...');
    try {
      const lesson = await adaptiveLearningService.generatePersonalizedLesson(testUser.userId, 'pronunciation');
      
      console.log('✅ Personalized lesson generated');
      console.log(`   Lesson ID: ${lesson.lessonId}`);
      console.log(`   Focus Area: ${lesson.focusArea}`);
      console.log(`   Difficulty: ${lesson.difficulty}`);
      console.log(`   Scenarios: ${lesson.scenarios.join(', ')}`);
      console.log(`   Estimated Duration: ${lesson.estimatedDuration} minutes`);
      
      console.log('\n   📚 Learning Objectives:');
      lesson.learningObjectives.forEach((objective, index) => {
        console.log(`      ${index + 1}. ${objective}`);
      });
      
      console.log('\n   🎯 Success Criteria:');
      lesson.successCriteria.forEach((criteria, index) => {
        console.log(`      ${index + 1}. ${criteria}`);
      });
      
      console.log('\n   🏃 Exercises:');
      lesson.exercises.forEach((exercise, index) => {
        console.log(`      ${index + 1}. ${exercise.type} (difficulty: ${exercise.difficulty.toFixed(2)})`);
      });
      
    } catch (error) {
      console.log(`❌ Error generating lesson: ${error.message}`);
    }
    
    // Test 5: Test different focus areas
    console.log('\n5️⃣ Testing Different Focus Areas...');
    const focusAreas = ['pronunciation', 'grammar', 'vocabulary', 'fluency', 'advanced_skills'];
    
    for (const focusArea of focusAreas) {
      try {
        const lesson = await adaptiveLearningService.generatePersonalizedLesson(testUser.userId, focusArea);
        console.log(`   ✅ ${focusArea}: ${lesson.difficulty} level, ${lesson.estimatedDuration}min, ${lesson.scenarios.length} scenarios`);
      } catch (error) {
        console.log(`   ❌ ${focusArea}: ${error.message}`);
      }
    }
    
    // Test 6: Update learning path
    console.log('\n6️⃣ Testing Learning Path Update...');
    try {
      const lessonResults = {
        pronunciationScore: 0.75,
        grammarScore: 0.80,
        completionTime: 25,
        exercisesCompleted: 5
      };
      
      const updateResult = await adaptiveLearningService.updateLearningPath(testUser.userId, lessonResults);
      
      console.log('✅ Learning path updated');
      console.log(`   Updated Pronunciation Score: ${(updateResult.updatedProgress.averagePronunciationScore * 100).toFixed(1)}%`);
      console.log(`   Updated Grammar Score: ${(updateResult.updatedProgress.averageGrammarScore * 100).toFixed(1)}%`);
      console.log(`   Learning Streak: ${updateResult.updatedProgress.learningStreak} days`);
      
      if (updateResult.nextRecommendations && updateResult.nextRecommendations.length > 0) {
        console.log('\n   📋 Next Recommendations:');
        updateResult.nextRecommendations.forEach((rec, index) => {
          console.log(`      ${index + 1}. ${rec.area} (${rec.priority} priority)`);
        });
      }
      
      if (updateResult.nextMilestones && updateResult.nextMilestones.length > 0) {
        console.log('\n   🎯 Next Milestones:');
        updateResult.nextMilestones.forEach((milestone, index) => {
          console.log(`      ${index + 1}. ${milestone.description}`);
        });
      }
      
    } catch (error) {
      console.log(`❌ Error updating learning path: ${error.message}`);
    }
    
    // Test 7: Test difficulty calculation
    console.log('\n7️⃣ Testing Difficulty Calculation...');
    try {
      const progressAnalysis = await adaptiveLearningService.analyzeUserProgress(testUser.userId);
      const difficulty = adaptiveLearningService.calculateLessonDifficulty(progressAnalysis);
      
      console.log('✅ Difficulty calculation completed');
      console.log(`   Base Level: ${adaptiveLearningService.getCurrentLevel(progressAnalysis)}`);
      console.log(`   Difficulty Adjustment: ${progressAnalysis.difficultyAdjustment.toFixed(2)}`);
      console.log(`   Final Difficulty: ${difficulty}`);
      
    } catch (error) {
      console.log(`❌ Error calculating difficulty: ${error.message}`);
    }
    
    console.log('\n🎉 Adaptive Learning System testing completed!');
    console.log('\n📋 Available features:');
    console.log('   ✅ Intelligent progress analysis');
    console.log('   ✅ Personalized focus recommendations');
    console.log('   ✅ Dynamic difficulty adjustment');
    console.log('   ✅ Milestone tracking and rewards');
    console.log('   ✅ Personalized lesson generation');
    console.log('   ✅ Multi-focus area support');
    console.log('   ✅ Learning velocity tracking');
    console.log('   ✅ Engagement level analysis');
    console.log('   ✅ Adaptive exercise selection');
    console.log('   ✅ Success criteria generation');
    console.log('   ✅ Learning path optimization');
    
  } catch (error) {
    console.error('❌ Error testing adaptive learning system:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your AWS credentials in .env file');
    console.log('2. Verify DynamoDB tables exist and are accessible');
    console.log('3. Make sure user service is working correctly');
    console.log('4. Check conversation service integration');
  }
}

testAdaptiveLearning();
