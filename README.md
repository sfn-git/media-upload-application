# media-upload-application

A NodeJS application that allows users to upload pictures and videos to then be served by another static webserver such as nginx or apache. 
UI uses bootstrap, file upload uses ajax and formidable.
Still a wip. 

## How to use
1. Clone repo
`git clone https://github.com/sfn-git/media-upload-application.git`
2. Install packages
`npm i`
3. Create .env file and add values to the following feilds
```
SITE_URL="your domain name or http://localhost:<portnum>"
PORT="port number, application will default to 3000"
MONGO_URI="URI of your mongodb connection"
```
4. Create a 'content' folder in the same directory of app.js
`mkdir content`
5. To start development server `npm dev`. To start node server `npm start`
