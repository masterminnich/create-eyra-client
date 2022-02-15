## Dependencies
 - PACSProbe
 - Node.JS / npm

## How to start the server
 - Install Dependecies + git clone BadgingSystem
 - Create .env.local and next.config.js files (using MongoDB URI) 
 - Whitelist your IP in MongoDB
 - From a command line navigate to the BadgingSystem directory and start the server using "npm run dev".
 - Connect to the server using localhost:3000 or [hostname]:3000
   - Find hostname of the machine you are hosting the server from. (Use "ipconfig" on windows, "iwconfig" on linux)
   - BadgingSystem can run locally and remotely. Moreover, multiple instances can be run simultaneously. 

## Additional Info
This application was developed using [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) template.