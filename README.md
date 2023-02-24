<h1 align="center">Eyra</h1>
<p align="center">An all-in-one credential solution for makerspaces!</p>

## What is Eyra?
Eyra is a web app designed to make it easy for makerspaces to log their members, the credentials members have earned, and to compile useful statistics. It's meant to be easily reconfigurable and adaptable to almost any workplace.  

## Requirements
- Download [Node.js](https://nodejs.org/en/download/)

## Getting Started
1. Clone the repository using npm.  ```git clone ...```
2. Create a [MongoDB account](https://account.mongodb.com/account/register)
3. Create a new [MongoDB "shared" cluster](https://account.mongodb.com/account/register)
4. Whitelist your IP under the "Network Access" tab in MongoDB
5. Download a keyboard wedge compatible with your ID cards. We recommend [PacsProbe](https://pacsprobe.com/free_software_download_for_card_number/)
6. ```node setup.js YOUR_MONGODB_PASSWORD```
7. Start the app with ```npm run dev```

## Usage
- Start the app: ```npm run dev```
- Close the app: ```Ctrl+C```

## Contribute
Eyra is open-source project written and maintained by makerspace directors. Your issues, pull requests and general feedback are welcomed!

## Nice Features
- Can be run locally or remotely.
- Multiple sessions can run concurrently.
- Data is stored on a MongoDB Shared cluster entirely for FREE!