#!/usr/bin/env node

const {execSync} = require('child_process');

const runCommand = command => {
  try {
    execSync(`${command}`, {stdio: 'inherit'});
  } catch (e) {
    console.error(`Failed to execute ${command}`, e);
    return false;
  }
  return true;
}

let repoName = process.argv[2];
if (String(repoName) == "undefined"){ repoName = "Eyra" }

const gitCheckoutCommand = `git clone --depth 1 https://github.com/masterminnich/create-eyra-client.git ${repoName}`;
const installDepsCommand = `cd ${repoName} && npm install`;

console.log(`Cloning the repository with name ${repoName}`);
const checkedOut = runCommand(gitCheckoutCommand);
if(!checkedOut) process.exit(-1);

console.log(`Installing dependencies for ${repoName}`);
const installedDeps = runCommand(installDepsCommand);
if(!installedDeps) process.exit(-1);

console.log(`Creating optimized build...`);
const optimizedBuild = runCommand(`npm run build`);
if(!optimizedBuild) process.exit(-1);

console.log("Eyra has been installed successfully! Type the following command to connect Eyra to MongoDB Atlas:")
console.log(`cd ${repoName} && node setup.js YOUR_MONGODB_PASSWORD`)