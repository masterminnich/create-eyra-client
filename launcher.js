const { spawn } = require('child_process');
const os = require('os');
const platform = os.platform();
const fs = require('fs');

let serverProcess;

const startServer = () => {
  if (platform === 'win32') {
    serverProcess = spawn('npm.cmd', ['run', 'dev']);
  } else {
    serverProcess = spawn('npm', ['run', 'dev']);
  }

  serverProcess.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(data.toString());
  });

  serverProcess.on('close', (code) => {
    if (code === 0) {
      console.log('Server process exited gracefully.');
    } else {
      console.error(`Server process exited with code ${code}.`);
    }
  });
};

const stopServer = () => {
  if (serverProcess) {
    serverProcess.kill();
  }
};

//Check for newer releases
//Check for package updates

//Check if .env.local file exists
/*fs.stat('.env.local', (err, stats) => {
  if (err) {
    if (err.code === 'ENOENT') {
      console.log('Please enter your MongoDB password by typing');
      console.log('node setup.js YOUR_MONGO_PASSWORD');
      //process.stdin.resume();
      process.exit();
    } else {
      console.log("ERROR")
      console.error('Error checking file:', err);
      //process.stdin.resume();
    }
  } else {
    startServer();
  }
});*/


startServer();

// Handle process termination signals (e.g., CTRL+C or closing the launcher)
process.on('SIGINT', () => {
  console.log('Received SIGINT signal. Stopping server...');
  stopServer();
  process.exit();
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal. Stopping server...');
  stopServer();
  process.exit();
});
