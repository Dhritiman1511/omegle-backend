import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { RoomService } from './services/RoomService';
import { SocketController } from './controllers/SocketController';
import logger from './utils/logger';
import { SessionService } from './services/SessionService';

const app = express();
app.use(cors());
const server = app.listen('8000', () => logger.info('Server listening on http://localhost:8000'));
const io = new Server(server, { cors: { origin: '*' } });

const roomService = new RoomService();
const sessionService = new SessionService();
const socketController = new SocketController(roomService,sessionService);

io.on('connection', (socket) => {
  logger.log('New connection:', socket.id);

  socket.on('start', () => {
    socketController.handleStart(socket, io);
  });

  socket.on('ice:send', ({ candidate }) => {
    socketController.handleIceCandidate(socket, io, candidate);
  });

  socket.on('sdp:send', ({ sdp }) => {
    socketController.handleSdp(socket, io, sdp);
  });

  socket.on('send-message', (input, type, roomid) => {
    socketController.handleMessage(socket, input, type, roomid);
  });

  socket.on('disconnect', () => {
    socketController.handleDisconnect(socket);
  });
});