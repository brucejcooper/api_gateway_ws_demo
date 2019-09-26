#!/usr/bin/env node

// @ts-ignore: Cannot find declaration file
require('source-map-support/register');
const cdk = require('@aws-cdk/core');
const { AwsStack } = require('../lib/aws-stack');

const app = new cdk.App();
new AwsStack(app, 'ApiGatewayWebSocketDemo');
