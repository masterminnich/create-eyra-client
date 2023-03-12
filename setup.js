const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs');

let args = process.argv
let password = args[2]

let envLocalContent = "MONGODB_URI=mongodb+srv://admin:"+password+"@m0cluster.hqusv.mongodb.net/eyra?retryWrites=true&w=majority"
let nextConfigContent = "module.exports = { env: { MONGO_URI: 'mongodb+srv://admin:"+password+"@m0cluster.hqusv.mongodb.net/eyra?retryWrites=true&w=majority' } }"

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

async function installNext() {
    //console.log("Attempting to npm install Next.js...")
    try {
        const { stdout, stderr } = await exec('npm install next --legacy-peer-deps');
        //console.log('stdout:', stdout);
        if (stderr){
            console.log('Error installing Next.js:', stderr)
        } else { 
            console.log("Successfully installed Next.js") 
            writeEnvLocal()
            writeNextConfig()
        }
    } catch (e) { console.error(e); }
}

async function writeEnvLocal(){
    //console.log("Attempting to write .env.local...")
    fs.writeFile('.env.local', envLocalContent, err => {
        if (err) { 
            console.error(err); 
        } else { console.log("Successfully wrote .env.local") }
    });
}



async function writeNextConfig(){
    //console.log("Attempting to write next.config.js...")
    fs.writeFile('next.config.js', nextConfigContent, err => {
        if (err) { 
            console.error(err); 
        } else { 
            console.log("Successfully wrote next.config.js")
            console.log(`Creating optimized build...`);
            const optimizedBuild = runCommand(`npm run build`);
            if(!optimizedBuild) process.exit(-1);
            console.log("")
            console.log("Eyra is ready to go! Type the following command to start up Eyra:")
            console.log("npm run start")
        }
    });
}

installNext()