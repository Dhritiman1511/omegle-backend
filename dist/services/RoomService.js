"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomService = void 0;
const uuid_1 = require("uuid");
class RoomService {
    constructor() {
        this.rooms = new Map();
    }
    // Create a new room
    createRoom(socketId) {
        const roomid = (0, uuid_1.v4)();
        const newRoom = {
            roomid,
            isAvailable: true,
            p1: { id: socketId },
            p2: { id: null },
        };
        this.rooms.set(roomid, newRoom);
        return newRoom;
    }
    // Find an available room
    findAvailableRoom(socketId) {
        for (const room of this.rooms.values()) {
            if (room.isAvailable &&
                room.p1.id !== socketId &&
                room.p2.id !== socketId) {
                return room;
            }
        }
        return null;
    }
    // Join a room
    joinRoom(roomid, socketId) {
        const room = this.rooms.get(roomid);
        if (room) {
            room.isAvailable = false;
            room.p2.id = socketId;
        }
    }
    // Get room by socket ID
    getRoomBySocketId(socketId) {
        for (const room of this.rooms.values()) {
            if (room.p1.id === socketId || room.p2.id === socketId) {
                return room;
            }
        }
        return null;
    }
    // Inside RoomService class
    getRoomById(roomid) {
        const room = this.rooms.get(roomid);
        if (!room) {
            throw new Error("Room not found");
        }
        return room;
    }
    // Get user type (p1 or p2)
    getType(socketId) {
        for (const room of this.rooms.values()) {
            if (room.p1.id === socketId) {
                return { type: "p1", p2id: room.p2.id };
            }
            else if (room.p2.id === socketId) {
                return { type: "p2", p1id: room.p1.id };
            }
        }
        return false;
    }
    // Handle disconnection
    handleDisconnect(socketId) {
        for (const [roomid, room] of this.rooms.entries()) {
            if (room.p1.id === socketId) {
                if (room.p2.id) {
                    room.isAvailable = true;
                    room.p1.id = room.p2.id;
                    room.p2.id = null;
                }
                else {
                    this.rooms.delete(roomid);
                }
            }
            else if (room.p2.id === socketId) {
                if (room.p1.id) {
                    room.isAvailable = true;
                    room.p2.id = null;
                }
                else {
                    this.rooms.delete(roomid);
                }
            }
        }
    }
}
exports.RoomService = RoomService;
