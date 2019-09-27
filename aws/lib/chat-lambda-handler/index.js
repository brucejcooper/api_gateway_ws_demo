const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.PARTICIPANTS_TABLE;

function addConnectionId(connectionId) {    
    return ddb.put({        
        TableName: TABLE_NAME,        
        Item: {
            connectionId : connectionId        
        },    
    }).promise();
}

function removeConnectionId(connectionId) {    
    console.log(`removing connection ${connectionId}`);
    return ddb.delete({        
        TableName: TABLE_NAME,        
        Key: {            
            connectionId : connectionId,        
        },    
    }).promise();
}

async function getConnections() {    
    const data = await ddb.scan({
        TableName: TABLE_NAME,
        ConsistentRead: true
    }).promise();
    return data.Items;
}

async function send(apigwManagementApi, connectionId, authorId, message) {
    try {
        await apigwManagementApi.postToConnection({ 
            ConnectionId: connectionId, 
            Data: JSON.stringify({type: "message", author: authorId, message:message })
        }).promise();
        console.log(`Successfully sent message to ${connectionId}`);
    } catch (ex) {
        // 410 for "Gone" - was a valid connection Id but it has been disconnected.  400 for "Invalid" - not a real connectionId
        if (ex.statusCode == 410 || ex.statusCode == 400) {
            // The connection is now gone, so we can safely delete it. 
            console.log(`connection ${connectionId} is stale and can not be transmitted to`);
            await removeConnectionId(connectionId);
        } else {
            console.log(`Error sending ${message} to ${connectionId}`, ex);
        }
    }
}

exports.handler = async (event) => {
    const apigwManagementApi = new AWS.ApiGatewayManagementApi({    
        apiVersion: '2018-11-29',    endpoint: event.requestContext.domainName + '/' + event.requestContext.stage  
    });        

    let connectionId = event.requestContext.connectionId;
    console.log("Received event", event);
    console.log(`Its routed to ${event.requestContext.routeKey} on connection ${connectionId}`);

    var return_body = undefined;
    switch (event.requestContext.routeKey) {
        case '$connect':
            await addConnectionId(connectionId);
            break;
        case '$disconnect':
            await removeConnectionId(connectionId);
            break;
        case 'personListReq':
            var connections = await getConnections();
            return_body = JSON.stringify({"type": "participants", "connectionId": connectionId, participants: connections.map((conn) => conn.connectionId)}) ;
            break;
        case '$default':
            let message = event.body;
            var connections = await getConnections();
            await Promise.all(connections.map((conn) => send(apigwManagementApi, conn.connectionId, connectionId, message)));
            break;
    }
    return {
        statusCode: 200,
        body: return_body
    };
};
