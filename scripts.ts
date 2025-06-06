import { PrismaClient as SCMClient } from './prisma/clients/scm';
import { PrismaClient as IMClient } from './prisma/clients/im';
import { PrismaClient as IMDevClient } from './prisma/clients/im-dev';

const run = async () => {
  const im = new IMClient();
  const imDev = new IMDevClient();
};

run();
