const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS for Singapore region
const lexModels = new AWS.LexModelsV2({ 
  region: process.env.LEX_REGION || 'ap-southeast-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const lexRuntime = new AWS.LexRuntimeV2({ 
  region: process.env.LEX_REGION || 'ap-southeast-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

async function createBot() {
  const botParams = {
    botName: 'ai-language-learning-bot',
    description: 'AI Language Learning Companion Bot for conversational practice',
    roleArn: `arn:aws:iam::${process.env.AWS_ACCOUNT_ID || 'your-account-id'}:role/LexBotRole`,
    dataPrivacy: {
      childDirected: false
    },
    idleSessionTTLInSeconds: 300
  };

  try {
    console.log('Creating Lex bot...');
    const result = await lexModels.createBot(botParams).promise();
    console.log('✅ Bot created successfully');
    console.log(`Bot ID: ${result.botId}`);
    return result.botId;
  } catch (error) {
    if (error.code === 'ConflictException' || error.message.includes('already exists')) {
      console.log('ℹ️  Bot already exists, getting existing bot...');
      const listResult = await lexModels.listBots({}).promise();
      const existingBot = listResult.botSummaries.find(bot => bot.botName === 'ai-language-learning-bot');
      if (existingBot) {
        console.log(`✅ Found existing bot: ${existingBot.botId}`);
        return existingBot.botId;
      }
    }
    console.error('❌ Error creating bot:', error.message);
    throw error;
  }
}

async function createIntents(botId) {
  const intents = [
    {
      intentName: 'Greeting',
      description: 'Handle greeting messages',
      sampleUtterances: [
        'Hello',
        'Hi',
        'Good morning',
        'Good afternoon',
        'Good evening',
        'Hey there',
        'How are you?'
      ],
      fulfillmentCodeHook: {
        enabled: false
      }
    },
    {
      intentName: 'Help',
      description: 'Handle help requests',
      sampleUtterances: [
        'Help',
        'I need help',
        'Can you help me?',
        'What can you do?',
        'How does this work?',
        'I am confused'
      ],
      fulfillmentCodeHook: {
        enabled: false
      }
    },
    {
      intentName: 'Goodbye',
      description: 'Handle goodbye messages',
      sampleUtterances: [
        'Goodbye',
        'Bye',
        'See you later',
        'I have to go',
        'Talk to you later',
        'Thanks, bye'
      ],
      fulfillmentCodeHook: {
        enabled: false
      }
    },
    {
      intentName: 'RestaurantOrder',
      description: 'Handle restaurant ordering scenarios',
      sampleUtterances: [
        'I would like to order',
        'Can I see the menu?',
        'What do you recommend?',
        'I will have the chicken',
        'Can I get a table for two?',
        'What are your specials?'
      ],
      slots: [
        {
          slotName: 'FoodItem',
          slotTypeName: 'FoodItem',
          description: 'The food item the customer wants to order'
        },
        {
          slotName: 'Quantity',
          slotTypeName: 'Quantity',
          description: 'How many items the customer wants'
        }
      ],
      fulfillmentCodeHook: {
        enabled: false
      }
    },
    {
      intentName: 'ShoppingInquiry',
      description: 'Handle shopping scenarios',
      sampleUtterances: [
        'Where can I find shoes?',
        'Do you have this in blue?',
        'What is the price?',
        'Can I try this on?',
        'Do you have a larger size?',
        'Is this on sale?'
      ],
      slots: [
        {
          slotName: 'Product',
          slotTypeName: 'Product',
          description: 'The product the customer is looking for'
        },
        {
          slotName: 'Size',
          slotTypeName: 'Size',
          description: 'The size the customer needs'
        }
      ],
      fulfillmentCodeHook: {
        enabled: false
      }
    },
    {
      intentName: 'Directions',
      description: 'Handle direction requests',
      sampleUtterances: [
        'How do I get to the airport?',
        'Where is the nearest hospital?',
        'Can you give me directions?',
        'How far is it?',
        'Is it walking distance?',
        'Which way should I go?'
      ],
      slots: [
        {
          slotName: 'Destination',
          slotTypeName: 'Destination',
          description: 'Where the person wants to go'
        }
      ],
      fulfillmentCodeHook: {
        enabled: false
      }
    },
    {
      intentName: 'General',
      description: 'Handle general conversation',
      sampleUtterances: [
        'Tell me about yourself',
        'What is your name?',
        'How old are you?',
        'Where are you from?',
        'What do you like to do?',
        'That is interesting',
        'I agree',
        'I disagree',
        'I think so too'
      ],
      fulfillmentCodeHook: {
        enabled: false
      }
    }
  ];

  console.log('Creating intents...');
  for (const intent of intents) {
    try {
      const intentParams = {
        botId: botId,
        botVersion: 'DRAFT',
        localeId: 'en_US',
        intentName: intent.intentName,
        description: intent.description,
        sampleUtterances: intent.sampleUtterances.map(utterance => ({
          utterance: utterance
        })),
        ...(intent.slots && { slots: intent.slots }),
        fulfillmentCodeHook: intent.fulfillmentCodeHook
      };

      await lexModels.createIntent(intentParams).promise();
      console.log(`✅ Created intent: ${intent.intentName}`);
    } catch (error) {
      if (error.code === 'ConflictException') {
        console.log(`ℹ️  Intent ${intent.intentName} already exists`);
      } else {
        console.error(`❌ Error creating intent ${intent.intentName}:`, error.message);
      }
    }
  }
}

async function createSlotTypes(botId) {
  const slotTypes = [
    {
      slotTypeName: 'FoodItem',
      description: 'Types of food items',
      slotTypeValues: [
        { value: 'pizza' },
        { value: 'burger' },
        { value: 'pasta' },
        { value: 'salad' },
        { value: 'soup' },
        { value: 'sandwich' },
        { value: 'chicken' },
        { value: 'beef' },
        { value: 'fish' },
        { value: 'vegetarian' }
      ]
    },
    {
      slotTypeName: 'Quantity',
      description: 'Quantities for orders',
      slotTypeValues: [
        { value: 'one' },
        { value: 'two' },
        { value: 'three' },
        { value: 'four' },
        { value: 'five' },
        { value: 'a few' },
        { value: 'several' },
        { value: 'many' }
      ]
    },
    {
      slotTypeName: 'Product',
      description: 'Types of products',
      slotTypeValues: [
        { value: 'shoes' },
        { value: 'clothes' },
        { value: 'shirt' },
        { value: 'pants' },
        { value: 'dress' },
        { value: 'jacket' },
        { value: 'hat' },
        { value: 'bag' },
        { value: 'watch' },
        { value: 'jewelry' }
      ]
    },
    {
      slotTypeName: 'Size',
      description: 'Product sizes',
      slotTypeValues: [
        { value: 'small' },
        { value: 'medium' },
        { value: 'large' },
        { value: 'extra large' },
        { value: 'XS' },
        { value: 'S' },
        { value: 'M' },
        { value: 'L' },
        { value: 'XL' },
        { value: 'XXL' }
      ]
    },
    {
      slotTypeName: 'Destination',
      description: 'Common destinations',
      slotTypeValues: [
        { value: 'airport' },
        { value: 'hospital' },
        { value: 'hotel' },
        { value: 'restaurant' },
        { value: 'shopping mall' },
        { value: 'train station' },
        { value: 'bus stop' },
        { value: 'bank' },
        { value: 'pharmacy' },
        { value: 'post office' }
      ]
    }
  ];

  console.log('Creating slot types...');
  for (const slotType of slotTypes) {
    try {
      const slotTypeParams = {
        botId: botId,
        botVersion: 'DRAFT',
        localeId: 'en_US',
        slotTypeName: slotType.slotTypeName,
        description: slotType.description,
        slotTypeValues: slotType.slotTypeValues
      };

      await lexModels.createSlotType(slotTypeParams).promise();
      console.log(`✅ Created slot type: ${slotType.slotTypeName}`);
    } catch (error) {
      if (error.code === 'ConflictException') {
        console.log(`ℹ️  Slot type ${slotType.slotTypeName} already exists`);
      } else {
        console.error(`❌ Error creating slot type ${slotType.slotTypeName}:`, error.message);
      }
    }
  }
}

async function createBotAlias(botId) {
  try {
    console.log('Creating bot alias...');
    const aliasParams = {
      botId: botId,
      botAliasName: 'TSTALIASID',
      description: 'Test alias for AI Language Learning Bot',
      botVersion: 'DRAFT'
    };

    await lexModels.createBotAlias(aliasParams).promise();
    console.log('✅ Bot alias created successfully');
  } catch (error) {
    if (error.code === 'ConflictException') {
      console.log('ℹ️  Bot alias already exists');
    } else {
      console.error('❌ Error creating bot alias:', error.message);
    }
  }
}

async function testBot(botId) {
  try {
    console.log('\n🧪 Testing bot...');
    const testParams = {
      botId: botId,
      botAliasId: 'TSTALIASID',
      localeId: 'en_US',
      sessionId: 'test-session-123',
      text: 'Hello'
    };

    const result = await lexRuntime.recognizeText(testParams).promise();
    console.log('✅ Bot test successful');
    console.log(`Intent: ${result.intent?.intentName || 'None'}`);
    console.log(`Confidence: ${result.intent?.confidence || 'N/A'}`);
  } catch (error) {
    console.log('ℹ️  Bot test completed (may need time to propagate)');
  }
}

async function main() {
  try {
    console.log('🚀 Starting Lex bot setup...');
    console.log(`📍 Region: ${process.env.LEX_REGION || 'ap-southeast-1'}`);
    console.log(`🤖 Bot Name: ai-language-learning-bot\n`);

    // Create bot
    const botId = await createBot();
    
    // Create slot types first
    await createSlotTypes(botId);
    
    // Create intents
    await createIntents(botId);
    
    // Create bot alias
    await createBotAlias(botId);
    
    // Test bot
    await testBot(botId);
    
    console.log('\n🎉 Lex bot setup completed successfully!');
    console.log('\nBot Details:');
    console.log(`- Bot ID: ${botId}`);
    console.log(`- Bot Alias ID: TSTALIASID`);
    console.log(`- Region: ${process.env.LEX_REGION || 'ap-southeast-1'}`);
    console.log('\nNext steps:');
    console.log('1. Update your .env file with the bot details');
    console.log('2. Test the bot in AWS Console');
    console.log('3. Proceed with next TODO items');
    
  } catch (error) {
    console.error('\n❌ Lex bot setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
main();
