import { prisma } from '@llmtrap/db';
import { Injectable, NotFoundException } from '@nestjs/common';

type SessionListFilters = {
  classification?: string;
  nodeId?: string;
  service?: string;
};

@Injectable()
export class SessionsService {
  async getOne(sessionId: string) {
    const session = await prisma.honeypotSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const requests = await prisma.capturedRequest.findMany({
      orderBy: { timestamp: 'asc' },
      where: { sessionId },
    });

    return {
      actorId: session.actorId,
      classification: session.classification,
      endedAt: session.endedAt?.toISOString() ?? null,
      id: session.id,
      nodeId: session.nodeId,
      requestCount: session.requestCount,
      requests: requests.map((request) => ({
        classification: request.classification,
        id: request.id,
        method: request.method,
        path: request.path,
        responseCode: request.responseCode,
        service: request.service,
        timestamp: request.timestamp.toISOString(),
      })),
      service: session.service,
      sourceIp: session.sourceIp,
      startedAt: session.startedAt.toISOString(),
      userAgent: session.userAgent,
    };
  }

  async list(filters: SessionListFilters) {
    const sessions = await prisma.honeypotSession.findMany({
      orderBy: { startedAt: 'desc' },
      take: 100,
      where: {
        classification: filters.classification,
        nodeId: filters.nodeId,
        service: filters.service,
      },
    });

    return sessions.map((session) => ({
      actorId: session.actorId,
      classification: session.classification,
      endedAt: session.endedAt?.toISOString() ?? null,
      id: session.id,
      nodeId: session.nodeId,
      requestCount: session.requestCount,
      service: session.service,
      sourceIp: session.sourceIp,
      startedAt: session.startedAt.toISOString(),
      userAgent: session.userAgent,
    }));
  }
}