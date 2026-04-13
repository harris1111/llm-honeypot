import type { Socket as DatagramSocket } from 'node:dgram';

import type { ProtocolListenerHandle } from './protocol-server.types';

type StreamServer = {
  close(callback: (error?: Error | null) => void): void;
  listen(port: number, host: string, callback: () => void): void;
  off(event: 'error', listener: (error: Error) => void): void;
  once(event: 'error', listener: (error: Error) => void): void;
};

export async function bindDatagramSocket(name: string, port: number, socket: DatagramSocket): Promise<ProtocolListenerHandle> {
  await new Promise<void>((resolve, reject) => {
    const onError = (error: Error) => {
      socket.off('error', onError);
      reject(error);
    };

    socket.once('error', onError);
    socket.bind(port, '0.0.0.0', () => {
      socket.off('error', onError);
      resolve();
    });
  });

  return {
    async close() {
      await new Promise<void>((resolve) => {
        socket.close(() => resolve());
      });
    },
    name,
  };
}

export async function listenStreamServer(name: string, port: number, server: StreamServer): Promise<ProtocolListenerHandle> {
  await new Promise<void>((resolve, reject) => {
    const onError = (error: Error) => {
      server.off('error', onError);
      reject(error);
    };

    server.once('error', onError);
    server.listen(port, '0.0.0.0', () => {
      server.off('error', onError);
      resolve();
    });
  });

  return {
    async close() {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    },
    name,
  };
}