
require('dotenv').config();
const {Storage} = require('@google-cloud/storage');
const users = require('./models/users');
const MONGO_URI = process.env.MONGO_URI;
require("mongoose").connect(MONGO_URI,{useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false},(err)=>{
    if(err){console.log(err);}else{console.log("Connected to mongo");}
});

// Main Variables for Google Bucket
const storage = new Storage();
const bucket = storage.bucket(process.env.GOOGLE_BUCKET_NAME);

main = async ()=>{
    var user = await users.find({});
    for(var i in user){
        for(var j in user[i].videos){
            const curVideo = user[i].videos[j];
            console.log(curVideo.fileName);
            const publicURL = await uploadFile(curVideo.fileName);
            var curUser = await users.findById(user[i].id);
            curUser.videos[j].url = publicURL;
            await curUser.save();
        }
    }
};

main();

// const fileName = "BodR0vQs_1618108169480.mp4";

// uploadFile(fileName);
// makePrivate(fileName).catch(console.error);
// makePublic(fileName).catch(console.error);
// deleteFile(fileName).catch(console.error);

async function uploadFile(fileName){
    const options = {
        destination: `${fileName}`,
        resumable: true,
        validation: 'crc32c',
      };

    await bucket.upload(`content\\${fileName}`, options);
    await makePublic(fileName);
    const file = bucket.file(fileName);
    return file.publicUrl();
}

async function makePublic(fileName){
    console.log(`Making ${fileName} public`);
    const file = bucket.file(fileName);
    await file.makePublic();
}

async function makePrivate(fileName){
    console.log(`Making ${fileName} private`);
    const file = bucket.file(fileName);
    var res = await file.makePrivate();
    console.log(res);
}

async function deleteFile(fileName){
    console.log(`Deleting ${fileName}`);
    const file = bucket.file(fileName);
    await file.delete();
}