const cdk = require('@aws-cdk/core');
const dynamodb = require('@aws-cdk/aws-dynamodb');
// const apigateway = require("@aws-cdk/aws-apigateway");
const lambda = require('@aws-cdk/aws-lambda');
const path = require('path');
const iam = require('@aws-cdk/aws-iam');


function mkRoute(route, api, integration, hasResponse) {
  var resp = {
    type: "AWS::ApiGatewayV2::Route",
    properties: {
      ApiId: { Ref: api.logicalId},
      RouteKey: route,
      Target: { "Fn::Join" : [ "/", ["integrations", { Ref: integration.logicalId }]]},
    }
  };
  if (hasResponse)  {
    resp.properties.RouteResponseSelectionExpression = "$default";
  }
  return resp;
}


class AwsStack extends cdk.Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} propsq
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    // First up, we need a dynamoDB table, in which to store current active members
    const table = new dynamodb.Table(this, 'chat', {
      partitionKey: { name: 'connectionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    });

    
    // Create the lambda handler.
    const handler = new lambda.Function(this, 'ChatHandler', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'chat-lambda-handler')),
      environment: {
        PARTICIPANTS_TABLE: table.tableName
      }
    });

    // Give the lambda permission to access the table, as well as make websocket callbacks.
    table.grantReadWriteData(handler);
    handler.addToRolePolicy(new iam.PolicyStatement({ 
      actions: ["execute-api:*"], 
      resources: ["*"],
    }));
    
    // TODO support Websocket API gateway integration.  For the moment, just use raw CFN
    const api = new cdk.CfnResource(this, 'ChatAPI', {
      type: 'AWS::ApiGatewayV2::Api',
      properties: {
        Name: "ChatAPI",
        ProtocolType: "WEBSOCKET",
        RouteSelectionExpression: "$request.body.action",
      }
    });

    const fnIntegration = new cdk.CfnResource(this, 'FunctionIntegration', {
      type: "AWS::ApiGatewayV2::Integration",
      properties: {
        ApiId: { Ref: api.logicalId },
        ContentHandlingStrategy: "CONVERT_TO_TEXT",
        IntegrationType: "AWS_PROXY",
        IntegrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${handler.functionArn}/invocations`,
      }
    });

    let routeNames = ["$connect", "$disconnect", "$default", "personListReq"];
    let routes = routeNames.map((route, index) => new cdk.CfnResource(this, `Route${index}`, mkRoute(route, api, fnIntegration, index == 3)));

    // The person list has a direct response.
    const responseRoute = new cdk.CfnResource(this, 'PersonListResponseRoute', {
      type: "AWS::ApiGatewayV2::RouteResponse",
      properties: {
        ApiId: { Ref: api.logicalId },
        RouteId: { Ref: routes[3].logicalId },
        RouteResponseKey: "$default"
      }
    });


    // Give the Routes permission to call the lambda
    // TODO this has a reference to the CFN source.  Replace with CFN entry.
    routeNames.forEach((routeName, index) => 
      new cdk.CfnResource(this, `InvokePermission${index}`, {
        type: "AWS::Lambda::Permission",
        properties: {
          Action: "lambda:InvokeFunction",
          FunctionName: handler.functionArn,
          Principal: "apigateway.amazonaws.com",
          SourceArn: { "Fn::Join": [ "", ['arn:aws:execute-api:', this.region, ":", this.account, ":", { Ref: api.logicalId}, `/*/${routeName}`]]}
        }
      })
    );


    const apiDeployment = new cdk.CfnResource(this, 'Deployment', {
      type: "AWS::ApiGatewayV2::Deployment",
      properties: {
        ApiId: { Ref: api.logicalId},
      }
    });
    routes.forEach((route) => apiDeployment.addDependsOn(route));
    apiDeployment.addDependsOn(responseRoute);


    const apiStage = new cdk.CfnResource(this, 'Stage', {
      type: "AWS::ApiGatewayV2::Stage",
      properties: {
        StageName: "devo",
        Description: "Development Stage",
        DeploymentId: { Ref: apiDeployment.logicalId },
        ApiId: { Ref: api.logicalId },
      }
    });
  }
}

module.exports = { AwsStack }
