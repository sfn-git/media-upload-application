const {Storage} = require('@google-cloud/storage');

// Main Variables for Google Bucket
const storage = new Storage();
const bucket = storage.bucket(process.env.GOOGLE_BUCKET_NAME);

async function uploadFile(fileName){
    const options = {
        destination: `${fileName}`,
        resumable: true,
      };

    await bucket.upload(`content/${fileName}`, options);
    const file = bucket.file(fileName);
    await file.makePublic();
    return file.publicUrl();
}

module.exports = uploadFile;