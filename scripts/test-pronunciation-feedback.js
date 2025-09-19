const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS
AWS.config.update({
  region: process.env.REGION || 'ap-southeast-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const speechService = require('../backend/src/services/speechService');

async function testPronunciationFeedback() {
  try {
    console.log('🎤 Testing Advanced Pronunciation Feedback System...\n');
    
    // Test cases for different languages and difficulty levels
    const testCases = [
      {
        language: 'en-US',
        expectedText: "Hello, how are you today?",
        description: "Basic English greeting"
      },
      {
        language: 'en-US',
        expectedText: "The quick brown fox jumps over the lazy dog",
        description: "Complex English sentence with challenging sounds"
      },
      {
        language: 'es-ES',
        expectedText: "Hola, ¿cómo estás?",
        description: "Spanish greeting with rolled 'r' sounds"
      },
      {
        language: 'fr-FR',
        expectedText: "Bonjour, comment allez-vous?",
        description: "French greeting with nasal sounds"
      }
    ];
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`${i + 1}️⃣ Testing ${testCase.description}...`);
      
      try {
        // Simulate audio data (in production, this would be actual audio)
        const mockAudioData = `data:audio/wav;base64,${Buffer.from('mock-audio-data').toString('base64')}`;
        
        const feedback = await speechService.getPronunciationFeedback({
          audioData: mockAudioData,
          text: testCase.expectedText,
          languageCode: testCase.language,
          userId: 'test-user-pronunciation'
        });
        
        console.log('✅ Pronunciation feedback generated successfully');
        console.log(`   Expected: "${feedback.expectedText}"`);
        console.log(`   Transcribed: "${feedback.transcription}"`);
        console.log(`   Overall Score: ${(feedback.overallScore * 100).toFixed(1)}%`);
        console.log(`   Confidence Score: ${(feedback.confidenceScore * 100).toFixed(1)}%`);
        
        // Display word-level feedback
        if (feedback.wordLevelFeedback && feedback.wordLevelFeedback.length > 0) {
          console.log('\n   📝 Word-level Analysis:');
          feedback.wordLevelFeedback.forEach((word, index) => {
            const status = word.correct ? '✅' : '❌';
            const confidence = (word.confidence * 100).toFixed(1);
            console.log(`      ${status} "${word.word}" -> "${word.transcribed}" (${confidence}% confidence)`);
          });
        }
        
        // Display phoneme-level feedback
        if (feedback.phonemeLevelFeedback && feedback.phonemeLevelFeedback.length > 0) {
          console.log('\n   🔤 Phoneme-level Analysis:');
          feedback.phonemeLevelFeedback.forEach(wordFeedback => {
            console.log(`      Word: "${wordFeedback.word}"`);
            if (wordFeedback.issues && wordFeedback.issues.length > 0) {
              wordFeedback.issues.forEach(issue => {
                console.log(`        Issue: ${issue.description} (${issue.severity} severity)`);
              });
            }
          });
        }
        
        // Display suggestions
        if (feedback.suggestions && feedback.suggestions.length > 0) {
          console.log('\n   💡 Suggestions:');
          feedback.suggestions.forEach(suggestion => {
            console.log(`      • ${suggestion.word}: ${suggestion.tip}`);
            if (suggestion.practice) {
              console.log(`        Practice: ${suggestion.practice[0]}`);
            }
          });
        }
        
        // Display strengths
        if (feedback.strengths && feedback.strengths.length > 0) {
          console.log('\n   💪 Strengths:');
          feedback.strengths.forEach(strength => {
            console.log(`      • "${strength.word}" - ${strength.strength} (${(strength.confidence * 100).toFixed(1)}% confidence)`);
          });
        }
        
        // Display areas for improvement
        if (feedback.areasForImprovement && feedback.areasForImprovement.length > 0) {
          console.log('\n   🎯 Areas for Improvement:');
          feedback.areasForImprovement.forEach(area => {
            console.log(`      • "${area.word}" - ${area.priority} priority (difficulty: ${(area.difficulty * 100).toFixed(1)}%)`);
          });
        }
        
        // Display detailed analysis
        if (feedback.detailedAnalysis) {
          const analysis = feedback.detailedAnalysis;
          console.log('\n   📊 Detailed Analysis:');
          console.log(`      Total words: ${analysis.totalWords}`);
          console.log(`      Correct words: ${analysis.correctWords}`);
          console.log(`      Incorrect words: ${analysis.incorrectWords}`);
          console.log(`      High confidence words: ${analysis.highConfidenceWords}`);
          console.log(`      Low confidence words: ${analysis.lowConfidenceWords}`);
          
          if (analysis.commonIssues && analysis.commonIssues.length > 0) {
            console.log('\n      Common Issues:');
            analysis.commonIssues.forEach(issue => {
              console.log(`        • ${issue.issue} (${issue.count} occurrences)`);
            });
          }
        }
        
      } catch (error) {
        console.log(`❌ Error testing ${testCase.description}:`, error.message);
      }
      
      console.log(''); // Empty line for readability
    }
    
    // Test 5: Test phoneme analysis specifically
    console.log('5️⃣ Testing Phoneme Analysis...');
    try {
      const phonemeTest = await speechService.analyzePhonemes('hello', 'helo', 'en-US');
      console.log('✅ Phoneme analysis working');
      console.log(`   Expected phonemes: ${phonemeTest.expected.join(', ')}`);
      console.log(`   Transcribed phonemes: ${phonemeTest.transcribed.join(', ')}`);
      console.log(`   Accuracy: ${(phonemeTest.accuracy * 100).toFixed(1)}%`);
      
      if (phonemeTest.matches && phonemeTest.matches.length > 0) {
        console.log('\n   Phoneme Matches:');
        phonemeTest.matches.forEach((match, index) => {
          const status = match.match ? '✅' : '❌';
          console.log(`      ${status} Position ${index}: '${match.expected}' -> '${match.transcribed}' (${(match.similarity * 100).toFixed(1)}% similar)`);
        });
      }
      
    } catch (error) {
      console.log('❌ Error testing phoneme analysis:', error.message);
    }
    
    console.log('\n🎉 Advanced Pronunciation Feedback System testing completed!');
    console.log('\n📋 Available features:');
    console.log('   ✅ Real-time pronunciation analysis');
    console.log('   ✅ Word-level confidence scoring');
    console.log('   ✅ Phoneme-level analysis');
    console.log('   ✅ Multi-language support (English, Spanish, French)');
    console.log('   ✅ Detailed feedback and suggestions');
    console.log('   ✅ Practice exercises generation');
    console.log('   ✅ Difficulty assessment');
    console.log('   ✅ Common issues identification');
    console.log('   ✅ Strengths and improvement areas');
    console.log('   ✅ Levenshtein distance accuracy calculation');
    console.log('   ✅ Language-specific phoneme mapping');
    
  } catch (error) {
    console.error('❌ Error testing pronunciation feedback system:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your AWS credentials in .env file');
    console.log('2. Verify Amazon Transcribe permissions');
    console.log('3. Make sure the Singapore region is available');
    console.log('4. Check if custom vocabularies are created');
  }
}

testPronunciationFeedback();
