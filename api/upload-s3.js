const s3 = require("../config/s3");
const fs = require('fs');

const uploadFile = async (filePath, fileName, fileExt)=>{
    var fileExist = fs.existsSync(filePath);
    do{
        fileExist = fs.existsSync(filePath);
    }while(!fileExist);

    const data = fs.readFileSync(filePath);
    var params = {
        Bucket: process.env.SPACES_BUCKET_NAME,
        Key: fileName,
        Body: data,
        ACL: "public-read"
    };

    if(fileExt == ".jpg"){
        params.ContentType = "image/jpg";
    }else if(fileExt == ".png"){
        params.ContentType = "image/png";
    }else if(fileExt == ".mp4"){
        params.ContentType = "video/mp4";
    }

    await s3.putObject(params).promise();

    fs.unlinkSync(filePath);

    const URL = `${process.env.SPACES_EDGE}/${fileName}`;
    console.log(`Link: ${URL}`);
    return URL;

};

module.exports = uploadFile;