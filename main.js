const { app, BrowserWindow, ipcMain} = require('electron/main');
const path = require('node:path');
const ipc = ipcMain;
const { AZURE_CLIENT_ID, MSFT_OPCODE, MSFT_REPLY_TYPE, MSFT_ERROR, SHELL_OPCODE } = require('./src/js/ipcconstants');
const electron = require('electron');
const dialog = electron.dialog;
const fs = require('fs');

let downloadFilesDir = "";


const launcherSettings = path.join(app.getAppPath(), 'launcher-settings');

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth:940,
    minHeight:560,
    frame:false,
    icon:"./icon.ico",
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true,
      contextIsolation: false,
      devTools:true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('src/index.html')

  const fileContent = fs.readFileSync(path.join(app.getAppPath(), 'launcher-settings','launcher.json'), 'utf-8');
  const jsonData = JSON.parse(fileContent);
  win.webContents.send('selected_bg', jsonData.backgrounds[jsonData.background].path);

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

  /* DIR DIALOG */
  
  /// DOWNLOADS DIR

  ipc.on('selectDirectory', async (event, arg) => {
    const result = await dialog.showOpenDialog(win, {
      title:"Select Downloads Directory",
      properties: ['openDirectory']
    })
    downloadFilesDir = result.filePaths[0];
    win.webContents.send('update_download_dir', downloadFilesDir);
  })

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
      const newFilePath = path.join(launcherSettings, fileName);
      fs.copyFile(customBG_absolute, newFilePath, (err) => {
        if (err) {
            console.error('Error copying the file:', err);
            return;
        }

        console.log('File copied successfully:', newFilePath);
      });
      filePath = newFilePath;
    }
    else if(button=="background1") {
      filePath = "./images/background1.jpg";
    }
    else if(button=="background2") {
      filePath = "./images/background2.jpg";
    }
    else if(button=="background3") {
      filePath = "./images/background3.jpg";
    }
    else if(button=="background4") {
      filePath = "./images/background4.jpg";
    }
    else if(button=="background5") {
      filePath = "./images/background5.jpg";
    }
    else if(button=="background6") {
      filePath = "./images/background6.jpg";
    }
    else if(button=="background7") {
      filePath = "./images/background7.jpg";
    }
    relativeFilePath = path.relative(__dirname,filePath);
    relativeFilePath = relativeFilePath.split(path.sep).join('/');
    relativeFilePath = `../${relativeFilePath}`;
    // We add the bg to launcher.json (if it's not already there)
    const fileContent = fs.readFileSync(path.join(app.getAppPath(), 'launcher-settings','launcher.json'), 'utf-8');
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
    fs.writeFileSync(path.join(launcherSettings, 'launcher.json'),updatedJsonString);
    
    win.webContents.send('selected_bg', jsonData.backgrounds[jsonData.background].path);
  })
}

function createSettingsDir(){
  if (!fs.existsSync(launcherSettings)) {
    fs.mkdirSync(launcherSettings, { recursive: true });
  }
}

function createSettingsFile(){
  if (!fs.existsSync(path.join(launcherSettings, 'launcher.json'))) {
    const data = {
      background:0,
      backgrounds : [
          {path:"./images/background1.jpg"},
          {path:"./images/background2.jpg"},
          {path:"./images/background3.jpg"},
          {path:"./images/background4.jpg"},
          {path:"./images/background5.jpg"},
          {path:"./images/background6.jpg"},
          {path:"./images/background7.jpg"}
    ]};
    const jsonData = JSON.stringify(data, null, 2);
  
    fs.writeFileSync(path.join(launcherSettings, 'launcher.json'),jsonData);
  }
}


app.whenReady().then(() => {
  createSettingsDir();
  createSettingsFile();
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


ipc.on('electron_link', () =>{
  require('electron').shell.openExternal("https://www.electronjs.org/")
})

ipc.on('fontawesome_link', () =>{
  require('electron').shell.openExternal("https://fontawesome.com/")
})

ipc.on('mcheads_link', () =>{
  require('electron').shell.openExternal("https://mc-heads.net/")
})

ipc.on('complementary_link', () =>{
  require('electron').shell.openExternal("https://www.complementary.dev/shaders/")
})

if (require('electron-squirrel-startup')) app.quit();



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
        title: LangLoader.queryJS('index.microsoftLoginTitle'),
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