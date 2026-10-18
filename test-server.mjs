import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

console.log('Starting server with tsx...');
const proc = spawn('npx', ['tsx', 'src/server.ts'], { stdio: 'pipe' });

proc.stdout.on('data', (data) => {
  console.log('stdout:', data.toString());
});

proc.stderr.on('data', (data) => {
  console.log('stderr:', data.toString());
});

proc.on('error', (error) => {
  console.error('process error:', error);
});

proc.on('close', (code) => {
  console.log('process exited with code:', code);
});

await setTimeout(3000);
console.log('killing process');
proc.kill();
