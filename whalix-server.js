// whalix-server.js - Version simple pour Railway
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Route de test
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Whalix Server Running',
        endpoints: {
            create: 'POST /api/session/create',
            status: 'GET /api/session/:id/status'
        }
    });
});

app.post('/api/session/create', (req, res) => {
    const { sessionId, clientName } = req.body;
    
    // Utilise un service gratuit pour générer un QR code de test
    const testText = `Whalix Test ${Date.now()}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(testText)}`;
    
    res.json({
        sessionId: sessionId || 'test-001',
        clientName: clientName || 'Test',
        status: 'qr_pending',
        qrCode: qrImageUrl  // Maintenant c'est une vraie URL d'image
    });
});

// Dans whalix-server.js sur GitHub
app.use(cors({
    origin: '*', // Accepte toutes les origines pour le test
    credentials: true
}));

// Statut session
app.get('/api/session/:sessionId/status', (req, res) => {
    res.json({
        sessionId: req.params.sessionId,
        connected: false,
        qr: null
    });
});

// Démarrer serveur
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
});
