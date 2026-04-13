import { prisma } from '@llmtrap/db';
import { Injectable } from '@nestjs/common';

type LiveFeedFilters = {
  classification?: string;
  nodeId?: string;
  service?: string;
  sourceIp?: string;
};

@Injectable()
export class LiveFeedService {
  async list(filters: LiveFeedFilters) {
    const events = await prisma.capturedRequest.findMany({
      include: {
        session: {
          select: { actorId: true },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
      where: {
        classification: filters.classification,
        nodeId: filters.nodeId,
        service: filters.service,
        sourceIp: filters.sourceIp,
      },
    });

    return events.map((event) => ({
      actorId: event.session?.actorId ?? null,
      classification: event.classification,
      id: event.id,
      method: event.method,
      nodeId: event.nodeId,
      path: event.path,
      responseCode: event.responseCode,
      service: event.service,
      sourceIp: event.sourceIp,
      strategy: event.responseStrategy,
      timestamp: event.timestamp.toISOString(),
      userAgent: event.userAgent,
    }));
  }
}