import { Inject, Injectable, Logger } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import type { NodeRuntimeConfig } from '../config/node-runtime-config';
import { NODE_RUNTIME_CONFIG } from '../config/node-runtime-config';
import { ProtocolCaptureService } from '../capture/protocol-capture.service';
import { RuntimeStateService } from '../runtime/runtime-state.service';
import { buildHomelabServiceDefinitions } from './homelab/homelab-service-definitions';
import { createProtocolPersonaSnapshot } from './protocol-persona-snapshot';
import { startHttpProtocolServer } from './http-protocol-server';
import type { ProtocolListenerHandle } from './protocol-server.types';
import { buildRagServiceDefinitions } from './rag/rag-service-definitions';
import { startDnsServer } from './traditional/dns-server';
import { startFtpServer } from './traditional/ftp-server';
import { startSmbServer } from './traditional/smb-server';
import { startSmtpServer } from './traditional/smtp-server';
import { startSshServer } from './traditional/ssh-server';
import { startTelnetServer } from './traditional/telnet-server';

@Injectable()
export class ProtocolServerManagerService implements OnModuleDestroy, OnModuleInit {
  private readonly handles: ProtocolListenerHandle[] = [];
  private readonly logger = new Logger(ProtocolServerManagerService.name);

  constructor(
    @Inject(NODE_RUNTIME_CONFIG) private readonly config: NodeRuntimeConfig,
    private readonly protocolCaptureService: ProtocolCaptureService,
    private readonly runtimeStateService: RuntimeStateService,
  ) {}

  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled(this.handles.map((handle) => handle.close()));
  }

  async onModuleInit(): Promise<void> {
    const snapshotFactory = () => createProtocolPersonaSnapshot(this.runtimeStateService);
    const httpServices = [
      ...buildRagServiceDefinitions(this.config, snapshotFactory),
      ...buildHomelabServiceDefinitions(this.config, snapshotFactory),
    ];

    this.handles.push(...(await Promise.all(httpServices.map((definition) => startHttpProtocolServer(definition, this.protocolCaptureService)))));
    this.handles.push(await startSshServer(this.config.traditionalPorts.ssh, this.protocolCaptureService, snapshotFactory));
    this.handles.push(await startFtpServer(this.config.traditionalPorts.ftp, this.protocolCaptureService, snapshotFactory));
    this.handles.push(await startSmtpServer('smtp', this.config.traditionalPorts.smtp, this.protocolCaptureService, snapshotFactory));
    this.handles.push(await startSmtpServer('smtp-submission', this.config.traditionalPorts.smtpSubmission, this.protocolCaptureService, snapshotFactory));
    this.handles.push(await startDnsServer(this.config.traditionalPorts.dns, this.protocolCaptureService, snapshotFactory));
    this.handles.push(await startSmbServer(this.config.traditionalPorts.smb, this.protocolCaptureService));
    this.handles.push(await startTelnetServer(this.config.traditionalPorts.telnet, this.protocolCaptureService, snapshotFactory));

    for (const handle of this.handles) {
      this.logger.log(`Phase 4 listener online: ${handle.name}`);
    }
  }
}