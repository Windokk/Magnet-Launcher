const { ipcRenderer, app } = require('electron')
const { shell } = require('electron');
const path = require('path');
const magnet_utils = require('./js/utils.js');


const maxResBtn = document.getElementById('maxResBtn')
const sidebar = document.getElementById('sidebar')

const Account_btn = document.getElementById('Account_btn')
const Game_btn = document.getElementById('Game_btn')
const Skin_btn = document.getElementById('Skin_btn')
const Mods_btn = document.getElementById('Mods_btn')
const Launcher_btn = document.getElementById('Launcher_btn')
const About_btn = document.getElementById('About_btn')

const ipc = ipcRenderer


let receivedDownloadFilesDir = "";

var isLeftMenuActive = false;
var isversiondropdownShown = false;

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
        sidebar.style.width = '0'
        document.getElementById("rightPart").style.marginLeft= "0";
        isLeftMenuActive = false
    }
    else{
        sidebar.style.width = '200px'
        document.getElementById("rightPart").style.marginLeft= "200px";
        isLeftMenuActive = true
    }
})

/// VERSION SELECTION ///

function showDropdown() {
    document.getElementById('versiondropdown').classList.add('show');
    isversiondropdownShown = true;
}

function hideDropdown() {
    document.getElementById('versiondropdown').classList.remove('show');
    isversiondropdownShown = false;
}

document.getElementById('versionbtn').addEventListener('click', (event) => {
    event.stopPropagation(); // Prevent the event from propagating to the document
    if (!isversiondropdownShown) {
        showDropdown();
    } else {
        hideDropdown();
    }
});

document.addEventListener('click', (event) => {
    if (isversiondropdownShown) {
        hideDropdown();
    }
});

document.getElementById('versiondropdown').addEventListener('click', (event) => {
    event.stopPropagation();
});

/// LAYOUT CHANGES ///

function showMainLayout(){
    document.getElementById('mainLayout').style.display = "flex";
    document.getElementById('settingsLayout').style.display = "none";
}

function hideMainLayout(){
    document.getElementById('mainLayout').style.display = "none";
    document.getElementById('settingsLayout').style.display = "block";
}

document.getElementById('closeSettingsBtn').addEventListener('click', () =>{
    showMainLayout();
    if(document.getElementById("rightPart").style.marginLeft == "200px"){
        document.getElementById('showHideMenus').click();
    }
})

/// SETTINGS BUTTONS

Account_btn.addEventListener('click', ()=>{
    hideMainLayout();
    document.getElementById('accountSettingsLayout').style.display = "flex";
    document.getElementById('gameSettingsLayout').style.display = "none";
    document.getElementById('skinSettingsLayout').style.display = "none";
    document.getElementById('modsSettingsLayout').style.display = "none";
    document.getElementById('launcherSettingsLayout').style.display = "none";
    document.getElementById('aboutSettingsLayout').style.display = "none";

})

Game_btn.addEventListener('click', ()=>{
    hideMainLayout();
    document.getElementById('accountSettingsLayout').style.display = "none";
    document.getElementById('gameSettingsLayout').style.display = "flex";
    document.getElementById('skinSettingsLayout').style.display = "none";
    document.getElementById('modsSettingsLayout').style.display = "none";
    document.getElementById('launcherSettingsLayout').style.display = "none";
    document.getElementById('aboutSettingsLayout').style.display = "none";
})

Skin_btn.addEventListener('click', ()=>{
    hideMainLayout();
    document.getElementById('accountSettingsLayout').style.display = "none";
    document.getElementById('gameSettingsLayout').style.display = "none";
    document.getElementById('skinSettingsLayout').style.display = "flex";
    document.getElementById('modsSettingsLayout').style.display = "none";
    document.getElementById('launcherSettingsLayout').style.display = "none";
    document.getElementById('aboutSettingsLayout').style.display = "none";
})

Mods_btn.addEventListener('click', ()=>{
    hideMainLayout();
    document.getElementById('accountSettingsLayout').style.display = "none";
    document.getElementById('gameSettingsLayout').style.display = "none";
    document.getElementById('skinSettingsLayout').style.display = "none";
    document.getElementById('modsSettingsLayout').style.display = "flex";
    document.getElementById('launcherSettingsLayout').style.display = "none";
    document.getElementById('aboutSettingsLayout').style.display = "none";
})

Launcher_btn.addEventListener('click', ()=>{
    hideMainLayout();
    document.getElementById('accountSettingsLayout').style.display = "none";
    document.getElementById('gameSettingsLayout').style.display = "none";
    document.getElementById('skinSettingsLayout').style.display = "none";
    document.getElementById('modsSettingsLayout').style.display = "none";
    document.getElementById('launcherSettingsLayout').style.display = "flex";
    document.getElementById('aboutSettingsLayout').style.display = "none";
})

About_btn.addEventListener('click', ()=>{
    hideMainLayout();
    document.getElementById('accountSettingsLayout').style.display = "none";
    document.getElementById('gameSettingsLayout').style.display = "none";
    document.getElementById('skinSettingsLayout').style.display = "none";
    document.getElementById('modsSettingsLayout').style.display = "none";
    document.getElementById('launcherSettingsLayout').style.display = "none";
    document.getElementById('aboutSettingsLayout').style.display = "flex";
})

/// EXT LINK ///

document.getElementById('electron_link').addEventListener('click', () => {
    ipc.send("electron_link");
})

document.getElementById('fontawesome_link').addEventListener('click', () => {
    ipc.send("fontawesome_link");
})

document.getElementById('mcheads_link').addEventListener('click', () => {
    ipc.send("mcheads_link");
})

document.getElementById('complementary_link').addEventListener('click', () => {
    ipc.send("complementary_link");
})


/// LAUNCHER SETTINGS ///

const autoUpdate = document.getElementById('autoUpdate');
const updateLauncherNow = document.getElementById('updateLauncherNow');

autoUpdate.addEventListener('change', () => {
    if (autoUpdate.checked) {
        updateLauncherNow.disabled = true;
    } else {
        updateLauncherNow.disabled = false;
    }
});

for (let ele of document.getElementsByClassName('settingsFileSelButton')) {
    if (ele.getAttribute('select-type') === "directories") {
        ele.onclick = async e => {
            ipc.send('selectDirectory');
        }
    }
}

ipc.on('update_download_dir', (event, downloadFilesDir) => {
    receivedDownloadFilesDir = downloadFilesDir;
    document.getElementById('download_dir').setAttribute('value', receivedDownloadFilesDir)
});

document.getElementById('background1').addEventListener('click', ()=>{
    ipc.send('select_bg', "background1");
})

document.getElementById('background2').addEventListener('click', ()=>{
    ipc.send('select_bg', "background2");
})

document.getElementById('background3').addEventListener('click', ()=>{
    ipc.send('select_bg', "background3");
})

document.getElementById('background4').addEventListener('click', ()=>{
    ipc.send('select_bg', "background4");
})

document.getElementById('background5').addEventListener('click', ()=>{
    ipc.send('select_bg', "background5");
})

document.getElementById('background6').addEventListener('click', ()=>{
    ipc.send('select_bg', "background6");
})

document.getElementById('background7').addEventListener('click', ()=>{
    ipc.send('select_bg', "background7");
})

document.getElementById('background-custom').addEventListener('click', ()=>{
    ipc.send('select_bg', "custom");
})

ipc.on('selected_bg', async (event, customBG) => {
    document.getElementById('mainAppBG').style.backgroundImage = "none";
    await magnet_utils.sleep(500);
    if(!(customBG == "./images/background7.jpg")){
        document.getElementById('mainAppBG').style.backgroundImage = `url(${customBG})`;
    }
    
});