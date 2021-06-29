const s3 = require("../config/s3");

const deleteFile = async (fileName)=>{

    var params = {
        Bucket: process.env.SPACES_BUCKET_NAME,
        Key: fileName
    };

    try{
        await s3.deleteObject(params).promise();
    }catch(e){
        console.log(e);
    }
    

};

module.exports = deleteFile;