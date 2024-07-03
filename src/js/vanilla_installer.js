const https = require('https');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');
const magnet_utils = require('./utils');
const util = require('util')

async function downloadAsset(hash, version,files_dl_dir) {
  const assetsPath = hash.substring(0, 2);
  url = "https://resources.download.minecraft.net" + "/" + assetsPath + "/" + hash;
  filePath = path.join(files_dl_dir, "configs", version,"assets", "objects",assetsPath);
  
  
  if(!fs.existsSync(path.join(filePath, hash))){

    if (!fs.existsSync(filePath)){
      fs.mkdirSync(filePath, { recursive: true });
    }
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(path.join(filePath, hash), Buffer.from(buffer));
  
      
    } catch (error) {
      console.error('Download failed:', error, "filePath :", path.join(filePath,hash));
    }
  }
  
}

async function downloadLib(version, url, files_dl_dir) {
  const filePath = url.split('/').pop();
  const dirPath = url.replace("https://libraries.minecraft.net/", "").replace(filePath, "");
  const fullDirPath = path.join(files_dl_dir, "configs", version, "libraries", dirPath);

  if (!fs.existsSync(path.join(fullDirPath, filePath))) {
    if (!fs.existsSync(fullDirPath)) {
      fs.mkdirSync(fullDirPath, { recursive: true });
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const buffer = await response.arrayBuffer();


      fs.writeFileSync(path.join(fullDirPath, filePath), Buffer.from(buffer));

    } catch (error) {
      console.error('Download failed:', error, "filePath :", path.join(fullDirPath, filePath));
    }
  }
}

async function downloadNativeLib(version, url, files_dl_dir){
  const filePath = url.split('/').pop();
  const dirPath = path.join(files_dl_dir, "configs", version, "bin");

  if (!fs.existsSync(path.join(dirPath, filePath))) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const buffer = await response.arrayBuffer();


      fs.writeFileSync(path.join(dirPath, filePath), Buffer.from(buffer));

    } catch (error) {
      console.error('Download failed:', error, "filePath :", path.join(dirPath, filePath));
    }
  }

}

const execPromise = util.promisify(exec);

async function extractNativeLib(filePath) {
  if (fs.existsSync(filePath)) {
    const command = `jar xf ${filePath}`;
    const options = { cwd: filePath.replace(path.basename(filePath), '') };

    try {
      await execPromise(command, options);
      console.log(`Extraction complete for ${path.basename(filePath)}.`);
    } catch (error) {
      console.error(`Error extracting JAR file ${path.basename(filePath)}: ${error.message}`);
      throw error; // Rethrow the error to propagate it upwards
    }
  }
}

async function downloadAllNatives(versionid, natives, files_dl_dir) {
  return new Promise((resolve, reject) => {
      let completed = 0;
      natives.forEach(async (lib, index, array) => {
          await downloadNativeLib(versionid, lib, files_dl_dir);
          completed++;
          if (completed === array.length) {
              resolve();
          }
      });
  });
}

async function extractAllNatives(binDirPath, files) {
  try {
    const extractionPromises = files.map(item => {
      return extractNativeLib(path.join(binDirPath, item));
    });

    await Promise.all(extractionPromises);
    
    console.log('All extractions completed.');
  } catch (error) {
    console.error('Error during extraction process:', error);
    // Handle overall extraction error as needed
  }
}

async function deleteAllNatives(binDirPath, files) {
  return new Promise((resolve, reject) => {
      let completed = 0;
      files.forEach((item, index, array) => {
          const filePath = path.join(binDirPath, item);
          if (fs.existsSync(filePath)) {
              fs.rmSync(filePath);
          }
          completed++;
          if (completed === array.length) {
              resolve();
          }
      });
  });
}




function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = '';

      // Handle response chunk
      response.on('data', (chunk) => {
        data += chunk;
      });

      // Handle end of response
      response.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (error) {
          reject(new Error(`Error parsing JSON: ${error.message}`));
        }
      });

    }).on('error', (error) => {
      reject(new Error(`Request error: ${error.message || JSON.stringify(error)}`));
    });
  });
}

async function fetchVanillaData() {
    return fetchJson('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
}


function getWindowsSimpleDownloadsPaths(simpleDownloads){
  resultPaths = [];
  simpleDownloads.forEach(item =>{
    if(item.rules){
      if(item.rules[0].action === "allow"){
        if(!item.rules[0].os){
          if(item.rules[1]){
            if(item.rules[1].action === "disallow" && item.rules[1].os){
              if(item.rules[1].os.name === "osx"){
                resultPaths.push(item.downloads.artifact.path);
              }
            }
          }
        }
      }
    }else{
      resultPaths.push(item.downloads.artifact.path);
    }
  })
  return resultPaths;
}

function getWindowsComplexDownloadPaths(complexDownloads){
  resultPaths = [];
  complexDownloads.forEach(item =>{
    if(item.natives.windows){
      resultPaths.push(item.downloads.classifiers["natives-windows"].path);
    }
  })
  return resultPaths;
}
  
async function fetchVanillaDataFromURL(index, url, files_dl_dir){

    if(index > 684){
      const data = await fetchJson(url);


    }

    if(684 >= index && index >= 587){

      //If the version is in between 21w38a and 23w17a (has xuid, clientId) (has osname, osversion as jvm attributes)
      const data = await fetchJson(url);

      classpath = ``;

      libraries = [];

      natives = [];
      
      clientURL = data.downloads.client.url;
      
      asset_index = data['assetIndex'].id;
      
      assetsJsonURL = data.assetIndex.url;

      heap_dump_path = data.arguments.jvm[1].value;

      os_name = data.arguments.jvm[2].value[0];

      os_version = data.arguments.jvm[2].value[1];

      log_config_file = `-Dlog4j.configurationFile=${path.join(files_dl_dir, "/configs/", data.id,"/assets")}\\log_configs\\${data.logging.client.file.id}`

      log_config_file_url = data.logging.client.file.url;

      // TODO : MODIFY JAVA_OPTIONS DEPENDING ON OS
      java_options = `${data.arguments.jvm[3].value} -Djava.library.path=${path.join(files_dl_dir, "/configs/", data.id,"/bin")} -Dminecraft.launcher.brand=magnet-launcher -Dminecraft.launcher.version=0.0.1`;


      let simpleDownloads = [];
      let complexDownloads = [];

      data.libraries.forEach(item => {
        if (!item.downloads.classifiers) {
          // It's a simple download
          simpleDownloads.push(item);
        } else {
          // It's a complex download
          complexDownloads.push(item);
        }
      });

      if (os.platform() === 'win32') {
        //Running on Windows

        windows_libs_paths = getWindowsSimpleDownloadsPaths(simpleDownloads);
        windows_native_paths = getWindowsComplexDownloadPaths(complexDownloads);
        

        classpath = `-cp ${path.join(files_dl_dir, "configs", data.id, "libraries")}\\com\\mojang\\logging\\1.0.0\\logging-1.0.0.jar;`;

        windows_libs_paths.forEach(item =>{
          classpath+= path.join(files_dl_dir, "configs", data.id, "libraries", item);
          classpath+= ";"
          url = (`https://libraries.minecraft.net/${item}`).replace(/\\/g, '/');
          libraries.push(url);
        })
        classpath += path.join(files_dl_dir, "versions", data.id, `${data.id}.jar`);

        

        windows_native_paths.forEach(item =>{
          url = (`https://libraries.minecraft.net/${item}`).replace(/\\/g, '/');
          natives.push(url);
        })
      }
      else if(os.platform() === 'darwin'){
        //Running on macOS
      }
      else if(os.platform() === 'linux'){}
      else{
        // Magnet is not available on an os other than win32, macos or linux
        return;
      }
      result = {"id":data.id ,"asset_index":asset_index,"assetsJsonURL":assetsJsonURL, "heap_dump_path" :heap_dump_path, "os_name":os_name, "os_version":os_version, "log_config_file":log_config_file, "java_options":java_options, "classpath":classpath, "libraries": libraries, "clientURL":clientURL, "natives":natives, "log_config_file_url":log_config_file_url};
      
      return result;

    }
    else if (index < 587 ){
      // TODO : older version
    }
}

async function installVersion(index, url, files_dl_dir) {
  const versionData = await fetchVanillaDataFromURL(index, url, files_dl_dir);
  try {
    

    // FIRST WE DOWNLOAD THE ASSETS
    const data = await fetchJson(versionData.assetsJsonURL);

    for (const key in data.objects) {
      if (data.objects.hasOwnProperty(key)) {
        // Await the downloadAsset promise to ensure it completes
        await downloadAsset(data.objects[key].hash, versionData.id, files_dl_dir);
      }
    }

    if (!fs.existsSync(path.join(files_dl_dir, "configs", versionData.id, "assets", "indexes", `${versionData.asset_index}.json`))) {
      if (!fs.existsSync(path.join(files_dl_dir, "configs", versionData.id, "assets", "indexes"))) {
        fs.mkdirSync(path.join(files_dl_dir, "configs", versionData.id, "assets", "indexes"), { recursive: true });
      }
  
      try {
        const response = await fetch(versionData.assetsJsonURL);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const buffer = await response.arrayBuffer();
  
  
        fs.writeFileSync(path.join(files_dl_dir, "configs", versionData.id, "assets", "indexes", `${versionData.asset_index}.json`), Buffer.from(buffer));
  
      } catch (error) {
        console.error('Download failed:', error, "filePath :", path.join(files_dl_dir, "configs", versionData.id, "assets", "indexes", `${versionData.asset_index}.json`));
      }
    }

    // THEN WE DOWNLOAD THE LIBRARIES

    //BASIC LIBS
    versionData.libraries.forEach(async lib =>{
      await downloadLib(versionData.id, lib, files_dl_dir);
    })

    // NATIVES LIBS
    versionData.natives.forEach(async lib =>{
      await downloadLib(versionData.id, lib, files_dl_dir);
    })

    //WE DOWNLOAD THE CLIENT
    const clientPath = path.join(files_dl_dir, "versions", versionData.id);
    const clientUrl = versionData.clientURL;

    if (!fs.existsSync(path.join(clientPath, `${versionData.id}.jar`))) {
      if (!fs.existsSync(clientPath)) {
        fs.mkdirSync(clientPath, { recursive: true });
      }
  
      try {
        const response = await fetch(clientUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const buffer = await response.arrayBuffer();
  
  
        fs.writeFileSync(path.join(clientPath, `${versionData.id}.jar`), Buffer.from(buffer));
  
      } catch (error) {
        console.error('Download failed:', error, "filePath :", path.join(clientPath, `${versionData.id}.jar`));
      }
    }

    // THEN WE DOWNLOAD THE NATIVES

    await downloadAllNatives(versionData.id, versionData.natives, files_dl_dir);

    // THEN WE EXTRACT THE NATIVES
    const binDirPath = path.join(files_dl_dir, "configs", versionData.id, "bin");
    const files_before_extraction = await magnet_utils.listJarFiles(binDirPath);
    await extractAllNatives(binDirPath, files_before_extraction);
    const files_after_extraction = await magnet_utils.listJarFiles(binDirPath);
    await deleteAllNatives(binDirPath, files_after_extraction);
    
    // WE DOWNLOAD LOG CONFIG FILES
  
    const log_config_file_url = versionData.log_config_file_url;
    const log_config_file = versionData.log_config_file_url.split("/").pop();
    const log_config_file_path = path.join(files_dl_dir, "configs", versionData.id, "assets", "log_configs");

    if(!fs.existsSync(log_config_file_path)){
      fs.mkdirSync(log_config_file_path, { recursive: true });
      if(!fs.existsSync(path.join(log_config_file_path, log_config_file))){
        try {
          const response = await fetch(log_config_file_url);
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          const buffer = await response.arrayBuffer();
    
    
          fs.writeFileSync(path.join(log_config_file_path, log_config_file), Buffer.from(buffer));
    
        } catch (error) {
          console.error('Download failed:', error, "filePath :", path.join(log_config_file_path, log_config_file));
        }
      }
    }

  } catch (error) {
    console.error(`Error installing version ${versionData.id} :`, error);
  }
  
  //THEN WE DOWNLOAD THE LIBRARIES
}



module.exports = { installVersion , fetchVanillaData, fetchVanillaDataFromURL};