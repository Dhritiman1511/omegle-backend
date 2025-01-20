import { Server, Socket } from "socket.io";
import { RoomService } from "../services/RoomService";
import { GetTypesResult } from "../types/types";
import logger from '../utils/logger';
import { SessionService } from '../services/SessionService';

export class SocketController {
  private roomService: RoomService;
  private sessionService: SessionService;

  constructor(roomService: RoomService, sessionService: SessionService) {
    this.roomService = roomService;
    this.sessionService = sessionService;
  }

  handleConnection(socket: Socket): void {
    const { sessionId } = socket.handshake.query;
    
    if (sessionId) {
      const existingSession = this.sessionService.getSession(sessionId as string);
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
  handleStart(socket: Socket, io: Server): void {
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
      } else {
        const newRoom = this.roomService.createRoom(socket.id);
        socket.join(newRoom.roomid);
        socket.emit("role", "p1");
        socket.emit("roomid", newRoom.roomid);
      }
    } catch (error) {
      logger.error("Error in handleStart:", error);
      socket.emit("error", "Failed to start session.");
    }
  }

  // Inside SocketController class
  handleMessage(
    socket: Socket,
    input: string,
    type: string,
    roomid: string
  ): void {
    const room = this.roomService.getRoomBySocketId(socket.id);
    if (room && room.roomid === roomid) {
      const prefix = type === "p1" ? "You: " : "Stranger: ";
      socket.to(roomid).emit("get-message", input, prefix);
    } else {
      socket.emit("error", "You are not in this room.");
    }
  }

  // Handle WebRTC signaling
  handleIceCandidate(socket: Socket, io: Server, candidate: any): void {
    const type = this.roomService.getType(socket.id);
    if (type) {
      const targetId = type.type === "p1" ? type.p2id : type.p1id;
      if (targetId) {
        io.to(targetId).emit("ice:reply", { candidate, from: socket.id });
      }
    }
  }

  handleSdp(socket: Socket, io: Server, sdp: any): void {
    const type = this.roomService.getType(socket.id);
    if (type) {
      const targetId = type.type === "p1" ? type.p2id : type.p1id;
      if (targetId) {
        io.to(targetId).emit("sdp:reply", { sdp, from: socket.id });
      }
    }
  }

  // Handle disconnection
  handleDisconnect(socket: Socket): void {
    const session = this.sessionService.getSession(socket.id);
    if (session) {
      if (session.roomId) {
        this.roomService.handleDisconnect(socket.id);
      }
      // Don't remove the session immediately on disconnect to allow for reconnection
      this.sessionService.updateSession(session.id, { socketId: null as null });
    }
  }
}
