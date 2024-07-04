const fs = require('node:fs');
const electron = require('electron');
const { exec } = require('child_process');
const dialog = electron.dialog;
const path = require('path');
const process = require('process')
const { BrowserWindow, ipcMain} = require('electron/main');
const { app, remote } = require('electron')


const ipc = ipcMain;

const { fetchVanillaData, fetchVanillaDataFromURL, installVersion } = require('./src/js/vanilla_installer');

const { AZURE_CLIENT_ID, MSFT_OPCODE, MSFT_REPLY_TYPE, MSFT_ERROR, SHELL_OPCODE } = require('./src/js/ipcconstants');

let downloadFilesDir = app.getPath("appData");

const test_for_dev = path.basename(process.execPath);
let appPath = app.getAppPath();

let appDirectoryPath = "";


if (test_for_dev === 'electron.exe') {
  console.log('Running in development');
  appDirectoryPath = __dirname.replace(/\\/g, '/');

} else {
  console.log('Running as packaged');
  appDirectoryPath = appPath.split("\\").slice(0, -1).join("\\") + "\\";
}

const launcherSettingsDir = path.join(appDirectoryPath, 'launcher-settings');



function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth:940,
    minHeight:560,
    frame:false,
    icon:path.join(path.join(appPath, "build"),"icon.ico"),
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true,
      contextIsolation: false,
      devTools:true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('src/index.html')
  const fileContent = fs.readFileSync(path.join(launcherSettingsDir,'launcher.json'), 'utf-8');
  const jsonData = JSON.parse(fileContent);
  if(jsonData.background < jsonData.backgrounds.length-1 && jsonData.background >= 0){
    win.webContents.send('selected_bg', jsonData.backgrounds[jsonData.background].path);
  }
  if(jsonData.javawPath){
    win.webContents.send('updated_java_exec', jsonData);
  }
  if(jsonData.downloadsDir){
    win.webContents.send('update_download_dir', jsonData.downloadsDir);
  }

  //// MINIMIZE APP
  ipc.on('minimizeApp', ()=>{
    win.minimize()
  })

  //// MAXIMIZE / RESTORE  APP
  ipc.on('maximizeRestoreApp', ()=>{
    if(win.isMaximized()){
      win.restore()
    }
    else{
      win.maximize()
    }

  })

  win.on('maximize', ()=>{
    win.webContents.send('isMaximized')
  })
  
  win.on('unmaximize', ()=>{
    win.webContents.send('isRestored')
  })

  //// CLOSE APP
  ipc.on('closeApp', ()=>{
    win.close()
  })


  /// CONFIGS INTERACTIONS

  ipc.on('getInstalledConfigs', () =>{
    const fileContent = fs.readFileSync(path.join(launcherSettingsDir,'configs.json'), 'utf-8');
    const jsonData = JSON.parse(fileContent);
    win.webContents.send('sentInstalledConfigs', jsonData);
  })

  ipc.on('setSelectedConfig', (event, index) => {
    const fileContent = fs.readFileSync(path.join(launcherSettingsDir,'configs.json'), 'utf-8');
    const jsonData = JSON.parse(fileContent);
    jsonData.current = index;
    const jsonStringified = JSON.stringify(jsonData, null, 2);
    fs.writeFileSync(path.join(launcherSettingsDir, 'configs.json'),jsonStringified);
    win.webContents.send('sentInstalledConfigs', jsonData);
  })

  ipc.on('getAvailableConfigs', () =>{
    fetchVanillaData().then((jsonData) => {
        win.webContents.send('sentAvailableConfigs', jsonData);
      });
  })

  ipc.on('installNewVersion', async (event, index ,loader, type, version, url) =>{
    const fileContent = fs.readFileSync(path.join(launcherSettingsDir,'configs.json'), 'utf-8');
    const jsonData = JSON.parse(fileContent);
    createnewVersion = true;
    jsonData.configs.forEach((item, index) =>{
      if(loader == item.loader && type == item.type && version == item.version && url == item.url){
        createnewVersion = false;
      }
    })
    if(createnewVersion){
      let new_index;
      const manifestData = await fetchVanillaData();
      const arraySize = manifestData.versions.length;
      new_index = arraySize - 1 - index;
      
      jsonData.configs.push({"index_in_manifest_v2":index, "index": new_index, "loader": loader, "type": type, "version": version, "url": url});
      const jsonStringified = JSON.stringify(jsonData, null, 2);
      fs.writeFileSync(path.join(launcherSettingsDir, 'configs.json'),jsonStringified);
      launcherContent = fs.readFileSync(path.join(launcherSettingsDir,'launcher.json'), 'utf-8');
      launcherData = JSON.parse(launcherContent);
      if(684 >= new_index && new_index >= 587){
        await installVersion(new_index, url, launcherData.downloadsDir).then(() => console.log('Version installation complete'))
          .catch(error => console.error('Version installation failed:', error));
      }else{
        console.log("Can't install right now");
      }
    }
    else{
      dialog.showMessageBoxSync(win, {message: "The same exact installation already exists !", type:"warning"});
    }
    
  })

  /* DIALOGS */
  
  /// DOWNLOADS DIR

  ipc.on('selectDownloadsDirectory', async () => {
    const result = await dialog.showOpenDialog(win, {
      title:"Select Downloads Directory",
      properties: ['openDirectory']
    })
    if(result.filePaths[0] != undefined){
      downloadFilesDir = result.filePaths[0];
      win.webContents.send('update_download_dir', downloadFilesDir);
      // We modify launcher.json
      const fileContent = fs.readFileSync(path.join(launcherSettingsDir,'launcher.json'), 'utf-8');
      const jsonData = JSON.parse(fileContent);
      jsonData.downloadsDir = downloadFilesDir.replace(/\\/g, '/');
      fs.writeFileSync(path.join(launcherSettingsDir,'launcher.json'), JSON.stringify(jsonData, null, 2));
    }
    
  })

  // BACKGROUND SELECTION

  ipc.on('select_bg', async (event, button) => {
    createSettingsDir();
    createSettingsFile();
    
    let filePath= "";
    if(button=="custom"){
      const result = await dialog.showOpenDialog(win, 
        {
          title:"Select Custom Launcher Background",
          filters: [
            { name: 'Images', extensions: ['jpg', 'png', 'gif'] },
          ],
          properties: ['openFile']
        })
      customBG_absolute = result.filePaths[0];

      //We copy the custom bg inside this folder
      const fileName = path.basename(customBG_absolute);
      const newFilePath = path.join(launcherSettingsDir, fileName);
      fs.copyFileSync(customBG_absolute, newFilePath);
      filePath = newFilePath;
    }
    else if(button=="background1") {
      filePath = path.join(appPath,"launcher-settings/background1.jpg");
    }
    else if(button=="background2") {
      filePath = path.join(appPath,"launcher-settings/background2.jpg");
    }
    else if(button=="background3") {
      filePath = path.join(appPath,"launcher-settings/background3.jpg");
    }
    else if(button=="background4") {
      filePath = path.join(appPath,"launcher-settings/background4.jpg");
    }
    else if(button=="background5") {
      filePath = path.join(appPath,"launcher-settings/background5.jpg");
    }
    else if(button=="background6") {
      filePath = path.join(appPath,"launcher-settings/background6.jpg");
    }
    else if(button=="background7") {
      filePath = path.join(appPath,"launcher-settings/background7.jpg");
    }
    relativeFilePath = path.relative(path.join(appPath, "src"),filePath);
    relativeFilePath = relativeFilePath.split(path.sep).join('/');
    // We add the bg to launcher.json (if it's not already there)
    const fileContent = fs.readFileSync(path.join(launcherSettingsDir,'launcher.json'), 'utf-8');
    const jsonData = JSON.parse(fileContent);
    fileAlreadyInJson = -1;
    for (var i = 0; i < jsonData.backgrounds.length; i++){
      if(jsonData.backgrounds[i].path == relativeFilePath){
        fileAlreadyInJson = i;
      }
    }
    if(fileAlreadyInJson == -1){
      jsonData.backgrounds.push({"path": relativeFilePath});
      jsonData.background = jsonData.backgrounds.length-1;
    }
    else{
      jsonData.background = fileAlreadyInJson;
    }
    let updatedJsonString = JSON.stringify(jsonData);
    fs.writeFileSync(path.join(launcherSettingsDir, 'launcher.json'),updatedJsonString);
    
    if(jsonData.background < jsonData.backgrounds.length-1 && jsonData.background >= 0){
      win.webContents.send('selected_bg', jsonData.backgrounds[jsonData.background].path);
    }
  })

  // JAVA SELECTION

  ipc.on('selectJavaw', async () =>{
    const result = await dialog.showOpenDialog(win, {
      title:"Select Javaw",
      properties: ['openFile'],
      filters:[{ name: 'Java executable', extensions: ['exe'] }]
    })

    if (!result.canceled) {
      const selectedFile = result.filePaths[0];
      const path = require('path');

      // Check if the selected file's path ends with "bin/javaw.exe"
      const expectedSuffix = path.join('bin', 'javaw.exe').replace(/\\/g, '/'); // Use forward slashes for consistency
      const normalizedFilePath = selectedFile.replace(/\\/g, '/'); // Normalize the file path to use forward slashes

      if (!normalizedFilePath.endsWith(expectedSuffix)) {
          // Show an error message
          await dialog.showMessageBox(win, {
            type: 'error',
            title: 'Invalid File',
            message: 'Please select the correct Java executable (bin/javaw.exe).'
          });
      }else{
        const fileContent = fs.readFileSync(path.join(launcherSettingsDir,'launcher.json'), 'utf-8');
        const jsonData = JSON.parse(fileContent);
        jsonData.javawPath = selectedFile.replace(/\\/g, '/');
        fs.writeFileSync(path.join(launcherSettingsDir,'launcher.json'), JSON.stringify(jsonData, null, 2));
        win.webContents.send('updated_java_exec', jsonData);
      }
  }

  })





  ipc.on('play', (event, args) =>{
    
    play(args);
  })

}

function createSettingsDir(){
  if (!fs.existsSync(launcherSettingsDir)) {
    fs.mkdirSync(launcherSettingsDir, { recursive: true });
  }
}

function createSettingsFile(){
  if (!fs.existsSync(path.join(launcherSettingsDir, 'launcher.json'))) {
    
    const data = {
      background:0,
      backgrounds : [
          {path:"../launcher-settings/background1.jpg"},
          {path:"../launcher-settings/background2.jpg"},
          {path:"../launcher-settings/background3.jpg"},
          {path:"../launcher-settings/background4.jpg"},
          {path:"../launcher-settings/background5.jpg"},
          {path:"../launcher-settings/background6.jpg"},
          {path:"../launcher-settings/background7.jpg"}
        ],
      downloadsDir: path.join(downloadFilesDir, "/.magnet-launcher").replace(/\\/g, '/'),
      javawPath: path.join(app.getPath("appData"), "AppData/Local/Packages/Microsoft.4297127D64EC6_8wekyb3d8bbwe/LocalCache/Local/runtime/java-runtime-beta/windows-x64/java-runtime-beta/bin/javaw.exe").replace(/\\/g, '/')
    };
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(path.join(launcherSettingsDir, 'launcher.json'),jsonData);
  }
}

function createConfigsFile(){
  if (!fs.existsSync(path.join(launcherSettingsDir, 'configs.json'))) {
    const data = {
      "current": -1,
      "configs":[
          
      ]
    };
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(path.join(launcherSettingsDir, 'configs.json'),jsonData);
  }
}

ipc.on('electron_link', () =>{
  require('electron').shell.openExternal("https://www.electronjs.org/")
});

ipc.on('fontawesome_link', () =>{
  require('electron').shell.openExternal("https://fontawesome.com/")
});

ipc.on('mcheads_link', () =>{
  require('electron').shell.openExternal("https://mc-heads.net/")
});

ipc.on('complementary_link', () =>{
  require('electron').shell.openExternal("https://www.complementary.dev/shaders/")
});

ipc.on('icons8_link', () =>{
  require('electron').shell.openExternal("https://icons8.com/icons/")
});

ipc.on('reportIssue', () =>{
  require('electron').shell.openExternal("https://github.com/Windokk/Magnet-Launcher/issues");
});

ipc.on('discord_link', () =>{
  require('electron').shell.openExternal("https://discord.gg/qSXk8qA6Nw");
});

const REDIRECT_URI_PREFIX = 'https://login.microsoftonline.com/common/oauth2/nativeclient?'

// Microsoft Auth Login
let msftAuthWindow
let msftAuthSuccess
let msftAuthViewSuccess
let msftAuthViewOnClose
ipc.on(MSFT_OPCODE.OPEN_LOGIN, (ipcEvent, ...arguments_) => {
    if (msftAuthWindow) {
        ipcEvent.reply(MSFT_OPCODE.REPLY_LOGIN, MSFT_REPLY_TYPE.ERROR, MSFT_ERROR.ALREADY_OPEN, msftAuthViewOnClose)
        return
    }
    msftAuthSuccess = false
    msftAuthViewSuccess = arguments_[0]
    msftAuthViewOnClose = arguments_[1]
    msftAuthWindow = new BrowserWindow({
        title: "MicrosoftAuth",
        backgroundColor: '#222222',
        width: 520,
        height: 600,
        frame: true,
    })

    msftAuthWindow.on('closed', () => {
        msftAuthWindow = undefined
    })

    msftAuthWindow.on('close', () => {
        if(!msftAuthSuccess) {
            ipcEvent.reply(MSFT_OPCODE.REPLY_LOGIN, MSFT_REPLY_TYPE.ERROR, MSFT_ERROR.NOT_FINISHED, msftAuthViewOnClose)
        }
    })

    msftAuthWindow.webContents.on('did-navigate', (_, uri) => {
        if (uri.startsWith(REDIRECT_URI_PREFIX)) {
            let queries = uri.substring(REDIRECT_URI_PREFIX.length).split('#', 1).toString().split('&')
            let queryMap = {}

            queries.forEach(query => {
                const [name, value] = query.split('=')
                queryMap[name] = decodeURI(value)
            })

            ipcEvent.reply(MSFT_OPCODE.REPLY_LOGIN, MSFT_REPLY_TYPE.SUCCESS, queryMap, msftAuthViewSuccess)

            msftAuthSuccess = true
            msftAuthWindow.close()
            msftAuthWindow = null
        }
    })

    msftAuthWindow.removeMenu()
    msftAuthWindow.loadURL(`https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?prompt=select_account&client_id=${AZURE_CLIENT_ID}&response_type=code&scope=XboxLive.signin%20offline_access&redirect_uri=https://login.microsoftonline.com/common/oauth2/nativeclient`)
})


app.whenReady().then(() => {
  createSettingsDir();
  createSettingsFile();
  createConfigsFile();
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})





async function play(JVM_ARGS){
  let command = "";

  const launcherfileContent = fs.readFileSync(path.join(launcherSettingsDir,'launcher.json'), 'utf-8');
  const launcherjsonData = JSON.parse(launcherfileContent);
  const configsfileContent = fs.readFileSync(path.join(launcherSettingsDir,'configs.json'), 'utf-8');
  const configsjsonData = JSON.parse(configsfileContent);

  const versionFilejsonData = await fetchVanillaDataFromURL(configsjsonData.configs[configsjsonData.current].index, configsjsonData.configs[configsjsonData.current].url, launcherjsonData.downloadsDir);

  //User's data : 
  const accessToken = "";
  const username = "";
  const UUID = "";
  const clientID = "";
  const XUID = "";


  JAVA_EXEC = launcherjsonData.javawPath;
  HEAP_DUMP_PATH = versionFilejsonData.heap_dump_path;
  OS_NAME = `"${versionFilejsonData.os_name}"`;
  OS_VERSION = versionFilejsonData.os_version;
  JAVA_OPTIONS = versionFilejsonData.java_options;
  CLASSPATH =  versionFilejsonData.classpath;
  GAME_ARGS = `net.minecraft.client.main.Main --username ${username} --version ${configsjsonData.configs[configsjsonData.current].version} --gameDir ${launcherjsonData.downloadsDir} --assetsDir ${path.join(launcherjsonData.downloadsDir, "/configs/", configsjsonData.configs[configsjsonData.current].version,"/assets")} --assetIndex ${versionFilejsonData.asset_index} --uuid ${UUID} --accessToken ${accessToken} --clientId ${clientID} --xuid ${XUID} --userType msa --versionType ${configsjsonData.configs[configsjsonData.current].type}`;

  command = `${JAVA_EXEC} ${HEAP_DUMP_PATH} ${OS_NAME} ${OS_VERSION} ${JAVA_OPTIONS} ${CLASSPATH} ${JVM_ARGS} ${GAME_ARGS}`


  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
}