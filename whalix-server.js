const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Route de santé (NOUVELLE)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is healthy' });
});

// Route de test
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Whalix Server Running',
        endpoints: {
            health: 'GET /health',
            create: 'POST /api/session/create',
            status: 'GET /api/session/:id/status'
        }
    });
});

// Créer session avec vrai QR
app.post('/api/session/create', (req, res) => {
    const { sessionId, clientName, restaurantId } = req.body;
    
    // Génère une vraie image QR
    const qrData = `WHALIX_${restaurantId || 'TEST'}_${Date.now()}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrData)}`;
    
    res.json({
        sessionId: sessionId || restaurantId || 'test-001',
        clientName: clientName || 'Test Client',
        status: 'qr_pending',
        qrCode: qrImageUrl
    });
});

// Statut session
app.get('/api/session/:sessionId/status', (req, res) => {
    // Simule une connexion après 10 secondes
    const timeElapsed = Date.now() % 10000;
    const isConnected = timeElapsed > 5000;
    
    res.json({
        sessionId: req.params.sessionId,
        status: isConnected ? 'connected' : 'qr_pending',
        connected: isConnected,
        phoneNumber: isConnected ? '+225 07 XX XX XX' : null
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
});
