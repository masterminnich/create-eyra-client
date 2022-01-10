## Dependencies
 - XAMPP
 - PACSProbe
 - Node.JS / npm

## How to start the server
 - Install Dependecies + git clone BadgingSystem
 - Configure XAMPP to point towards BadgingSystem
   - In XAMPP, under Apache click "config" and open https.conf, now change DocumentRoot to point to the path of BadgingSystem
   - Alternatively, you can move BadgingSystem into C:\xampp\htdocs
 - Create .env.local file (MongoDB URI)
 - Find hostname of the machine you are hosting the server from. (Use "ipconfig" on windows, "iwconfig" on linux)
 - "npm run dev" from BadgingSystem to start the server
 - Connect to the server using localhost:3000 or [hostname]:3000

## Additional Info
This application was developed using [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) template.
