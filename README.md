# AWS API Gateway with Websockets demo
Demonstration of how to use AWS API gateway to implement a websocket based chat app.  

There are two subdirectories
1. aws - a [CDK](https://aws.amazon.com/cdk/) build for deploying the infrastructure to your own AWS account.  This incorporates
    1. An API Gateway definition specifying how to run the API
    2. A Lambda to process messages received by the API gateway
    3. A DynamoDB table used to store state (who is connected)
1. client - a simple [VUE.js](https://vuejs.org/) that interacts with the API to run a chat application.  Please note that this has a hard wired URL in it.  You'll need to replace this with your own URL when you run it.  In a real world applciation, this would be your API's well known url.


# Limitations
1. This demonstration does not currently include any security on the API, as this is handled in a different components of the demonstration.