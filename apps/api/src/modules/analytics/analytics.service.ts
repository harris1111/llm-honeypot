import { prisma } from '@llmtrap/db';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AnalyticsService {
  async getOverview() {
    const [totalNodes, onlineNodes, pendingNodes, totalSessions, totalCaptures, latestCaptures] = await Promise.all([
      prisma.node.count(),
      prisma.node.count({ where: { status: 'ONLINE' } }),
      prisma.node.count({ where: { status: 'PENDING' } }),
      prisma.honeypotSession.count(),
      prisma.capturedRequest.count(),
      prisma.capturedRequest.findMany({
        orderBy: { timestamp: 'desc' },
        select: { service: true },
        take: 50,
      }),
    ]);

    const topServices = Object.entries(
      latestCaptures.reduce<Record<string, number>>((services, capture) => {
        services[capture.service] = (services[capture.service] ?? 0) + 1;
        return services;
      }, {}),
    )
      .map(([service, count]) => ({ count, service }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 5);

    return {
      captures: { total: totalCaptures },
      nodes: {
        online: onlineNodes,
        pending: pendingNodes,
        total: totalNodes,
      },
      sessions: { total: totalSessions },
      topServices,
    };
  }
}