const AWS = require('aws-sdk');
require('dotenv').config();

// Configure DynamoDB for Malaysia region
const malaysiaRegion = process.env.REGION || 'ap-southeast-5';

// Configure AWS with explicit credentials
AWS.config.update({
  region: malaysiaRegion,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

class DynamoService {
  constructor() {
    this.dynamodb = new AWS.DynamoDB.DocumentClient({ region: malaysiaRegion });
  }

  async putItem(tableName, item) {
    try {
      const params = {
        TableName: tableName,
        Item: item
      };

      await this.dynamodb.put(params).promise();
      return item;
    } catch (error) {
      console.error('Error putting item to DynamoDB:', error);
      throw error;
    }
  }

  async getItem(tableName, key) {
    try {
      const params = {
        TableName: tableName,
        Key: key
      };

      const result = await this.dynamodb.get(params).promise();
      return result.Item;
    } catch (error) {
      console.error('Error getting item from DynamoDB:', error);
      throw error;
    }
  }

  async updateItem(tableName, key, updateExpression, expressionAttributeValues = {}) {
    try {
      // Convert updateExpression object to DynamoDB format
      const updateExp = Object.keys(updateExpression)
        .map(attr => `${attr} = :${attr.replace('.', '_')}`)
        .join(', ');

      const expressionValues = {};
      Object.keys(updateExpression).forEach(attr => {
        const key = `:${attr.replace('.', '_')}`;
        expressionValues[key] = updateExpression[attr];
      });

      const params = {
        TableName: tableName,
        Key: key,
        UpdateExpression: `SET ${updateExp}`,
        ExpressionAttributeValues: { ...expressionValues, ...expressionAttributeValues },
        ReturnValues: 'ALL_NEW'
      };

      const result = await this.dynamodb.update(params).promise();
      return result.Attributes;
    } catch (error) {
      console.error('Error updating item in DynamoDB:', error);
      throw error;
    }
  }

  async queryByIndex(tableName, indexName, keyName, keyValue, options = {}) {
    try {
      const { limit = 10, offset = 0 } = options;
      
      const params = {
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: `${keyName} = :keyValue`,
        ExpressionAttributeValues: {
          ':keyValue': keyValue
        },
        Limit: limit,
        ScanIndexForward: false // Most recent first
      };

      if (offset > 0) {
        // In production, use proper pagination with LastEvaluatedKey
        params.ExclusiveStartKey = { [keyName]: keyValue, createdAt: offset.toString() };
      }

      const result = await this.dynamodb.query(params).promise();
      return result.Items;
    } catch (error) {
      console.error('Error querying DynamoDB:', error);
      throw error;
    }
  }

  async scan(tableName, filterExpression = null, expressionAttributeValues = {}) {
    try {
      const params = {
        TableName: tableName
      };

      if (filterExpression) {
        params.FilterExpression = filterExpression;
        params.ExpressionAttributeValues = expressionAttributeValues;
      }

      const result = await this.dynamodb.scan(params).promise();
      return result.Items;
    } catch (error) {
      console.error('Error scanning DynamoDB:', error);
      throw error;
    }
  }

  async deleteItem(tableName, key) {
    try {
      const params = {
        TableName: tableName,
        Key: key
      };

      await this.dynamodb.delete(params).promise();
      return true;
    } catch (error) {
      console.error('Error deleting item from DynamoDB:', error);
      throw error;
    }
  }
}

module.exports = new DynamoService();
