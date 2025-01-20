"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
const RoomService_1 = require("./services/RoomService");
const SocketController_1 = require("./controllers/SocketController");
const logger_1 = __importDefault(require("./utils/logger"));
const SessionService_1 = require("./services/SessionService");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const server = app.listen('8000', () => logger_1.default.info('Server listening on http://localhost:8000'));
const io = new socket_io_1.Server(server, { cors: { origin: '*' } });
const roomService = new RoomService_1.RoomService();
const sessionService = new SessionService_1.SessionService();
const socketController = new SocketController_1.SocketController(roomService, sessionService);
io.on('connection', (socket) => {
    logger_1.default.log('New connection:', socket.id);
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
