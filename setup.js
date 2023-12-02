const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs');

let args = process.argv
let uri = args[2]
/*let uri_template = args[2]
let password = args[3]

URI_prefix = uri_template.split('<password>')[0]
URI_host = uri_template.split('<password>')[1].split('?')[0] + "eyra?"
URI_options = uri_template.split('<password>')[1].split('?')[1]

let uri = URI_prefix + password + URI_host + URI_options*/

let envLocalContent = "MONGODB_URI="+uri
let nextConfigContent = "module.exports = { env: { MONGO_URI: '" + uri + "' } }"

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
        } else { 
            console.log("")
            console.log("Successfully wrote .env.local") 
        }
    });
}



async function writeNextConfig(){
    //console.log("Attempting to write next.config.js...")
    fs.writeFile('next.config.js', nextConfigContent, err => {
        if (err) { 
            console.error(err); 
        } else { 
            console.log("Successfully wrote next.config.js")
            //console.log(`Creating optimized build...`);
            //const optimizedBuild = runCommand(`npm run build`);
            //if(!optimizedBuild) process.exit(-1);
            console.log("")
            console.log("Eyra is ready to go! Use the launcher or type the following command to start up Eyra:")
            console.log("npm run dev")
        }
    });
}

//installNext()
writeEnvLocal()
writeNextConfig()