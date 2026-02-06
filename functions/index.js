const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.discordEventWebhook = functions.https.onRequest(async (req, res) => {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.status(204).send('');
        return;
    }
    
    // Verify the request - NOW USING process.env
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.WEBHOOK_TOKEN; // CHANGED THIS LINE
    
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    
    try {
        const eventData = req.body;
        
        // Validate required fields
        if (!eventData.hostUsername || !eventData.eventType) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }
        
        // Add to Firestore
        await admin.firestore().collection('events').add({
            hostUsername: eventData.hostUsername,
            hostRank: eventData.hostRank || 'Unknown',
            eventType: eventData.eventType,
            eventSubType: eventData.eventSubType || null,
            mapName: eventData.mapName || null,
            hasFivePlusAttendees: eventData.hasFivePlusAttendees || false,
            loggedBy: eventData.loggedBy || 'Discord Bot',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        
        res.status(200).json({ success: true, message: 'Event logged successfully' });
    } catch (error) {
        console.error('Error logging event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});