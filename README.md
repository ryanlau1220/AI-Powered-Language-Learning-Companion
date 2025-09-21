# AI-Powered Language Learning Companion

Complete AI-powered language learning platform with real-time conversation, pronunciation feedback, multi-language support (English/Chinese), and adaptive learning using AWS AI services.

## Commands
```bash
# Setup
cp env.example .env
npm install
cd backend; npm install
cd ../frontend; npm install

# AWS Services Setup
npm run setup-db    # Create DynamoDB tables
npm run setup-lex   # Set up Lex bot

# Development
npm run dev         # Start both frontend (localhost:5173) and backend (localhost:3000)
npm run backend     # Backend API only
npm run frontend    # React app only

# Testing
npm run test                    # Run all tests
npm run test-integration        # Test all services
npm run test-user              # Test user management
npm run test-conversation      # Test conversation features
npm run test-speech            # Test speech processing
npm run test-adaptive          # Test adaptive learning
npm run test-roleplay          # Test role-playing scenarios

# Deployment
npm run deploy                 # Deploy complete system
cd backend; npm run deploy  # Backend only
cd frontend; npm run build  # Frontend build
aws s3 sync dist/ s3://your-bucket-name --delete  # Deploy frontend to S3
```

## User Interface
- **Main App**: http://localhost:3001 (Frontend)
- **API Health**: http://localhost:3000/health
- **Language Detection API**: http://localhost:3000/api/language/detect
- **Translation API**: http://localhost:3000/api/language/translate

## Tech Stack
- **Backend**: Node.js, Express.js, Serverless Framework
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Database**: In-memory storage (Map-based)
- **AI Services**: Amazon Bedrock, Comprehend, Translate, Transcribe, Polly
- **Cloud**: AWS Lambda, API Gateway, S3
- **Authentication**: Anonymous access
- **Multi-language**: AWS Comprehend (language detection), AWS Translate (translation)
- **Deployment**: Serverless Framework
- **Package Manager**: npm

## Project Structure
```
├── backend/                   # Serverless backend
│   ├── src/
│   │   ├── handlers/         # API route handlers
│   │   │   ├── conversation.js  # Conversation management
│   │   │   ├── language.js      # Language detection & translation
│   │   │   ├── reading.js       # Text Explorer Lab features
│   │   │   ├── speech.js        # Speech processing
│   │   │   └── writing.js       # Writing practice
│   │   ├── services/         # AI service integrations
│   │   │   ├── bedrockService.js      # Amazon Bedrock AI
│   │   │   ├── languageDetectionService.js  # Language detection
│   │   │   ├── translationService.js        # Translation services
│   │   │   ├── conversationService.js       # Conversation management
│   │   │   ├── readingService.js            # Reading content generation
│   │   │   ├── speechService.js             # Speech processing
│   │   │   └── userService.js               # User management
│   │   ├── middleware/       # Express middleware
│   │   │   ├── auth.js           # Authentication
│   │   │   ├── errorHandler.js   # Error handling
│   │   │   ├── requestLogger.js  # Request logging
│   │   │   └── validation.js     # Input validation
│   │   └── index.js          # Main server file
│   └── serverless.yml        # Serverless configuration
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── AITutorRoom.tsx        # Main learning interface
│   │   │   ├── ConversationInterface.tsx  # Chat interface
│   │   │   ├── LanguageIndicator.tsx      # Language detection UI
│   │   │   ├── LanguageSwitcher.tsx       # Language selection
│   │   │   ├── Layout.tsx                 # Main layout
│   │   │   ├── ReadingMode.tsx            # Text Explorer Lab
│   │   │   └── SpeakingMode.tsx           # Voice Mastry Hub
│   │   ├── pages/            # Page components
│   │   │   ├── HomePage.tsx           # Landing page
│   │   │   └── ConversationPage.tsx   # Conversation practice
│   │   ├── contexts/         # React contexts
│   │   │   └── LanguageContext.tsx    # Language management
│   │   ├── services/         # API services
│   │   │   ├── api.ts                # API client
│   │   │   └── translationService.ts # Frontend translation
│   │   ├── locales/          # Translation files
│   │   │   ├── en.json               # English translations
│   │   │   └── zh.json               # Chinese translations
│   │   └── index.css         # Global styles
│   └── vite.config.ts        # Vite configuration
├── scripts/                   # Utility scripts
│   ├── setup-dynamodb.js     # Database setup
│   ├── setup-lex-bot.js      # Lex bot setup
│   ├── deploy-to-aws.js      # Deployment script
│   └── test-audio.mp3        # Test audio file
├── env.example               # Environment template
└── TODO.md                   # Project roadmap and features
```

## Features

### Core Learning Features
- **AI Tutor Room**: Comprehensive learning interface with multiple practice modes
- **Real-time Conversations**: AI-powered chat with Amazon Bedrock
- **Speech Processing**: Voice input/output with Transcribe and Polly
- **Text Explorer Lab**: AI-generated content with analysis, quizzes, and flashcards
- **Voice Mastry Hub**: Pronunciation feedback and speaking challenges
- **Writing Practice**: Grammar correction and style analysis with Bedrock
- **Interactive Learning**: Flashcards, quizzes, and comprehension questions

### Multi-Language Support
- **Language Detection**: Automatic language detection using AWS Comprehend
- **UI Translation**: Dynamic UI language switching (English/Chinese)
- **Cultural Context**: AI responses adapted to Western/Chinese cultural contexts
- **Bilingual AI**: AI responds in the same language as user input
- **Translation Services**: Real-time text translation using AWS Translate
- **Language Consistency**: Maintains language context throughout conversations

### AI-Powered Features
- **Conversational AI**: Natural language understanding and generation with Bedrock
- **Speech Recognition**: Real-time audio transcription with confidence scoring
- **Text-to-Speech**: Multiple voice options and languages
- **Intelligent Feedback**: Contextual corrections and suggestions
- **Content Generation**: AI-generated reading passages, quizzes, and flashcards
- **Pronunciation Analysis**: Detailed feedback on speaking performance
- **Language-Aware Responses**: AI responses match user's input language

## AWS Services Used

### Core AI Services
- **Amazon Bedrock**: Advanced AI models for conversations, grammar correction, and content generation
- **Amazon Comprehend**: Language detection and sentiment analysis
- **Amazon Translate**: Text translation between English and Chinese
- **Amazon Transcribe**: Speech-to-text conversion with confidence scoring
- **Amazon Polly**: Text-to-speech synthesis with multiple voices

### Infrastructure Services
- **AWS Lambda**: Serverless compute for API endpoints
- **Amazon API Gateway**: RESTful API management and routing
- **Amazon S3**: File storage for audio files and generated content
- **AWS CloudWatch**: Monitoring and logging
- **In-Memory Storage**: Map-based storage for conversations

### Security & Management
- **AWS IAM**: Identity and access management
- **AWS Secrets Manager**: Secure credential storage
- **AWS CloudFormation**: Infrastructure as code

## System Flow

### Application Flow
```mermaid
flowchart TD
    A[User Access] --> B[Language Detection & Selection]
    B --> C[AI Tutor Room]
    C --> D{Choose Learning Mode}
    
    D -->|Conversation| E[AI Chat with Bedrock]
    D -->|Voice Mastry Hub| F[Audio Recording & Analysis]
    D -->|Text Explorer Lab| G[Content Generation & Analysis]
    D -->|Writing Practice| H[Grammar & Style Analysis]
    
    E --> I[Language-Aware Response]
    F --> J[Pronunciation Feedback]
    G --> K[Quizzes & Flashcards]
    H --> L[Writing Corrections]
    
    I --> M[Progress Tracking]
    J --> M
    K --> M
    L --> M
    
    M --> N[Language Context Update]
    N --> O[Next Practice Recommendation]
    O --> C
    
    subgraph "Multi-Language Features"
        P[Language Detection] --> Q[UI Translation]
        Q --> R[Cultural Context]
        R --> S[Consistent Language Response]
    end
    
    B --> P
    I --> S
```

### AWS Services Flow
```mermaid
flowchart TD
    A[Frontend Request] --> B[Express.js API]
    B --> C[Route Handler]
    
    C --> D{Request Type}
    D -->|Conversation| E[Amazon Bedrock]
    D -->|Language Detection| F[Amazon Comprehend]
    D -->|Translation| G[Amazon Translate]
    D -->|Speech| H[Amazon Transcribe]
    D -->|TTS| I[Amazon Polly]
    D -->|Data| J[In-Memory Storage]
    
    E --> K[Response Processing]
    F --> K
    G --> K
    H --> K
    I --> K
    J --> K
    
    K --> L[API Response]
    L --> M[Frontend Update]
    
    %% Multi-language processing
    F --> N[Language Context Update]
    G --> N
    N --> O[Cultural Context Adaptation]
    O --> E
    
    subgraph "AWS AI Services"
        E
        F
        G
        H
        I
    end
    
    subgraph "Multi-Language Processing"
        N
        O
    end
    
    subgraph "Express.js Server"
        B
        C
        J
    end
```
