// Load the required libraries
const express = require('express');
const bodyParser = require('body-parser');
const mqtt = require('mqtt');
const app = express();
const port = 3000; // The port the server will run on

// --- 1. CONFIGURATION: UPDATE THESE VALUES ---
// Use a public broker for testing, or your own self-hosted one
const MQTT_BROKER_URL = 'mqtt://broker.hivemq.com'; 
// !!! CRITICAL: Set a unique topic to avoid conflicts with others !!!
const MQTT_TOPIC = '/internet-controlled-car/car/control'; 
// ---------------------------------------------

// Connect to MQTT Broker
const mqttClient = mqtt.connect(MQTT_BROKER_URL);

mqttClient.on('connect', () => {
    console.log('✅ Backend connected to MQTT Broker!');
});

mqttClient.on('error', (err) => {
    console.error('❌ MQTT Connection Error:', err);
});

// Middleware to parse JSON data from the frontend
app.use(bodyParser.json());

// Middleware to handle CORS (allows your website, which is on a different domain, to talk to this server)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); 
    res.header('Access-Control-Allow-Methods', 'POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});


// --- 2. THE API ENDPOINT: POST /api/command ---
// This is the function that receives the command from your website (Frontend)
app.post('/api/command', (req, res) => {
    // req.body contains the JSON data sent from the website: { command: "F", speed: 150 }
    const { command, speed } = req.body; 

    if (!command || speed === undefined) {
        return res.status(400).json({ status: 'error', message: 'Missing command or speed' });
    }

    // Format the message for the ESP32 (e.g., "F,150")
    const message = command; 

    // Publish the message to the MQTT Broker
    mqttClient.publish(MQTT_TOPIC, message, { qos: 0, retain: false }, (err) => {
        if (err) {
            console.error('❌ MQTT Publish Error:', err);
            return res.status(500).json({ status: 'error', message: 'Failed to publish command to car' });
        }
        
        console.log(`➡️ Published: ${message}`);
        // Send a success response back to the Frontend
        res.status(200).json({ status: 'ok', sent: message });
    });
});


// --- 3. START THE SERVER ---
app.listen(port, () => {
    console.log(`🚀 Backend Server Running! Listen on http://localhost:${port}`);
    console.log(`MQTT Topic: ${MQTT_TOPIC}`);

});

