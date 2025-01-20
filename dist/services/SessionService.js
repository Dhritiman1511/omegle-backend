"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const uuid_1 = require("uuid");
class SessionService {
    constructor() {
        this.SESSION_TIMEOUT = 1000 * 60 * 30; // 30 minutes
        this.sessions = new Map();
        this.startCleanupInterval();
    }
    createSession(socketId) {
        const session = {
            id: (0, uuid_1.v4)(),
            socketId,
            roomId: null,
            lastActive: new Date()
        };
        this.sessions.set(session.id, session);
        return session;
    }
    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastActive = new Date();
            this.sessions.set(sessionId, session);
        }
        return session;
    }
    updateSession(sessionId, updates) {
        const session = this.sessions.get(sessionId);
        if (session) {
            Object.assign(session, updates, { lastActive: new Date() });
            this.sessions.set(sessionId, session);
        }
    }
    removeSession(sessionId) {
        this.sessions.delete(sessionId);
    }
    startCleanupInterval() {
        setInterval(() => {
            const now = new Date();
            for (const [sessionId, session] of this.sessions.entries()) {
                if (now.getTime() - session.lastActive.getTime() > this.SESSION_TIMEOUT) {
                    this.removeSession(sessionId);
                }
            }
        }, 1000 * 60 * 5); // Run cleanup every 5 minutes
    }
}
exports.SessionService = SessionService;
