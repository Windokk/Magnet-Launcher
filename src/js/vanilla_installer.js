const https = require('https');
const path = require('path');
const os = require('os');
const { copyFileSync } = require('fs');


function downloadAsset(hash, files_dl_dir) {
  const assetsPath = "/" + hash.substring(0, 2) + "/" + hash;
  url = "https://resources.download.minecraft.net" + assetsPath + hash;
  file = path.join(files_dl_dir, "configs", data.id,"assets", "objects") + assetsPath;
  console.log(url);

}

function downloadLib(){

}

function extractNativeLib(){

}











function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = '';

      console.log(`Status Code: ${response.statusCode}`);
      console.log(`Headers: ${JSON.stringify(response.headers)}`);

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


  
async function fetchVanillaDataFromURL(index, url, files_dl_dir){

    if(684 >= index && index >= 587){


      //If the version is in between  21w38a and 23w17a (has xuid, clientId) (has osname, osversion as jvm attributes)
      data = await fetchJson(url);

      classpath = ``;
      
      asset_index = data.assetIndex.id;

      assetsJsonURL = data.assetIndex.url;

      heap_dump_path = data.arguments.jvm[1].value;

      os_name = data.arguments.jvm[2].value[0];

      os_version = data.arguments.jvm[2].value[1];

      log_config_file = `-Dlog4j.configurationFile=${path.join(files_dl_dir, "/configs/", data.id,"/assets")}\\log_configs\\${data.logging.client.file.id}`

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
        
        classpath = `-cp ${path.join(files_dl_dir, "configs", data.id, "libraries")}\\com\\mojang\\logging\\1.0.0\\logging-1.0.0.jar; `;

        windows_libs_paths.forEach(item =>{
          classpath+= path.join(path.join(files_dl_dir, "configs", data.id, "libraries"), item);
          classpath+= "; "
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
      result = {"asset_index":asset_index,"assetsJsonURL":assetsJsonURL, "heap_dump_path" :heap_dump_path, "os_name":os_name, "os_version":os_version, "log_config_file":log_config_file, "java_options":java_options, "classpath":classpath};
      
      return result;

    }
    else if (index < 587 ){
      // TODO : older version
    }
}

async function installVersion(index, url, files_dl_dir) {
  const versionData = await fetchVanillaDataFromURL(index, url, files_dl_dir);
  /// FIRST WE DL THE ASSETS
  try {
    const data = await fetchJson(versionData.assetsJsonURL);
    Object.keys(data.objects).forEach(key => {
      const hashValue = data.objects[key].hash;
      downloadAsset(hashValue, files_dl_dir);
    });
  } catch (error) {
    console.error(`Failed to process JSON: ${error.message || JSON.stringify(error)}`);
  }
}



module.exports = { installVersion , fetchVanillaData, fetchVanillaDataFromURL};