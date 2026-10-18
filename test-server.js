const { execSync } = require('child_process');
console.log('Starting server with tsx...');
try {
  const result = execSync('npx tsx src/server.ts', {
    encoding: 'utf-8',
    timeout: 5000,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  console.log('stdout:', result);
} catch (error) {
  console.log('stderr:', error.stderr);
  console.log('stdout:', error.stdout);
  console.log('error:', error.message);
}
