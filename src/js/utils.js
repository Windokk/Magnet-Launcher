const fs = require('fs');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function listJarFiles(dirPath) {
    return new Promise((resolve, reject) => {
        fs.readdir(dirPath, (err, files) => {
            if (err) {
                console.error('Unable to scan directory:', err);
                return reject(err);
            }

            const jarFiles = files.filter(file => file.endsWith('.jar'));
            if (jarFiles.length === 0) {
                console.log('No .jar files found.');
            }
            resolve(jarFiles);
        });
    });
}

module.exports = { sleep, listJarFiles};