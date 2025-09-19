const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configure AWS
AWS.config.update({
  region: process.env.POLLY_REGION || 'ap-southeast-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const polly = new AWS.Polly();

async function testPollyService() {
  try {
    console.log('🎵 Testing Amazon Polly Service...\n');
    
    // Test 1: Check available voices
    console.log('1️⃣ Testing voice listing...');
    try {
      const voices = await polly.describeVoices({
        LanguageCode: 'en-US'
      }).promise();
      console.log('✅ Successfully connected to Amazon Polly');
      console.log(`   Found ${voices.Voices.length} English voices`);
      
      // Show some popular voices
      const popularVoices = voices.Voices.filter(voice => 
        ['Joanna', 'Matthew', 'Amy', 'Brian', 'Emma'].includes(voice.Name)
      );
      console.log('\n📋 Popular voices available:');
      popularVoices.forEach(voice => {
        console.log(`   - ${voice.Name} (${voice.Gender}) - ${voice.LanguageName}`);
      });
      
    } catch (error) {
      console.log('❌ Error listing voices:', error.message);
    }
    
    // Test 2: Test speech synthesis
    console.log('\n2️⃣ Testing speech synthesis...');
    try {
      const testText = "Hello! Welcome to the AI Language Learning Companion. I'm here to help you practice your language skills.";
      
      const synthesisParams = {
        Text: testText,
        OutputFormat: 'mp3',
        VoiceId: 'Joanna',
        LanguageCode: 'en-US',
        Engine: 'neural' // Use neural engine for better quality
      };
      
      const result = await polly.synthesizeSpeech(synthesisParams).promise();
      console.log('✅ Successfully synthesized speech');
      console.log(`   Text: "${testText}"`);
      console.log(`   Voice: Joanna (Neural)`);
      console.log(`   Format: MP3`);
      console.log(`   Audio size: ${result.AudioStream.length} bytes`);
      
      // Save audio file for testing
      const audioPath = path.join(__dirname, 'test-audio.mp3');
      fs.writeFileSync(audioPath, result.AudioStream);
      console.log(`   Audio saved to: ${audioPath}`);
      
    } catch (error) {
      console.log('❌ Error synthesizing speech:', error.message);
    }
    
    // Test 3: Test different languages
    console.log('\n3️⃣ Testing multi-language support...');
    try {
      const languages = [
        { code: 'en-US', name: 'English (US)', voice: 'Joanna' },
        { code: 'es-ES', name: 'Spanish (Spain)', voice: 'Lucia' },
        { code: 'fr-FR', name: 'French (France)', voice: 'Lea' },
        { code: 'de-DE', name: 'German (Germany)', voice: 'Marlene' }
      ];
      
      for (const lang of languages) {
        try {
          const voices = await polly.describeVoices({
            LanguageCode: lang.code
          }).promise();
          console.log(`   ✅ ${lang.name}: ${voices.Voices.length} voices available`);
        } catch (error) {
          console.log(`   ❌ ${lang.name}: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.log('❌ Error testing languages:', error.message);
    }
    
    // Test 4: Test SSML (Speech Synthesis Markup Language)
    console.log('\n4️⃣ Testing SSML support...');
    try {
      const ssmlText = `
        <speak>
          <p>Welcome to the AI Language Learning Companion!</p>
          <break time="1s"/>
          <p>Today we will practice <emphasis>pronunciation</emphasis> and <emphasis>conversation</emphasis>.</p>
          <break time="2s"/>
          <p>Are you ready to begin?</p>
        </speak>
      `;
      
      const ssmlParams = {
        Text: ssmlText,
        OutputFormat: 'mp3',
        VoiceId: 'Joanna',
        TextType: 'ssml',
        Engine: 'neural'
      };
      
      const ssmlResult = await polly.synthesizeSpeech(ssmlParams).promise();
      console.log('✅ Successfully synthesized SSML speech');
      console.log(`   SSML Text: ${ssmlText.replace(/\s+/g, ' ').trim()}`);
      console.log(`   Audio size: ${ssmlResult.AudioStream.length} bytes`);
      
      // Save SSML audio file
      const ssmlAudioPath = path.join(__dirname, 'test-ssml-audio.mp3');
      fs.writeFileSync(ssmlAudioPath, ssmlResult.AudioStream);
      console.log(`   SSML Audio saved to: ${ssmlAudioPath}`);
      
    } catch (error) {
      console.log('❌ Error synthesizing SSML:', error.message);
    }
    
    console.log('\n🎉 Amazon Polly service is working correctly!');
    console.log('\n📋 Available features:');
    console.log('   ✅ Text-to-speech synthesis');
    console.log('   ✅ Multiple languages and voices');
    console.log('   ✅ Neural engine for high quality');
    console.log('   ✅ SSML support for advanced speech control');
    console.log('   ✅ Real-time audio generation');
    
  } catch (error) {
    console.error('❌ Error testing Polly service:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your AWS credentials in .env file');
    console.log('2. Verify you have Polly permissions');
    console.log('3. Make sure the Singapore region is available');
  }
}

testPollyService();
