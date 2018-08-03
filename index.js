'use strict';
const request = require('request');

const PAGE_ACCESS_TOKEN = 'EAAaugXymlvUBAHVZAhPKgoqGJI2WiP3A7SX1EDxeYUPQ0ZBZCJY0d45hbH0K51MBfyJ8NXWZAVKGxqdX31ENnufW5QK0LWZAgeuZCjBLKkfgejSZAedkrYAXtGmiQODZCQJGpHzczNh67uxQhB6xUCZCwjlWZAHI5bMi8ZCN86zHT2rCgZDZD';
// Imports dependencies and set up http server
const
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {

  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Gets the message. entry.messaging is an array, but 
      // will only ever contain one message, so we get index 0

      console.log('llega mensaje', entry);
      if(entry.messaging !== undefined ) {
        // console.log('llega mensaje', entry.messaging);
        let webhook_event = entry.messaging[0];
        // console.log(webhook_event);
        // Get the sender PSID
        let sender_psid = webhook_event.sender.id;
        // console.log('Sender PSID: ' + sender_psid);

        // Check if the event is a message or postback and
        // pass the event to the appropriate handler function
        if (webhook_event.message) {
          console.log('mensaje normal');
          handleMessage(sender_psid, webhook_event.message);
          
        } else if (webhook_event.postback) {
          console.log('mensaje postback');
          handlePostback(sender_psid, webhook_event.postback);
          
        }
      }
      
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});


// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = "<YOUR_VERIFY_TOKEN>";

  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {

    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {

      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});


// Handles messages events
function handleMessage(sender_psid, received_message) {

  let response;

  // Check if the message contains text
  if (received_message.text) {

    // Create the payload for a basic text message
    response = {
      "text": `You sent the message: "${received_message.text}". Now send me an image!`
    }
  }

  // Sends the response message
  // callSendAPI(sender_psid, response);
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {

  console.log('llega al postback', received_postback);
  let response;

  // Get the payload for the postback
  let payload = received_postback.payload;
  console.log('payload postback', payload);

  // Set the response based on the postback payload
  switch (payload) {
    case 'get_started':
      sendGetStarted(senderID);
      break;

    default:
      // sendTextMessage(senderID, "Postback called");
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);

}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  });
}

function sendGetStarted(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "¿Qué necesitas hacer?",
          buttons:[{
            type: "postback",
            title: "Buscar un producto",
            payload: "search"
          }, {
            type: "postback",
            title: "Publicar un aviso",
            payload: "insert"
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}
