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

// Créer session (version simple)
app.post('/api/session/create', (req, res) => {
    const { sessionId, clientName } = req.body;
    
    // Pour l'instant, on retourne juste un QR de test
    res.json({
        sessionId,
        clientName,
        status: {
            connected: false,
            qr: 'TEST_QR_CODE_' + Date.now()
        }
    });
});

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
