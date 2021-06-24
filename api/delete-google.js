const {Storage} = require('@google-cloud/storage');

// Main Variables for Google Bucket
const storage = new Storage();
const bucket = storage.bucket(process.env.GOOGLE_BUCKET_NAME);

async function deleteFile(fileName){
    console.log(`Deleting ${fileName}`);
    const file = bucket.file(fileName);
    await file.delete();
}

module.exports = deleteFile;