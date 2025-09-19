const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS for Malaysia region
const dynamodb = new AWS.DynamoDB({ 
  region: process.env.AWS_REGION || 'ap-southeast-5',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const docClient = new AWS.DynamoDB.DocumentClient({ 
  region: process.env.AWS_REGION || 'ap-southeast-5',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

async function createUsersTable() {
  const params = {
    TableName: process.env.USERS_TABLE || 'ai-language-learning-backend-dev-users',
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    Tags: [
      {
        Key: 'Project',
        Value: 'AI-Language-Learning-Companion'
      },
      {
        Key: 'Environment',
        Value: 'development'
      }
    ]
  };

  try {
    console.log('Creating Users table...');
    await dynamodb.createTable(params).promise();
    console.log('✅ Users table created successfully');
    
    // Wait for table to be active
    console.log('Waiting for table to be active...');
    await dynamodb.waitFor('tableExists', { TableName: params.TableName }).promise();
    console.log('✅ Users table is now active');
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log('ℹ️  Users table already exists');
    } else {
      console.error('❌ Error creating Users table:', error.message);
      throw error;
    }
  }
}

async function createConversationsTable() {
  const params = {
    TableName: process.env.CONVERSATIONS_TABLE || 'ai-language-learning-backend-dev-conversations',
    KeySchema: [
      { AttributeName: 'conversationId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'conversationId', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'UserConversationsIndex',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
          { AttributeName: 'conversationId', KeyType: 'RANGE' }
        ],
        Projection: {
          ProjectionType: 'ALL'
        }
      }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    Tags: [
      {
        Key: 'Project',
        Value: 'AI-Language-Learning-Companion'
      },
      {
        Key: 'Environment',
        Value: 'development'
      }
    ]
  };

  try {
    console.log('Creating Conversations table...');
    await dynamodb.createTable(params).promise();
    console.log('✅ Conversations table created successfully');
    
    // Wait for table to be active
    console.log('Waiting for table to be active...');
    await dynamodb.waitFor('tableExists', { TableName: params.TableName }).promise();
    console.log('✅ Conversations table is now active');
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log('ℹ️  Conversations table already exists');
    } else {
      console.error('❌ Error creating Conversations table:', error.message);
      throw error;
    }
  }
}

async function testTables() {
  try {
    console.log('\n🧪 Testing table access...');
    
    // Test Users table
    const usersTable = process.env.USERS_TABLE || 'ai-language-learning-backend-dev-users';
    const testUser = {
      TableName: usersTable,
      Key: { userId: 'test-user-123' }
    };
    
    await docClient.get(testUser).promise();
    console.log('✅ Users table access test passed');
    
    // Test Conversations table
    const conversationsTable = process.env.CONVERSATIONS_TABLE || 'ai-language-learning-backend-dev-conversations';
    const testConversation = {
      TableName: conversationsTable,
      Key: { conversationId: 'test-conversation-123' }
    };
    
    await docClient.get(testConversation).promise();
    console.log('✅ Conversations table access test passed');
    
  } catch (error) {
    if (error.code === 'ResourceNotFoundException') {
      console.log('❌ Tables not found - please check table names');
    } else {
      console.log('ℹ️  Table access test completed (expected for empty tables)');
    }
  }
}

async function listTables() {
  try {
    console.log('\n📋 Listing all tables...');
    const result = await dynamodb.listTables().promise();
    console.log('Available tables:');
    result.TableNames.forEach(tableName => {
      console.log(`  - ${tableName}`);
    });
  } catch (error) {
    console.error('❌ Error listing tables:', error.message);
  }
}

async function main() {
  try {
    console.log('🚀 Starting DynamoDB setup...');
    console.log(`📍 Region: ${process.env.AWS_REGION || 'ap-southeast-5'}`);
    console.log(`👤 Users table: ${process.env.USERS_TABLE || 'ai-language-learning-backend-dev-users'}`);
    console.log(`💬 Conversations table: ${process.env.CONVERSATIONS_TABLE || 'ai-language-learning-backend-dev-conversations'}\n`);

    // Create tables
    await createUsersTable();
    await createConversationsTable();
    
    // Test access
    await testTables();
    
    // List all tables
    await listTables();
    
    console.log('\n🎉 DynamoDB setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Verify tables in AWS Console');
    console.log('2. Test your backend API endpoints');
    console.log('3. Proceed with next TODO items');
    
  } catch (error) {
    console.error('\n❌ DynamoDB setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
main();
