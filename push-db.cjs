const { execSync } = require('child_process');
try {
  const out = execSync('npx prisma db push --accept-data-loss', {
    cwd: __dirname,
    timeout: 120000,
    env: { ...process.env },
    stdio: 'pipe'
  });
  console.log(out.toString());
} catch (e) {
  console.error(e.stderr?.toString() || e.stdout?.toString() || e.message);
}
