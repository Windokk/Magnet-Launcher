const { ipcRenderer } = require('electron')
const maxResBtn = document.getElementById('maxResBtn')
const MySidebar = document.getElementById('MySidebar')
const ipc = ipcRenderer

var isLeftMenuActive = false;

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

showHideMenus.addEventListener('click', ()=>{
    if(isLeftMenuActive){
        MySidebar.style.width = '0'
        document.getElementById("rightPart").style.marginLeft= "0";
        isLeftMenuActive = false
    }
    else{
        MySidebar.style.width = '280px'
        document.getElementById("rightPart").style.marginLeft= "280px";
        isLeftMenuActive = true
    }
})