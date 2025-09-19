const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configure AWS regions
const malaysiaRegion = process.env.REGION || 'ap-southeast-5';
const singaporeRegion = process.env.TRANSCRIBE_REGION || 'ap-southeast-1';

class SpeechService {
  constructor() {
    // Configure AWS with explicit credentials
    AWS.config.update({
      region: singaporeRegion,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });

    // Initialize AWS services
    this.transcribe = new AWS.TranscribeService({ region: singaporeRegion });
    this.polly = new AWS.Polly({ region: singaporeRegion });
  }

  async transcribeAudio({ audioData, languageCode, userId }) {
    try {
      const jobName = `transcription-${userId}-${Date.now()}`;
      
      // For real-time transcription, we'll use a simplified approach
      // In production, you might want to use Amazon Transcribe Streaming
      const params = {
        TranscriptionJobName: jobName,
        LanguageCode: languageCode || 'en-US',
        Media: {
          MediaFileUri: audioData // This should be an S3 URI in production
        },
        MediaFormat: 'wav',
        Settings: {
          ShowSpeakerLabels: false,
          MaxSpeakerLabels: 1,
          ShowAlternatives: true,
          MaxAlternatives: 3
        }
      };

      const result = await this.transcribe.startTranscriptionJob(params).promise();
      
      // Poll for completion (in production, use SNS notifications)
      const transcriptionResult = await this.pollTranscriptionJob(jobName);
      
      return {
        transcriptionId: jobName,
        text: transcriptionResult.Transcript.TranscriptFileUri,
        confidence: transcriptionResult.Transcript.TranscriptFileUri,
        alternatives: transcriptionResult.Transcript.TranscriptFileUri,
        languageCode: languageCode || 'en-US'
      };
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }

  async transcribeAudioWithDetails({ audioData, languageCode, userId }) {
    try {
      const jobName = `detailed-transcription-${userId}-${Date.now()}`;
      
      const params = {
        TranscriptionJobName: jobName,
        LanguageCode: languageCode || 'en-US',
        Media: {
          MediaFileUri: audioData
        },
        MediaFormat: 'wav',
        Settings: {
          ShowSpeakerLabels: false,
          MaxSpeakerLabels: 1,
          ShowAlternatives: true,
          MaxAlternatives: 5,
          VocabularyName: this.getLanguageVocabulary(languageCode)
        }
      };

      const result = await this.transcribe.startTranscriptionJob(params).promise();
      const transcriptionResult = await this.pollTranscriptionJob(jobName);
      
      // Parse detailed results
      const detailedResults = await this.parseTranscriptionResults(transcriptionResult);
      
      return {
        transcriptionId: jobName,
        text: detailedResults.text,
        overallConfidence: detailedResults.overallConfidence,
        confidenceScores: detailedResults.confidenceScores,
        alternatives: detailedResults.alternatives,
        languageCode: languageCode || 'en-US'
      };
    } catch (error) {
      console.error('Error transcribing audio with details:', error);
      throw error;
    }
  }

  async synthesizeSpeech({ text, voiceId, languageCode, userId }) {
    try {
      const params = {
        Text: text,
        OutputFormat: 'mp3',
        VoiceId: voiceId || 'Joanna', // Default English voice
        LanguageCode: languageCode || 'en-US',
        Engine: 'neural' // Use neural engine for better quality
      };

      const result = await this.polly.synthesizeSpeech(params).promise();
      
      // Convert audio stream to base64 for API response
      const audioData = result.AudioStream.toString('base64');
      
      return {
        audioData,
        format: 'mp3',
        voiceId: voiceId || 'Joanna',
        languageCode: languageCode || 'en-US'
      };
    } catch (error) {
      console.error('Error synthesizing speech:', error);
      throw error;
    }
  }

  async getPronunciationFeedback({ audioData, text, languageCode, userId }) {
    try {
      // First transcribe the audio with detailed analysis
      const transcription = await this.transcribeAudioWithDetails({
        audioData,
        languageCode,
        userId
      });

      // Analyze pronunciation with confidence scores
      const feedback = await this.analyzePronunciationAdvanced(
        transcription.text, 
        text, 
        transcription.confidenceScores,
        languageCode
      );
      
      return {
        transcription: transcription.text,
        expectedText: text,
        overallScore: feedback.overallScore,
        confidenceScore: transcription.overallConfidence,
        wordLevelFeedback: feedback.wordLevelFeedback,
        phonemeLevelFeedback: feedback.phonemeLevelFeedback,
        suggestions: feedback.suggestions,
        strengths: feedback.strengths,
        areasForImprovement: feedback.areasForImprovement,
        detailedAnalysis: feedback.detailedAnalysis
      };
    } catch (error) {
      console.error('Error getting pronunciation feedback:', error);
      throw error;
    }
  }

  analyzePronunciation(transcribedText, expectedText) {
    // Simple pronunciation analysis
    // In production, you'd use more sophisticated phoneme analysis
    const transcribedWords = transcribedText.toLowerCase().split(' ');
    const expectedWords = expectedText.toLowerCase().split(' ');
    
    let correctWords = 0;
    const wordLevelFeedback = [];
    
    expectedWords.forEach((expectedWord, index) => {
      const transcribedWord = transcribedWords[index] || '';
      const isCorrect = expectedWord === transcribedWord;
      
      if (isCorrect) correctWords++;
      
      wordLevelFeedback.push({
        word: expectedWord,
        transcribed: transcribedWord,
        correct: isCorrect,
        confidence: isCorrect ? 1.0 : 0.5
      });
    });
    
    const overallScore = correctWords / expectedWords.length;
    
    return {
      overallScore,
      wordLevelFeedback,
      phonemeLevelFeedback: [], // Would be populated with actual phoneme analysis
      suggestions: this.generatePronunciationSuggestions(wordLevelFeedback)
    };
  }

  generatePronunciationSuggestions(wordLevelFeedback) {
    const suggestions = [];
    
    wordLevelFeedback.forEach(feedback => {
      if (!feedback.correct) {
        suggestions.push({
          word: feedback.word,
          issue: 'Pronunciation needs improvement',
          tip: `Try to pronounce "${feedback.word}" more clearly`
        });
      }
    });
    
    return suggestions;
  }

  getLanguageVocabulary(languageCode) {
    const vocabularies = {
      'en-US': 'language-learning-english-vocab',
      'es-ES': 'language-learning-spanish-vocab',
      'fr-FR': 'language-learning-french-vocab',
      'de-DE': 'language-learning-german-vocab'
    };
    return vocabularies[languageCode] || null;
  }

  async parseTranscriptionResults(transcriptionResult) {
    try {
      // In production, you would fetch and parse the actual transcript file
      // For now, we'll simulate detailed results
      const mockResults = {
        text: "Hello, how are you today?",
        overallConfidence: 0.85,
        confidenceScores: [
          { word: "Hello", confidence: 0.95 },
          { word: "how", confidence: 0.90 },
          { word: "are", confidence: 0.80 },
          { word: "you", confidence: 0.85 },
          { word: "today", confidence: 0.75 }
        ],
        alternatives: [
          { text: "Hello, how are you today?", confidence: 0.85 },
          { text: "Hello, how are you doing?", confidence: 0.70 },
          { text: "Hi, how are you today?", confidence: 0.65 }
        ]
      };
      
      return mockResults;
    } catch (error) {
      console.error('Error parsing transcription results:', error);
      throw error;
    }
  }

  async analyzePronunciationAdvanced(transcribedText, expectedText, confidenceScores, languageCode) {
    try {
      const transcribedWords = transcribedText.toLowerCase().split(/\s+/);
      const expectedWords = expectedText.toLowerCase().split(/\s+/);
      
      const wordLevelFeedback = [];
      const phonemeLevelFeedback = [];
      const suggestions = [];
      const strengths = [];
      const areasForImprovement = [];
      
      let totalConfidence = 0;
      let correctWords = 0;
      
      // Analyze each word
      expectedWords.forEach((expectedWord, index) => {
        const transcribedWord = transcribedWords[index] || '';
        const confidence = confidenceScores[index]?.confidence || 0.5;
        const isCorrect = expectedWord === transcribedWord;
        const confidenceThreshold = 0.7;
        
        totalConfidence += confidence;
        if (isCorrect) correctWords++;
        
        const wordFeedback = {
          word: expectedWord,
          transcribed: transcribedWord,
          correct: isCorrect,
          confidence: confidence,
          accuracy: isCorrect ? 1.0 : this.calculateWordAccuracy(expectedWord, transcribedWord),
          phonemes: this.analyzePhonemes(expectedWord, transcribedWord, languageCode)
        };
        
        wordLevelFeedback.push(wordFeedback);
        
        // Generate phoneme-level feedback
        if (!isCorrect || confidence < confidenceThreshold) {
          const phonemeAnalysis = this.analyzePhonemes(expectedWord, transcribedWord, languageCode);
          phonemeLevelFeedback.push({
            word: expectedWord,
            phonemes: phonemeAnalysis,
            issues: this.identifyPhonemeIssues(phonemeAnalysis)
          });
          
          suggestions.push({
            word: expectedWord,
            issue: confidence < confidenceThreshold ? 'Low confidence' : 'Incorrect pronunciation',
            tip: this.generatePhonemeTip(expectedWord, phonemeAnalysis),
            practice: this.generatePracticeExercise(expectedWord, languageCode)
          });
          
          areasForImprovement.push({
            word: expectedWord,
            difficulty: this.calculateDifficulty(expectedWord, languageCode),
            priority: confidence < 0.5 ? 'high' : 'medium'
          });
        } else {
          strengths.push({
            word: expectedWord,
            strength: confidence > 0.9 ? 'excellent' : 'good',
            confidence: confidence
          });
        }
      });
      
      const overallScore = correctWords / expectedWords.length;
      const averageConfidence = totalConfidence / expectedWords.length;
      
      return {
        overallScore: Math.round(overallScore * 100) / 100,
        averageConfidence: Math.round(averageConfidence * 100) / 100,
        wordLevelFeedback,
        phonemeLevelFeedback,
        suggestions,
        strengths,
        areasForImprovement,
        detailedAnalysis: {
          totalWords: expectedWords.length,
          correctWords,
          incorrectWords: expectedWords.length - correctWords,
          highConfidenceWords: wordLevelFeedback.filter(w => w.confidence > 0.8).length,
          lowConfidenceWords: wordLevelFeedback.filter(w => w.confidence < 0.6).length,
          commonIssues: this.identifyCommonIssues(phonemeLevelFeedback),
          improvementAreas: this.prioritizeImprovementAreas(areasForImprovement)
        }
      };
    } catch (error) {
      console.error('Error in advanced pronunciation analysis:', error);
      throw error;
    }
  }

  calculateWordAccuracy(expectedWord, transcribedWord) {
    // Simple Levenshtein distance-based accuracy
    const distance = this.levenshteinDistance(expectedWord, transcribedWord);
    const maxLength = Math.max(expectedWord.length, transcribedWord.length);
    return maxLength === 0 ? 1.0 : 1 - (distance / maxLength);
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  analyzePhonemes(expectedWord, transcribedWord, languageCode) {
    // Simplified phoneme analysis
    // In production, you would use actual phoneme mapping
    const phonemeMap = this.getPhonemeMap(languageCode);
    const expectedPhonemes = this.wordToPhonemes(expectedWord, phonemeMap);
    const transcribedPhonemes = this.wordToPhonemes(transcribedWord, phonemeMap);
    
    return {
      expected: expectedPhonemes,
      transcribed: transcribedPhonemes,
      matches: this.comparePhonemes(expectedPhonemes, transcribedPhonemes),
      accuracy: this.calculatePhonemeAccuracy(expectedPhonemes, transcribedPhonemes)
    };
  }

  getPhonemeMap(languageCode) {
    // Simplified phoneme maps for different languages
    const maps = {
      'en-US': {
        'th': ['θ', 'ð'],
        'sh': ['ʃ'],
        'ch': ['tʃ'],
        'ng': ['ŋ'],
        'r': ['ɹ', 'r']
      },
      'es-ES': {
        'rr': ['r'],
        'ñ': ['ɲ'],
        'll': ['ʎ', 'j']
      },
      'fr-FR': {
        'r': ['ʁ'],
        'u': ['y'],
        'eu': ['ø', 'œ']
      }
    };
    return maps[languageCode] || {};
  }

  wordToPhonemes(word, phonemeMap) {
    // Simplified phoneme conversion
    // In production, use a proper phoneme dictionary
    const phonemes = [];
    for (const [grapheme, phonemeList] of Object.entries(phonemeMap)) {
      if (word.includes(grapheme)) {
        phonemes.push(...phonemeList);
      }
    }
    return phonemes.length > 0 ? phonemes : word.split('').map(c => c);
  }

  comparePhonemes(expected, transcribed) {
    const matches = [];
    const maxLength = Math.max(expected.length, transcribed.length);
    
    for (let i = 0; i < maxLength; i++) {
      const expectedPhoneme = expected[i] || '';
      const transcribedPhoneme = transcribed[i] || '';
      matches.push({
        expected: expectedPhoneme,
        transcribed: transcribedPhoneme,
        match: expectedPhoneme === transcribedPhoneme,
        similarity: this.calculatePhonemeSimilarity(expectedPhoneme, transcribedPhoneme)
      });
    }
    
    return matches;
  }

  calculatePhonemeSimilarity(phoneme1, phoneme2) {
    // Simplified similarity calculation
    if (phoneme1 === phoneme2) return 1.0;
    if (phoneme1.length === 1 && phoneme2.length === 1) {
      // Check if they're similar sounds
      const similarSounds = {
        'θ': ['s', 'f'],
        'ð': ['d', 'z'],
        'ʃ': ['s', 'ch'],
        'tʃ': ['ch', 'ts']
      };
      return similarSounds[phoneme1]?.includes(phoneme2) ? 0.7 : 0.3;
    }
    return 0.0;
  }

  calculatePhonemeAccuracy(expected, transcribed) {
    const matches = this.comparePhonemes(expected, transcribed);
    const totalSimilarity = matches.reduce((sum, match) => sum + match.similarity, 0);
    return totalSimilarity / matches.length;
  }

  identifyPhonemeIssues(phonemeAnalysis) {
    const issues = [];
    phonemeAnalysis.phonemes.matches.forEach((match, index) => {
      if (!match.match && match.similarity < 0.5) {
        issues.push({
          position: index,
          expected: match.expected,
          transcribed: match.transcribed,
          severity: match.similarity < 0.3 ? 'high' : 'medium',
          description: `Expected '${match.expected}' but heard '${match.transcribed}'`
        });
      }
    });
    return issues;
  }

  generatePhonemeTip(word, phonemeAnalysis) {
    const issues = this.identifyPhonemeIssues(phonemeAnalysis);
    if (issues.length === 0) return `Great pronunciation of "${word}"!`;
    
    const mainIssue = issues.find(i => i.severity === 'high') || issues[0];
    return `Focus on the '${mainIssue.expected}' sound in "${word}". Try practicing: "${mainIssue.expected}...${mainIssue.expected}...${word}"`;
  }

  generatePracticeExercise(word, languageCode) {
    const exercises = {
      'en-US': [
        `Repeat "${word}" slowly: ${word.split('').join('...')}`,
        `Practice with similar words containing the same sounds`,
        `Record yourself saying "${word}" and compare with native speakers`
      ],
      'es-ES': [
        `Roll your 'r' in "${word}": rrr...${word}`,
        `Practice the Spanish rhythm: ${word}`,
        `Focus on clear vowel sounds in "${word}"`
      ],
      'fr-FR': [
        `Practice nasal sounds in "${word}"`,
        `Focus on French 'r' sound: ${word}`,
        `Maintain French intonation: ${word}`
      ]
    };
    
    return exercises[languageCode] || exercises['en-US'];
  }

  calculateDifficulty(word, languageCode) {
    // Calculate word difficulty based on length, phonemes, and language-specific challenges
    let difficulty = 0.3; // Base difficulty
    
    // Length factor
    if (word.length > 8) difficulty += 0.2;
    else if (word.length > 5) difficulty += 0.1;
    
    // Language-specific challenges
    const challenges = {
      'en-US': ['th', 'sh', 'ch', 'ng'],
      'es-ES': ['rr', 'ñ', 'll'],
      'fr-FR': ['r', 'u', 'eu', 'an', 'on']
    };
    
    const languageChallenges = challenges[languageCode] || [];
    languageChallenges.forEach(challenge => {
      if (word.includes(challenge)) difficulty += 0.2;
    });
    
    return Math.min(difficulty, 1.0);
  }

  identifyCommonIssues(phonemeLevelFeedback) {
    const issueCounts = {};
    phonemeLevelFeedback.forEach(feedback => {
      feedback.issues.forEach(issue => {
        const key = `${issue.expected}->${issue.transcribed}`;
        issueCounts[key] = (issueCounts[key] || 0) + 1;
      });
    });
    
    return Object.entries(issueCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count }));
  }

  prioritizeImprovementAreas(areasForImprovement) {
    return areasForImprovement
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      })
      .slice(0, 10);
  }

  async pollTranscriptionJob(jobName) {
    // Poll for transcription job completion
    // In production, use SNS notifications instead
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max
    
    while (attempts < maxAttempts) {
      try {
        const result = await this.transcribe.getTranscriptionJob({ 
          TranscriptionJobName: jobName 
        }).promise();
        
        if (result.TranscriptionJob.TranscriptionJobStatus === 'COMPLETED') {
          return result.TranscriptionJob;
        } else if (result.TranscriptionJob.TranscriptionJobStatus === 'FAILED') {
          throw new Error('Transcription job failed');
        }
        
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        attempts++;
      } catch (error) {
        console.error('Error polling transcription job:', error);
        throw error;
      }
    }
    
    throw new Error('Transcription job timeout');
  }
}

module.exports = new SpeechService();
