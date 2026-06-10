const { PrismaClient } = require('./node_modules/@prisma/client');
const p = new PrismaClient();
p.$executeRawUnsafe('SELECT 1')
  .then(r => console.log('OK', r))
  .catch(e => console.error(e.message))
  .finally(() => p.$disconnect());
