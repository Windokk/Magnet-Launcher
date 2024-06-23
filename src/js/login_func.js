const { ipcRenderer } = require('electron')
const maxResBtn = document.getElementById('maxResBtn')
const ipc = ipcRenderer
const loginMicrosoft = document.getElementById('login_ms')
const {MSFT_OPCODE} = require('./ipcconstants')

/* MINIMIZE APP */
minimizeBtn.addEventListener('click', ()=>{
    ipc.send('minimizeApp')
})

/* MAXIMIZE/RESTORE APP */
maxResBtn.addEventListener('click', ()=> {
    ipc.send('maximizeRestoreApp')
})

function changeMaxResBtn(isMaximizedApp){
    if(isMaximizedApp){
        maxResBtn.title = 'Restore'
        maxResBtn.classList.remove('maximizeBtn')
        maxResBtn.classList.add('restoreBtn')
    } else {
        maxResBtn. title = 'Maximize'
        maxResBtn.classList.remove('restoreBtn')
        maxResBtn.classList.add('maximizeBtn')
        
    }
}

ipc.on('isMaximized', ()=>{ changeMaxResBtn(true) })
ipc.on('isRestored', ()=>{ changeMaxResBtn(false) })

/* CLOSE APP */
closeBtn.addEventListener('click', ()=>{
    ipc.send('closeApp')
})


loginMicrosoft.addEventListener('click', () => {
    ipc.send(
            MSFT_OPCODE.OPEN_LOGIN,
            loginOptionsViewOnLoginSuccess,
            loginOptionsViewOnLoginCancel
        )
})