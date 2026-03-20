import { spawn } from 'child_process';

// Clean the dist directory
console.log('Cleaning dist directory...');
const cleanProcess = spawn('rm', ['-rf', 'dist'], { stdio: 'inherit', shell: true });

cleanProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`Clean process exited with code ${code}`);
    return;
  }
  
  // Create dist directory
  const mkdirProcess = spawn('mkdir', ['-p', 'dist'], { stdio: 'inherit', shell: true });
  
  mkdirProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`Mkdir process exited with code ${code}`);
      return;
    }
    
    // Start build process
    console.log('Starting build process in watch mode...');
    const buildProcess = spawn('node', ['build.mjs', '--dev'], { stdio: 'inherit', shell: true });
    
    // Start web-ext
    console.log('Starting web-ext...');
    const webExtProcess = spawn('bun', ['web-ext', 'run', '--source-dir', '.', '--target', 'chromium', '--start-url', 'https://bet88.ph'], 
      { stdio: 'inherit', shell: true });
    
    // Handle process termination
    process.on('SIGINT', () => {
      console.log('Stopping development server...');
      buildProcess.kill();
      webExtProcess.kill();
      process.exit(0);
    });
    
    console.log('Development server started. Press Ctrl+C to stop.');
  });
});