import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import * as fs from 'fs';
import * as path from 'path';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(bodyParser.json());

// Serve static files - check both src/public (dev) and public (production)
const publicDir = fs.existsSync(path.join(__dirname, '../../src/public'))
    ? path.join(__dirname, '../../src/public')
    : path.join(__dirname, '../public');
app.use(express.static(publicDir));
console.log(`Serving static files from: ${publicDir}`);

// Reconciler path - check both .ts (dev) and .js (production)
const RECONCILER_PATH = fs.existsSync(path.join(__dirname, '../operator/reconciler.ts'))
    ? path.join(__dirname, '../operator/reconciler.ts')
    : path.join(__dirname, '../operator/reconciler.js');

app.get('/api/code', (req, res) => {
    try {
        const code = fs.readFileSync(RECONCILER_PATH, 'utf-8');
        res.json({ code });
    } catch (err) {
        res.status(500).json({ error: 'Failed to read code' });
    }
});

app.post('/api/code', (req, res) => {
    const { code } = req.body;
    if (!code) {
        return res.status(400).json({ error: 'Code is required' });
    }
    try {
        fs.writeFileSync(RECONCILER_PATH, code);
        // Trigger reload or just let the operator pick it up on next event
        io.emit('log', 'Code updated successfully');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save code' });
    }
});

// Stream logs (mocking for now, or hooking into console)
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args) => {
    originalConsoleLog(...args);
    io.emit('log', args.map(a => String(a)).join(' '));
};

console.error = (...args) => {
    originalConsoleError(...args);
    io.emit('log', `ERROR: ${args.map(a => String(a)).join(' ')}`);
};

export function startServer() {
    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
