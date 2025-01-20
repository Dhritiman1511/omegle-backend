"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketController = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
class SocketController {
    constructor(roomService, sessionService) {
        this.roomService = roomService;
        this.sessionService = sessionService;
    }
    handleConnection(socket) {
        const { sessionId } = socket.handshake.query;
        if (sessionId) {
            const existingSession = this.sessionService.getSession(sessionId);
            if (existingSession) {
                // Reconnection with existing session
                this.sessionService.updateSession(existingSession.id, { socketId: socket.id });
                socket.emit("session", { sessionId: existingSession.id, exists: true });
                return;
            }
        }
        // Create new session
        const session = this.sessionService.createSession(socket.id);
        socket.emit("session", { sessionId: session.id, exists: false });
    }
    // Handle "start" event
    // Inside SocketController class
    handleStart(socket, io) {
        try {
            const availableRoom = this.roomService.findAvailableRoom(socket.id);
            if (availableRoom) {
                socket.join(availableRoom.roomid);
                this.sessionService.updateSession(socket.id, { roomId: availableRoom.roomid });
                socket.emit("role", "p2");
                this.roomService.joinRoom(availableRoom.roomid, socket.id);
                if (availableRoom.p1.id) {
                    io.to(availableRoom.p1.id).emit("remote-socket", socket.id);
                    socket.emit("remote-socket", availableRoom.p1.id);
                    socket.emit("roomid", availableRoom.roomid);
                }
            }
            else {
                const newRoom = this.roomService.createRoom(socket.id);
                socket.join(newRoom.roomid);
                socket.emit("role", "p1");
                socket.emit("roomid", newRoom.roomid);
            }
        }
        catch (error) {
            logger_1.default.error("Error in handleStart:", error);
            socket.emit("error", "Failed to start session.");
        }
    }
    // Inside SocketController class
    handleMessage(socket, input, type, roomid) {
        const room = this.roomService.getRoomBySocketId(socket.id);
        if (room && room.roomid === roomid) {
            const prefix = type === "p1" ? "You: " : "Stranger: ";
            socket.to(roomid).emit("get-message", input, prefix);
        }
        else {
            socket.emit("error", "You are not in this room.");
        }
    }
    // Handle WebRTC signaling
    handleIceCandidate(socket, io, candidate) {
        const type = this.roomService.getType(socket.id);
        if (type) {
            const targetId = type.type === "p1" ? type.p2id : type.p1id;
            if (targetId) {
                io.to(targetId).emit("ice:reply", { candidate, from: socket.id });
            }
        }
    }
    handleSdp(socket, io, sdp) {
        const type = this.roomService.getType(socket.id);
        if (type) {
            const targetId = type.type === "p1" ? type.p2id : type.p1id;
            if (targetId) {
                io.to(targetId).emit("sdp:reply", { sdp, from: socket.id });
            }
        }
    }
    // Handle disconnection
    handleDisconnect(socket) {
        const session = this.sessionService.getSession(socket.id);
        if (session) {
            if (session.roomId) {
                this.roomService.handleDisconnect(socket.id);
            }
            // Don't remove the session immediately on disconnect to allow for reconnection
            this.sessionService.updateSession(session.id, { socketId: null });
        }
    }
}
exports.SocketController = SocketController;
