import { hash } from 'bcryptjs';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

const personas = [
  {
    name: 'Reckless Homelabber',
    preset: 'homelabber',
    identity: {
      hostname: 'homelab-5090',
      kernel: '6.8.0-31-generic',
      os: 'Ubuntu 24.04',
      sshBanner: 'OpenSSH_9.6p1 Ubuntu-3ubuntu13',
      username: 'minh',
    },
    hardware: { cpu: 'AMD Ryzen 9 9950X', diskGb: 4000, gpu: 'NVIDIA RTX 5090', ramGb: 128, vramGb: 24 },
    models: [{ family: 'qwen', name: 'qwen3-coder-30b-heretic', parameterSize: '30B', sizeGb: 18 }],
    services: { gitea: true, homeAssistant: true, ollama: true, plex: true, portainer: true },
    configFiles: { aider: true, claude: true, cursor: true, huggingface: true },
    timing: { gpuUtilizationPct: [8, 34], loadAverage: [0.6, 0.9, 1.1], uptimeDays: [30, 180] },
    credentials: { anthropic: 'sk-ant-fake-homelab-token', openai: 'sk-proj-fake-homelab-token' },
  },
  {
    name: 'Scrappy AI Startup',
    preset: 'startup',
    identity: {
      hostname: 'startup-gpu-01',
      kernel: '6.5.0-1027-aws',
      os: 'Ubuntu 22.04',
      sshBanner: 'OpenSSH_9.3p1 Ubuntu-1ubuntu3.6',
      username: 'deploy',
    },
    hardware: { cpu: 'AMD EPYC 9454P', diskGb: 2000, gpu: '2x NVIDIA A100', ramGb: 256, vramGb: 160 },
    models: [
      { family: 'llama', name: 'llama-3.3-70b', parameterSize: '70B', sizeGb: 46 },
      { family: 'mistral', name: 'mistral-large-2411', parameterSize: '123B', sizeGb: 78 },
    ],
    services: { grafana: true, openai: true, portainer: true, prometheus: true, webhook: true },
    configFiles: { claude: true, continue: true, copilot: true, terraform: true },
    timing: { gpuUtilizationPct: [18, 72], loadAverage: [1.2, 1.4, 1.6], uptimeDays: [7, 30] },
    credentials: { sendgrid: 'SG.fake-startup-token', stripe: 'sk_live_fake_startup_token' },
  },
  {
    name: 'University Researcher',
    preset: 'researcher',
    identity: {
      hostname: 'lab-a6000-02',
      kernel: '5.14.0-427.el9.x86_64',
      os: 'Rocky Linux 9',
      sshBanner: 'OpenSSH_8.7p1 Rocky-9',
      username: 'research',
    },
    hardware: { cpu: 'Intel Xeon Gold 6448Y', diskGb: 6000, gpu: 'NVIDIA A6000', ramGb: 192, vramGb: 48 },
    models: [
      { family: 'deepseek', name: 'deepseek-r1-32b', parameterSize: '32B', sizeGb: 21 },
      { family: 'qwen', name: 'qwen2.5-72b', parameterSize: '72B', sizeGb: 48 },
    ],
    services: { gitea: true, minio: true, ollama: true, rag: true, websocket: true },
    configFiles: { claude: true, codex: true, huggingface: true, streamlit: true },
    timing: { gpuUtilizationPct: [12, 51], loadAverage: [0.8, 1.1, 1.3], uptimeDays: [60, 365] },
    credentials: { huggingface: 'hf_fake_research_token', wandb: 'fake-wandb-api-key' },
  },
] as const;

async function main(): Promise<void> {
  const seedAdminEmail = process.env.SEED_ADMIN_EMAIL?.trim();
  const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD?.trim();

  if (seedAdminEmail && seedAdminPassword) {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: seedAdminEmail },
    });

    if (!existingAdmin) {
      const passwordHash = await hash(seedAdminPassword, 12);

      await prisma.user.create({
        data: { email: seedAdminEmail, passwordHash, role: UserRole.ADMIN },
      });
    }
  }

  for (const persona of personas) {
    await prisma.persona.upsert({
      where: { name: persona.name },
      update: persona,
      create: persona,
    });
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });