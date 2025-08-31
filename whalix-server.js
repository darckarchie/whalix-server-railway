// whalix-server.js - VERSION COMPLÈTE CORRIGÉE
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, delay } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const express = require('express');

// Au début de whalix-server.js
const PORT = process.env.PORT || 3000;
const RAILWAY_URL = process.env.RAILWAY_STATIC_URL || 'http://localhost:3000';


// API REST pour l'interface
const app = express();
app.use(express.json());

let sock = null;
let isConnected = false;

async function connectWhatsApp() {
    try {
        console.log('🔄 Initialisation de Whalix...\n');
        
        const { version } = await fetchLatestBaileysVersion();
        const { state, saveCreds } = await useMultiFileAuthState('whalix_session_business');
        
        sock = makeWASocket({
            auth: state,
            version,
            printQRInTerminal: false
        });
        
        sock.ev.on('connection.update', async (update) => {
            const { connection, qr, lastDisconnect } = update;
            
            if(qr) {
                console.log('📱 NOUVEAU QR CODE:\n');
                qrcode.generate(qr, { small: true });
                console.log('\n⏳ Scannez le QR code avec WhatsApp...\n');
            }
            
            if(connection === 'open') {
                isConnected = true;
                console.log('\n✅ WHALIX OPÉRATIONNEL!');
                console.log('📱 Numéro:', sock.user?.id);
                console.log('🌐 API: http://localhost:3000');
                console.log('🔗 N8N: http://localhost:5678');
                console.log('⏳ En attente de messages...\n');
            }
            
            if(connection === 'close') {
                isConnected = false;
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
                
                if(shouldReconnect) {
                    console.log('🔄 Reconnexion dans 5 secondes...');
                    setTimeout(connectWhatsApp, 5000);
                } else {
                    console.log('❌ Déconnexion définitive');
                }
            }
        });
        
        sock.ev.on('creds.update', saveCreds);
        
        // RÉCEPTION MESSAGES
        sock.ev.on('messages.upsert', async (m) => {
            if(!m.messages || m.type !== 'notify') return;
            
            const msg = m.messages[0];
            if (!msg.key.fromMe && msg.message) {
                const from = msg.key.remoteJid;
                const text = msg.message.conversation || 
                           msg.message.extendedTextMessage?.text || '';
                const name = msg.pushName || 'Client';
                
                if(!text) return;
                
                console.log('\n====== NOUVEAU MESSAGE ======');
                console.log('De:', name);
                console.log('Numéro:', from.replace('@s.whatsapp.net', ''));
                console.log('Message:', text);
                console.log('Heure:', new Date().toLocaleTimeString());
                console.log('=============================\n');
                
                // ENVOYER À N8N
                try {
                    console.log('📤 Envoi vers N8N...');
                    
                    const response = await fetch('http://localhost:5678/webhook-test/whalix', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            from: from,
                            message: text,
                            name: name,
                            number: from.replace('@s.whatsapp.net', '')
                        })
                    });
                    
                    const data = await response.json();
                    console.log('📥 Réponse N8N reçue:', JSON.stringify(data));
                    
                    if(data.reply) {
                        // Attendre 1-3 secondes (paraître humain)
                        const delayTime = 1000 + Math.random() * 2000;
                        console.log(`⏳ Attente ${Math.round(delayTime/1000)}s (paraître humain)...`);
                        await delay(delayTime);
                        
                        await sock.sendMessage(from, { text: data.reply });
                        console.log('✅ Réponse envoyée via N8N!');
                        console.log('💬 Réponse:', data.reply.substring(0, 50) + '...\n');
                    }
                } catch(error) {
                    console.error('❌ Erreur N8N:', error.message);
                    
                    // Réponse de secours si N8N ne répond pas
                    await sock.sendMessage(from, { 
                        text: "Désolé, je suis temporairement indisponible. Merci de réessayer dans quelques instants." 
                    });
                }
            }
        });
        
    } catch(error) {
        console.error('❌ Erreur fatale:', error);
        setTimeout(connectWhatsApp, 5000);
    }
}

// API ENDPOINTS
app.get('/status', (req, res) => {
    res.json({
        connected: isConnected,
        number: sock?.user?.id || null,
        timestamp: new Date().toISOString()
    });
});

app.post('/send', async (req, res) => {
    const { to, message } = req.body;
    
    if(!isConnected) {
        return res.status(400).json({ 
            error: 'WhatsApp non connecté',
            connected: false 
        });
    }
    
    try {
        const number = to.includes('@') ? to : `${to}@s.whatsapp.net`;
        await sock.sendMessage(number, { text: message });
        res.json({ 
            success: true,
            to: number,
            message: message 
        });
    } catch(error) {
        res.status(500).json({ 
            error: error.message,
            success: false 
        });
    }
});

// Test endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'Whalix WhatsApp API',
        status: isConnected ? 'Connected' : 'Disconnected',
        endpoints: {
            status: 'GET /status',
            send: 'POST /send'
        }
    });
});

// À la fin, remplace app.listen par :
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Whalix Multi-Sessions démarré`);
    console.log(`📊 Interface: ${RAILWAY_URL}`);
    console.log(`🔌 API: ${RAILWAY_URL}/api\n`);
    
    createDefaultSessions();
});

// Démarrer la connexion WhatsApp
connectWhatsApp();