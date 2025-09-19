const serverlessExpress = require('@codegenie/serverless-express');
const app = require('./index');

// Create the serverless Express app
const serverlessApp = serverlessExpress({ app });

// Lambda handler
exports.handler = async (event, context) => {
  return serverlessApp(event, context);
};
