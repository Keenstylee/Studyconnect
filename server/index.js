import 'dotenv/config';
import { createServer } from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { pool } from './db.js';
import { asyncHandler } from './utils/asyncHandler.js';
import authRoutes from './routes/auth.routes.js';
import stateRoutes from './routes/state.routes.js';
import groupsRoutes from './routes/groups.routes.js';
import joinRequestsRoutes from './routes/joinRequests.routes.js';
import messagesRoutes from './routes/messages.routes.js';
import profileRoutes from './routes/profile.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: clientOrigin },
});

app.set('io', io);

io.on('connection', (socket) => {
  socket.on('groups:join', (groupIds = []) => {
    for (const groupId of groupIds) {
      if (Number.isInteger(Number(groupId))) socket.join(`group:${groupId}`);
    }
  });
});

app.use(cors({ origin: clientOrigin }));
app.use(express.json());

app.get('/api/health', asyncHandler(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true, database: 'connected' });
}));

app.use('/api/auth', authRoutes);
app.use('/api/state', stateRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/join-requests', joinRequestsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/notifications', notificationsRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({ message: error.publicMessage || error.message || 'Error interno del servidor' });
});

httpServer.listen(port, () => {
  console.log(`StudyConnect API running on http://localhost:${port}`);
});
