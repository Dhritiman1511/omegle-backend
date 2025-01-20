import { v4 as uuidv4 } from 'uuid';

interface Session {
  id: string;
  socketId: string | null;
  roomId: string | null;
  lastActive: Date;
}

export class SessionService {
  private sessions: Map<string, Session>;
  private readonly SESSION_TIMEOUT = 1000 * 60 * 30; // 30 minutes

  constructor() {
    this.sessions = new Map();
    this.startCleanupInterval();
  }

  createSession(socketId: string): Session {
    const session: Session = {
      id: uuidv4(),
      socketId,
      roomId: null,
      lastActive: new Date()
    };
    this.sessions.set(session.id, session);
    return session;
  }

  getSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActive = new Date();
      this.sessions.set(sessionId, session);
    }
    return session;
  }

  updateSession(sessionId: string, updates: Partial<Omit<Session, 'id'>>): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates, { lastActive: new Date() });
      this.sessions.set(sessionId, session);
    }
  }

  removeSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  private startCleanupInterval(): void {
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