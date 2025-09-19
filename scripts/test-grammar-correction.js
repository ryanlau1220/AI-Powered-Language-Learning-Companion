const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS
AWS.config.update({
  region: process.env.REGION || 'ap-southeast-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const bedrockService = require('../backend/src/services/bedrockService');

async function testGrammarCorrection() {
  try {
    console.log('📝 Testing Contextual Grammar Correction System...\n');
    
    // Test cases with different grammar errors and proficiency levels
    const testCases = [
      {
        text: "i am go to school yesterday",
        language: "en-US",
        proficiencyLevel: "beginner",
        context: "Talking about past activities",
        description: "Basic verb tense errors"
      },
      {
        text: "he don't can speak english very good",
        language: "en-US", 
        proficiencyLevel: "intermediate",
        context: "Describing language abilities",
        description: "Auxiliary verb and adverb errors"
      },
      {
        text: "me and him went to the store to buy some foods",
        language: "en-US",
        proficiencyLevel: "advanced",
        context: "Narrating a shopping experience",
        description: "Pronoun case and article errors"
      },
      {
        text: "if i was you, i would study more harder",
        language: "en-US",
        proficiencyLevel: "advanced",
        context: "Giving advice",
        description: "Subjunctive mood and comparative errors"
      }
    ];
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`${i + 1}️⃣ Testing ${testCase.description}...`);
      console.log(`   Proficiency: ${testCase.proficiencyLevel}`);
      console.log(`   Context: ${testCase.context}`);
      console.log(`   Original: "${testCase.text}"`);
      
      try {
        // Test basic grammar analysis
        const grammarAnalysis = await bedrockService.analyzeGrammar({
          text: testCase.text,
          language: testCase.language,
          proficiencyLevel: testCase.proficiencyLevel,
          context: testCase.context
        });
        
        console.log('✅ Grammar analysis completed');
        console.log(`   Corrected: "${grammarAnalysis.correctedText}"`);
        console.log(`   Grammar Score: ${(grammarAnalysis.grammarScore * 100).toFixed(1)}%`);
        
        // Display errors found
        if (grammarAnalysis.errors && grammarAnalysis.errors.length > 0) {
          console.log('\n   🔍 Errors Found:');
          grammarAnalysis.errors.forEach((error, index) => {
            console.log(`      ${index + 1}. ${error.type}: ${error.description}`);
            console.log(`         Suggestion: ${error.suggestion}`);
          });
        }
        
        // Display suggestions
        if (grammarAnalysis.suggestions && grammarAnalysis.suggestions.length > 0) {
          console.log('\n   💡 Grammar Suggestions:');
          grammarAnalysis.suggestions.forEach((suggestion, index) => {
            console.log(`      ${index + 1}. ${suggestion.rule}`);
            console.log(`         ${suggestion.explanation}`);
            console.log(`         Example: ${suggestion.example}`);
          });
        }
        
        // Display learning points
        if (grammarAnalysis.learningPoints && grammarAnalysis.learningPoints.length > 0) {
          console.log('\n   📚 Learning Points:');
          grammarAnalysis.learningPoints.forEach((point, index) => {
            console.log(`      ${index + 1}. ${point.topic} (${point.importance} priority)`);
            console.log(`         Practice: ${point.practice_tip}`);
          });
        }
        
      } catch (error) {
        console.log(`❌ Error in grammar analysis: ${error.message}`);
      }
      
      console.log(''); // Empty line for readability
    }
    
    // Test 5: Contextual grammar correction
    console.log('5️⃣ Testing Contextual Grammar Correction...');
    try {
      const conversationContext = [
        { type: 'ai', content: 'Hello! How was your day?' },
        { type: 'user', content: 'it was good, i went to the park with my friends' },
        { type: 'ai', content: 'That sounds lovely! What did you do at the park?' }
      ];
      
      const contextualText = "we played football and then we eat some ice cream";
      
      const contextualCorrection = await bedrockService.contextualGrammarCorrection({
        text: contextualText,
        conversationContext: conversationContext,
        language: 'en-US',
        proficiencyLevel: 'intermediate'
      });
      
      console.log('✅ Contextual grammar correction completed');
      console.log(`   Original: "${contextualCorrection.originalText}"`);
      console.log(`   Corrected: "${contextualCorrection.correctedText}"`);
      console.log(`   Overall Score: ${(contextualCorrection.overallScore * 100).toFixed(1)}%`);
      
      if (contextualCorrection.contextualCorrections && contextualCorrection.contextualCorrections.length > 0) {
        console.log('\n   🔄 Contextual Corrections:');
        contextualCorrection.contextualCorrections.forEach((correction, index) => {
          console.log(`      ${index + 1}. "${correction.original}" → "${correction.corrected}"`);
          console.log(`         Reason: ${correction.reason}`);
          console.log(`         Context: ${correction.context}`);
        });
      }
      
      if (contextualCorrection.styleImprovements && contextualCorrection.styleImprovements.length > 0) {
        console.log('\n   ✨ Style Improvements:');
        contextualCorrection.styleImprovements.forEach((improvement, index) => {
          console.log(`      ${index + 1}. ${improvement.suggestion}`);
          console.log(`         ${improvement.explanation}`);
          console.log(`         Example: ${improvement.example}`);
        });
      }
      
      if (contextualCorrection.fluencyEnhancements && contextualCorrection.fluencyEnhancements.length > 0) {
        console.log('\n   🚀 Fluency Enhancements:');
        contextualCorrection.fluencyEnhancements.forEach((enhancement, index) => {
          console.log(`      ${index + 1}. ${enhancement.improvement}`);
          console.log(`         Reason: ${enhancement.reason}`);
          console.log(`         Alternative: ${enhancement.alternative}`);
        });
      }
      
      if (contextualCorrection.culturalNotes && contextualCorrection.culturalNotes.length > 0) {
        console.log('\n   🌍 Cultural Notes:');
        contextualCorrection.culturalNotes.forEach((note, index) => {
          console.log(`      ${index + 1}. ${note.note}`);
          console.log(`         ${note.explanation}`);
          console.log(`         Context: ${note.context}`);
        });
      }
      
    } catch (error) {
      console.log(`❌ Error in contextual correction: ${error.message}`);
    }
    
    // Test 6: Multi-language support
    console.log('\n6️⃣ Testing Multi-language Grammar Support...');
    const multiLanguageTests = [
      {
        text: "je suis aller au marché hier",
        language: "fr-FR",
        proficiencyLevel: "intermediate",
        description: "French verb tense error"
      },
      {
        text: "yo soy ir a la escuela",
        language: "es-ES", 
        proficiencyLevel: "beginner",
        description: "Spanish verb conjugation error"
      }
    ];
    
    for (const test of multiLanguageTests) {
      try {
        console.log(`\n   Testing ${test.description}...`);
        const analysis = await bedrockService.analyzeGrammar({
          text: test.text,
          language: test.language,
          proficiencyLevel: test.proficiencyLevel,
          context: 'General conversation'
        });
        
        console.log(`   Original: "${analysis.originalText}"`);
        console.log(`   Corrected: "${analysis.correctedText}"`);
        console.log(`   Score: ${(analysis.grammarScore * 100).toFixed(1)}%`);
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Contextual Grammar Correction System testing completed!');
    console.log('\n📋 Available features:');
    console.log('   ✅ Advanced grammar analysis with Bedrock AI');
    console.log('   ✅ Contextual grammar correction');
    console.log('   ✅ Multi-language support (English, Spanish, French)');
    console.log('   ✅ Proficiency-level appropriate feedback');
    console.log('   ✅ Style and fluency improvements');
    console.log('   ✅ Cultural context awareness');
    console.log('   ✅ Detailed error explanations');
    console.log('   ✅ Learning points and practice tips');
    console.log('   ✅ Fallback basic grammar analysis');
    console.log('   ✅ Real-time correction suggestions');
    
  } catch (error) {
    console.error('❌ Error testing grammar correction system:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your AWS credentials in .env file');
    console.log('2. Verify Amazon Bedrock permissions');
    console.log('3. Make sure the Singapore region is available');
    console.log('4. Check if the Nova model is accessible');
  }
}

testGrammarCorrection();
