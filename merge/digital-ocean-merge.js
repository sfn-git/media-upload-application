require('dotenv').config({path: '../.env'});
const usersModel = require('../models/users');
const AWS = require('aws-sdk');
const fs = require('fs');

const spacesEndpoint = new AWS.Endpoint('nyc3.digitaloceanspaces.com');

const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: process.env.SPACES_KEY,
    secretAccessKey: process.env.SPACES_SECRET
});

const main = async () =>{
    var users = await usersModel.find({});

    for(var i in users){
        for(var j in users[i].videos){
            var fileName = users[i].videos[j].fileName;
            console.log(fileName);
            var url = await uploadFile(fileName);
            var curUser = await usersModel.findById(users[i].id);
            curUser.videos[j].url = url;
            await curUser.save();
        }
    }

    process.exit();
    // uploadFile("test.mp4");
    // deleteFile("test.mp4");

};

const uploadFile = async (fileName)=>{

    const data = fs.readFileSync(`../content/${fileName}`);
    var params = {
        Bucket: process.env.SPACES_BUCKET_NAME,
        Key: fileName,
        Body: data,
        ACL: "public-read",
        ContentType: "video/mp4"
    };

    await s3.putObject(params).promise();

    const URL = `${process.env.SPACES_EDGE}/${fileName}`;
    console.log(`Link: ${URL}`);
    return URL;

};

const deleteFile = (fileName)=>{

    var params = {
        Bucket: process.env.SPACES_BUCKET_NAME,
        Key: fileName
    };

    s3.deleteObject(params, (err, data)=>{
        if (err) console.log(err, err.stack);
        else console.log(data);
    });

};

main();