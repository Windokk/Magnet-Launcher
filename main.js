const { app, BrowserWindow, ipcMain} = require('electron/main')
const path = require('node:path')
const ipc = ipcMain

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth:940,
    minHeight:560,
    frame:false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools:true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('src/index.html')

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
}

app.whenReady().then(() => {
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