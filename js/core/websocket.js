// js/core/websocket.js
import { writeFirestoreDocument, initializeFirestore } from "../tools/firestore_writer.js";

export function initializeWebsocket(websocket, tools, firebaseConfig) {
    // ... your existing websocket initialization logic
    const functionSchemas = tools.map(tool => tool.getToolSchema());
    websocket.send(JSON.stringify({ function_call_schema: functionSchemas }));
}


function handleMessage(event, websocket) {
    const data = JSON.parse(event.data);
    if (data.functionCall) {
        // If the API wants to call a function
        const { name, arguments } = data.functionCall;
        if (name === 'writeFirestoreDocument') {
            writeFirestoreDocument(arguments.collectionName, arguments.documentData)
                .then(result => {
                    const function_return = { function_call_result: { name: name, result: result } }
                    websocket.send(JSON.stringify(function_return))
                })
                .catch(error => {
                    // Log the error and potentially report back to the LLM
                    const function_return = { function_call_result: { name: name, error: error.message } }
                    websocket.send(JSON.stringify(function_return))
                })
        } else {
            // Handle other tool functions
            console.log(`Ignoring unknown function ${name}`)
        }

    } else {
        // Normal chatbot response processing
        handleChatbotResponse(data)
    }
}

// Function to be called when message is received
export function setupWebSocketMessageHandler(websocket) {
    websocket.onmessage = (event) => {
        handleMessage(event, websocket)
    }
}
