import { v4 as uuidv4 } from "uuid";
import { Room, GetTypesResult } from "../types/types";

export class RoomService {
  private rooms: Map<string, Room>; // Use a Map for faster lookups

  constructor() {
    this.rooms = new Map();
  }

  // Create a new room
  createRoom(socketId: string): Room {
    const roomid = uuidv4();
    const newRoom: Room = {
      roomid,
      isAvailable: true,
      p1: { id: socketId },
      p2: { id: null },
    };
    this.rooms.set(roomid, newRoom);
    return newRoom;
  }

  // Find an available room
  findAvailableRoom(socketId: string): Room | null {
    for (const room of this.rooms.values()) {
      if (
        room.isAvailable &&
        room.p1.id !== socketId &&
        room.p2.id !== socketId
      ) {
        return room;
      }
    }
    return null;
  }

  // Join a room
  joinRoom(roomid: string, socketId: string): void {
    const room = this.rooms.get(roomid);
    if (room) {
      room.isAvailable = false;
      room.p2.id = socketId;
    }
  }

  // Get room by socket ID
  getRoomBySocketId(socketId: string): Room | null {
    for (const room of this.rooms.values()) {
      if (room.p1.id === socketId || room.p2.id === socketId) {
        return room;
      }
    }
    return null;
  }

  // Inside RoomService class
  getRoomById(roomid: string): Room | null {
    const room = this.rooms.get(roomid);
    if (!room) {
      throw new Error("Room not found");
    }
    return room;
  }

  // Get user type (p1 or p2)
  getType(socketId: string): GetTypesResult {
    for (const room of this.rooms.values()) {
      if (room.p1.id === socketId) {
        return { type: "p1", p2id: room.p2.id };
      } else if (room.p2.id === socketId) {
        return { type: "p2", p1id: room.p1.id };
      }
    }
    return false;
  }

  // Handle disconnection
  handleDisconnect(socketId: string): void {
    for (const [roomid, room] of this.rooms.entries()) {
      if (room.p1.id === socketId) {
        if (room.p2.id) {
          room.isAvailable = true;
          room.p1.id = room.p2.id;
          room.p2.id = null;
        } else {
          this.rooms.delete(roomid);
        }
      } else if (room.p2.id === socketId) {
        if (room.p1.id) {
          room.isAvailable = true;
          room.p2.id = null;
        } else {
          this.rooms.delete(roomid);
        }
      }
    }
  }
}
