const { ipcRenderer, app } = require('electron')
const { shell } = require('electron');
const path = require('path');
const magnet_utils = require('./js/utils.js');
const { version } = require('process');
const fs = require('fs');
const https = require('https');
const FormData = require('form-data');
const got = require('got');

const {getSelectedAccessToken} = require('./js/accounts.js')

const maxResBtn = document.getElementById('maxResBtn')
const sidebar = document.getElementById('sidebar')

const Account_btn = document.getElementById('Account_btn')
const Game_btn = document.getElementById('Game_btn')
const Skin_btn = document.getElementById('Skin_btn')
const Mods_btn = document.getElementById('Mods_btn')
const Configs_btn = document.getElementById('Configs_btn')
const Launcher_btn = document.getElementById('Launcher_btn')
const About_btn = document.getElementById('About_btn')

const ipc = ipcRenderer

let Available_Vanilla_Configs;

let skinViewer = undefined;

showMainLayout();

//We inform the main process that we have loaded the main launcher page
ipc.send('loadedLauncherPage');

ipc.on('PlayerInfos', (event, launcherSettingsDir) =>{
    setPlayerInfos(launcherSettingsDir);
})

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

async function showMainLayout(){
    document.getElementById('mainLayout').style.display = "flex";
    document.getElementById('settingsLayout').style.display = "none";

    await magnet_utils.sleep(500);
    
    ipc.send('getInstalledConfigs');

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
    
    ipc.send('loadedLauncherPage');
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
    document.getElementById('configsSettingsLayout').style.display = "none";
    document.getElementById('configInstall').style.display = "none";
    document.getElementById('skinAdd').style.display = "none";

})

Game_btn.addEventListener('click', ()=>{
    hideMainLayout();
    document.getElementById('accountSettingsLayout').style.display = "none";
    document.getElementById('gameSettingsLayout').style.display = "flex";
    document.getElementById('skinSettingsLayout').style.display = "none";
    document.getElementById('modsSettingsLayout').style.display = "none";
    document.getElementById('launcherSettingsLayout').style.display = "none";
    document.getElementById('aboutSettingsLayout').style.display = "none";
    document.getElementById('configsSettingsLayout').style.display = "none";
    document.getElementById('configInstall').style.display = "none";
    document.getElementById('skinAdd').style.display = "none";
})

Skin_btn.addEventListener('click', ()=>{
    hideMainLayout();
    document.getElementById('accountSettingsLayout').style.display = "none";
    document.getElementById('gameSettingsLayout').style.display = "none";
    document.getElementById('skinSettingsLayout').style.display = "flex";
    document.getElementById('modsSettingsLayout').style.display = "none";
    document.getElementById('launcherSettingsLayout').style.display = "none";
    document.getElementById('aboutSettingsLayout').style.display = "none";
    document.getElementById('configsSettingsLayout').style.display = "none";
    document.getElementById('configInstall').style.display = "none";
    document.getElementById('skinAdd').style.display = "none";
    ipc.send('getSkins');

})

Mods_btn.addEventListener('click', ()=>{
    hideMainLayout();
    document.getElementById('accountSettingsLayout').style.display = "none";
    document.getElementById('gameSettingsLayout').style.display = "none";
    document.getElementById('skinSettingsLayout').style.display = "none";
    document.getElementById('modsSettingsLayout').style.display = "flex";
    document.getElementById('launcherSettingsLayout').style.display = "none";
    document.getElementById('aboutSettingsLayout').style.display = "none";
    document.getElementById('configsSettingsLayout').style.display = "none";
    document.getElementById('configInstall').style.display = "none";
    document.getElementById('skinAdd').style.display = "none";
})

Configs_btn.addEventListener('click', async ()=>{
    hideMainLayout();
    document.getElementById('accountSettingsLayout').style.display = "none";
    document.getElementById('gameSettingsLayout').style.display = "none";
    document.getElementById('skinSettingsLayout').style.display = "none";
    document.getElementById('modsSettingsLayout').style.display = "none";
    document.getElementById('launcherSettingsLayout').style.display = "none";
    document.getElementById('aboutSettingsLayout').style.display = "none";
    document.getElementById('configsSettingsLayout').style.display = "flex";
    document.getElementById('configInstall').style.display = "none";
    document.getElementById('skinAdd').style.display = "none";

    await magnet_utils.sleep(500);
    
    ipc.send('getInstalledConfigs');
})

Launcher_btn.addEventListener('click', ()=>{
    hideMainLayout();
    document.getElementById('accountSettingsLayout').style.display = "none";
    document.getElementById('gameSettingsLayout').style.display = "none";
    document.getElementById('skinSettingsLayout').style.display = "none";
    document.getElementById('modsSettingsLayout').style.display = "none";
    document.getElementById('launcherSettingsLayout').style.display = "flex";
    document.getElementById('aboutSettingsLayout').style.display = "none";
    document.getElementById('configsSettingsLayout').style.display = "none";
    document.getElementById('configInstall').style.display = "none";
    document.getElementById('skinAdd').style.display = "none";
})

About_btn.addEventListener('click', ()=>{
    hideMainLayout();
    document.getElementById('accountSettingsLayout').style.display = "none";
    document.getElementById('gameSettingsLayout').style.display = "none";
    document.getElementById('skinSettingsLayout').style.display = "none";
    document.getElementById('modsSettingsLayout').style.display = "none";
    document.getElementById('launcherSettingsLayout').style.display = "none";
    document.getElementById('aboutSettingsLayout').style.display = "flex";
    document.getElementById('configsSettingsLayout').style.display = "none";
    document.getElementById('configInstall').style.display = "none";
    document.getElementById('skinAdd').style.display = "none";
})

/// SKIN SETTINGS ///

document.getElementById('newSkin').addEventListener('click', () =>{
    document.getElementById('skinAdd').style.display = "flex";
    document.getElementById('skinSettingsLayout').style.display = "none";
})

document.getElementById('selectclassic').addEventListener('click', ()=>{
    document.getElementById('typeSelector').innerHTML = "Classic";
})

document.getElementById('selectslim').addEventListener('click', ()=>{
    document.getElementById('typeSelector').innerHTML = "Slim";
})

document.getElementById('skinPathSelectBtn').addEventListener('click', async () =>{
    if(document.getElementById('typeSelector').innerHTML != "<i>Select a type</i>"){
        type = document.getElementById('typeSelector').innerHTML;
        if(document.getElementById('SkinName').value != ""){
            skinname = document.getElementById('SkinName').getAttribute('value');
            ipc.send('addnewSkin', type, skinname);
        }
        else{
            ipc.send("error-skin-name");
        }
    }
    else{
        ipc.send("error-skin-type");
    }
})

ipc.on('addedSkinPath', (event, selectedFile)=>{
    path_ = selectedFile.replace(/\\/g, '/');
    document.getElementById('skin_path').setAttribute('value',`${path_}`);
})

ipc.on('updated_skins', (event, jsonData) =>{
    document.getElementById('skinSettingsLayout').style.display = "flex";
    document.getElementById('skinAdd').style.display = "none";
    document.getElementById('typeSelector').innerHTML = "<i>Select a type</i>";
    document.getElementById('SkinName').value = "";
    document.getElementById('skin_path').setAttribute('value',"none");
    displaySkins(jsonData);
    ipc.send('loadedLauncherPage');
})

document.getElementById('add-skin-button').addEventListener('click', () =>{
    if(document.getElementById('skin_path').getAttribute('value') != "none" && document.getElementById('SkinName').value != ""){
        type = document.getElementById('typeSelector').innerHTML;
        skinname = document.getElementById('SkinName').value;
        path_ = document.getElementById('skin_path').getAttribute('value');
        ipc.send("addSkin", type, skinname, path_);
    }
})

async function displaySkins(jsonData) {

    document.getElementById('skins-grid-container').innerHTML = "";

    for (let i = 0; i <= jsonData.skins.length-1; i++) {
        const skinBanner = document.createElement('div');
        skinBanner.className = "skin-item";

        deleteBtn = document.createElement('button');
        deleteBtnIcon = document.createElement('img');
        deleteBtnIcon.setAttribute('src', "./icons/close.svg");
        deleteBtnIcon.setAttribute('width',"15px");
        deleteBtn.appendChild(deleteBtnIcon);
        deleteBtn.className = "deleteSkinBtn";
        deleteBtn.addEventListener('click', () =>{
            ipc.send('deleteSkin', i);
        })

        skinBanner.appendChild(deleteBtn);

        skinName = document.createElement('p');
        skinName.style = "color:white; margin-bottom:25px;";
        skinName.innerHTML = `${jsonData.skins[i].name}`;

        skinBanner.appendChild(skinName);

        canvas = document.createElement('canvas');
        canvas.setAttribute('id', `skin_container-${jsonData.skins[i].name}`);

        skinBanner.appendChild(canvas);

        const selectBtn = document.createElement('button');
        selectBtn.style = "margin-left:auto; margin-right:auto; margin-top:15px;";
        selectBtn.className = "add_install_btn";
        selectBtn.innerHTML = 'Select Skin'
        selectBtn.addEventListener('click', () =>{
            ipc.send('uploadSkin', i, jsonData.skins[i].path, jsonData.skins[i].type);
            
        })

        skinBanner.appendChild(selectBtn);


        document.getElementById('skins-grid-container').appendChild(skinBanner); 

        const skinViewer = new skinview3d.SkinViewer({
            canvas: document.getElementById(`skin_container-${jsonData.skins[i].name}`),
            width: 100,
            height: 200,
            skin: jsonData.skins[i].path
        });
        skinViewer.controls.enableZoom = false;
        
    }
}

ipc.on('uploadSkin', (event, launcherSettingsDir, path, type)=>{
    accessToken = getSelectedAccessToken(launcherSettingsDir);
    uploadSkinFile(accessToken, path, type);
})

async function uploadSkinFile(accessToken, file, variant) {
    try {
        const formData = new FormData();
        formData.append('variant', variant); // Ensure variant is correct: "classic" or "slim"
        formData.append('file', fs.createReadStream(file), {
            filename: `${file.split('\\').pop()}`, // Adjust filename as needed
            contentType: 'image/png' // Set correct content type
        });

        const response = await got.post('https://api.minecraftservices.com/minecraft/profile/skins', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                ...formData.getHeaders() // Set correct headers for multipart/form-data
            },
            body: formData
        });

        console.log('Skin uploaded successfully');
    } catch (error) {
        // Handle specific error cases
        if (error.response && error.response.body) {
            console.error('Upload failed:', error.response.body);
        } else {
            console.error('Upload failed:', error.message);
        }
    }
}

/// CONFIG SETTINGS ///

document.getElementById('newConfigBtn').addEventListener('click', () => {
    document.getElementById('accountSettingsLayout').style.display = "none";
    document.getElementById('gameSettingsLayout').style.display = "none";
    document.getElementById('skinSettingsLayout').style.display = "none";
    document.getElementById('modsSettingsLayout').style.display = "none";
    document.getElementById('launcherSettingsLayout').style.display = "none";
    document.getElementById('aboutSettingsLayout').style.display = "none";
    document.getElementById('configsSettingsLayout').style.display = "none";
    document.getElementById('configInstall').style.display = "flex";

    document.getElementById('createVanilla').addEventListener('click', () =>{
        
        document.getElementById('configInstall').innerHTML = `
                <h1 style="text-decoration: underline; margin-left: auto; margin-right: auto;">Install New Configuration</h1>
                <h2 style="margin: 5px;">Loader :</h2>
                <div class="line" style="width:95%;"></div>
                <div class="dropdown">
                  <button class="dropbtn" id="loaderSelector">Vanilla</button>
                  <div class="dropdown-content">
                    <a id="createVanilla">Vanilla</a>
                    <a id="createForge" style="cursor: not-allowed;">Forge (Not available for now)</a>
                    <a id="createFabric" style="cursor: not-allowed;">Fabric (Not available for now)</a>
                  </div>
                </div>
                <h2 style="margin: 5px;">Type :</h2>
                <div class="line" style="width:95%;"></div>
                <div class="dropdown">
                  <button class="dropbtn" id="typeSelector"><i>Select a type</i></button>
                  <div class="dropdown-content">
                    <a id="selectRelease">Release</a>
                    <a id="selectSnapshot">Snapshot</a>
                    <a id="selectBeta">Old Beta</a>
                    <a id="selectAlpha">Old Alpha</a>
                  </div>
                </div>`;

        document.getElementById('selectRelease').addEventListener('click', selectRelease);
        document.getElementById('selectSnapshot').addEventListener('click', selectSnapshot);
        document.getElementById('selectBeta').addEventListener('click', selectBeta);
        document.getElementById('selectAlpha').addEventListener('click', selectAlpha);
        
    })
})

ipc.on('sentAvailableConfigs', (event, jsonData)=>{
    Available_Vanilla_Configs = jsonData;
})

async function selectRelease(){
    document.getElementById('typeSelector').textContent = "Release";

    if(!document.getElementById('versionSelector') && !document.getElementById('versionTitle') && !document.getElementById('versionTitleLine')){
        versionTitle = document.createElement('h2');
        versionTitle.style="margin: 5px;";
        versionTitle.textContent = "Version";
        versionTitle.setAttribute("id", "versionTitle");
        document.getElementById('configInstall').appendChild(versionTitle);

        versionTitleLine = document.createElement('div');
        versionTitleLine.className = "line";
        versionTitleLine.style="width:95%;";
        versionTitleLine.setAttribute("id", "versionTitleLine");
        document.getElementById('configInstall').appendChild(versionTitleLine);

        dropdown = document.createElement('div');
        dropdown.className = "dropdown";

        dropdownBtn = document.createElement('button');
        dropdownBtn.className = "dropbtn";
        dropdownBtn.innerHTML = "<i>Select a version</i>";
        dropdownBtn.setAttribute('id', "versionSelector");
        dropdown.appendChild(dropdownBtn);

        dropdownContent = document.createElement('div');
        dropdownContent.className = "dropdown-content";
        dropdownContent.style = "position:relative;";
        dropdownContent.setAttribute('id', "dropdownContent");

        ipc.send('getAvailableConfigs');

        while(!Available_Vanilla_Configs){
            await magnet_utils.sleep(1);
        }

        const releaseVersions = Available_Vanilla_Configs.versions
            .filter(version => version.type === 'release')
            .map(({ id, url }) => ({ id, url }));

        releaseVersions.forEach(({ id, url }) =>{
            const version = document.createElement('a');
            version.textContent = `release-${id}`;
            version.addEventListener('click', () => {selectVanillaVersion(`release-${id}`)});
            dropdownContent.appendChild(version);
        })

        dropdown.appendChild(dropdownContent);

        document.getElementById('configInstall').appendChild(dropdown);
    }
    else if(document.getElementById('dropdownContent')){
        document.getElementById("dropdownContent").innerHTML = "";
        const releaseVersions = Available_Vanilla_Configs.versions
            .filter(version => version.type === 'release')
            .map(({ id, url }) => ({ id, url }));

        releaseVersions.forEach(({ id, url }) =>{
            const version = document.createElement('a');
            version.textContent = `release-${id}`;
            version.addEventListener('click', () => {selectVanillaVersion(`release-${id}`)});
            document.getElementById("dropdownContent").appendChild(version);
        })
    }

    
}

async function selectSnapshot(){
    document.getElementById('typeSelector').textContent = "Snapshot";

    if(!document.getElementById('versionSelector') && !document.getElementById('versionTitle') && !document.getElementById('versionTitleLine')){
        versionTitle = document.createElement('h2');
        versionTitle.style="margin: 5px;";
        versionTitle.textContent = "Version";
        versionTitle.setAttribute("id", "versionTitle");
        document.getElementById('configInstall').appendChild(versionTitle);

        versionTitleLine = document.createElement('div');
        versionTitleLine.className = "line";
        versionTitleLine.style="width:95%;";
        versionTitleLine.setAttribute("id", "versionTitleLine");
        document.getElementById('configInstall').appendChild(versionTitleLine);

        dropdown = document.createElement('div');
        dropdown.className = "dropdown";

        dropdownBtn = document.createElement('button');
        dropdownBtn.className = "dropbtn";
        dropdownBtn.innerHTML = "<i>Select a version</i>";
        dropdownBtn.setAttribute('id', "versionSelector");
        dropdown.appendChild(dropdownBtn);

        dropdownContent = document.createElement('div');
        dropdownContent.className = "dropdown-content";
        dropdownContent.style = "position:relative;";
        dropdownContent.setAttribute('id', "dropdownContent");

        ipc.send('getAvailableConfigs');

        while(!Available_Vanilla_Configs){
            await magnet_utils.sleep(1);
        }

        const snapshotVersions = Available_Vanilla_Configs.versions
            .filter(version => version.type === 'snapshot')
            .map(({ id, url }) => ({ id, url }));

        snapshotVersions.forEach(({ id, url }) =>{
            const version = document.createElement('a');
            version.textContent = `snapshot-${id}`;
            version.addEventListener('click', () => {selectVanillaVersion(`snapshot-${id}`)});
            dropdownContent.appendChild(version);
        })

        dropdown.appendChild(dropdownContent);

        document.getElementById('configInstall').appendChild(dropdown);
    }
    else if(document.getElementById('dropdownContent')){
        document.getElementById("dropdownContent").innerHTML = "";
        const snapshotVersions = Available_Vanilla_Configs.versions
            .filter(version => version.type === 'snapshot')
            .map(({ id, url }) => ({ id, url }));

        snapshotVersions.forEach(({ id, url }) =>{
            const version = document.createElement('a');
            version.textContent = `snapshot-${id}`;
            version.addEventListener('click', () => {selectVanillaVersion(`snapshot-${id}`)});
            document.getElementById("dropdownContent").appendChild(version);
        })
    }
}

async function selectBeta(){
    document.getElementById('typeSelector').textContent = "Old Beta";

    if(!document.getElementById('versionSelector') && !document.getElementById('versionTitle') && !document.getElementById('versionTitleLine')){
        versionTitle = document.createElement('h2');
        versionTitle.style="margin: 5px;";
        versionTitle.textContent = "Version";
        versionTitle.setAttribute("id", "versionTitle");
        document.getElementById('configInstall').appendChild(versionTitle);

        versionTitleLine = document.createElement('div');
        versionTitleLine.className = "line";
        versionTitleLine.style="width:95%;";
        versionTitleLine.setAttribute("id", "versionTitleLine");
        document.getElementById('configInstall').appendChild(versionTitleLine);

        dropdown = document.createElement('div');
        dropdown.className = "dropdown";

        dropdownBtn = document.createElement('button');
        dropdownBtn.className = "dropbtn";
        dropdownBtn.innerHTML = "<i>Select a version</i>";
        dropdownBtn.setAttribute('id', "versionSelector");
        dropdown.appendChild(dropdownBtn);

        dropdownContent = document.createElement('div');
        dropdownContent.className = "dropdown-content";
        dropdownContent.style = "position:relative;";
        dropdownContent.setAttribute('id', "dropdownContent");

        ipc.send('getAvailableConfigs');

        while(!Available_Vanilla_Configs){
            await magnet_utils.sleep(1);
        }

        const betaVersions = Available_Vanilla_Configs.versions
            .filter(version => version.type === 'old_beta')
            .map(({ id, url }) => ({ id, url }));

        betaVersions.forEach(({ id, url }) =>{
            const version = document.createElement('a');
            version.textContent = `old_beta-${id}`;
            version.addEventListener('click', () => {selectVanillaVersion(`old_beta-${id}`)});
            dropdownContent.appendChild(version);
        })

        dropdown.appendChild(dropdownContent);

        document.getElementById('configInstall').appendChild(dropdown);
    }
    else if(document.getElementById('dropdownContent')){
        document.getElementById("dropdownContent").innerHTML = "";
        const snapshotVersions = Available_Vanilla_Configs.versions
            .filter(version => version.type === 'old_beta')
            .map(({ id, url }) => ({ id, url }));

        snapshotVersions.forEach(({ id, url }) =>{
            const version = document.createElement('a');
            version.textContent = `old_beta-${id}`;
            version.addEventListener('click', () => {selectVanillaVersion(`old_beta-${id}`)});
            document.getElementById("dropdownContent").appendChild(version);
        })
    }
}

async function selectAlpha(){
    document.getElementById('typeSelector').textContent = "Old Alpha";

    if(!document.getElementById('versionSelector') && !document.getElementById('versionTitle') && !document.getElementById('versionTitleLine')){
        versionTitle = document.createElement('h2');
        versionTitle.style="margin: 5px;";
        versionTitle.textContent = "Version";
        versionTitle.setAttribute("id", "versionTitle");
        document.getElementById('configInstall').appendChild(versionTitle);

        versionTitleLine = document.createElement('div');
        versionTitleLine.className = "line";
        versionTitleLine.style="width:95%;";
        versionTitleLine.setAttribute("id", "versionTitleLine");
        document.getElementById('configInstall').appendChild(versionTitleLine);

        dropdown = document.createElement('div');
        dropdown.className = "dropdown";

        dropdownBtn = document.createElement('button');
        dropdownBtn.className = "dropbtn";
        dropdownBtn.innerHTML = "<i>Select a version</i>";
        dropdownBtn.setAttribute('id', "versionSelector");
        dropdown.appendChild(dropdownBtn);

        dropdownContent = document.createElement('div');
        dropdownContent.className = "dropdown-content";
        dropdownContent.style = "position:relative;";
        dropdownContent.setAttribute('id', "dropdownContent");

        ipc.send('getAvailableConfigs');

        while(!Available_Vanilla_Configs){
            await magnet_utils.sleep(1);
        }

        const alphaVersions = Available_Vanilla_Configs.versions
            .filter(version => version.type === 'old_alpha')
            .map(({ id, url }) => ({ id, url }));

        alphaVersions.forEach(({ id, url }) =>{
            const version = document.createElement('a');
            version.textContent = `old_alpha-${id}`;
            version.addEventListener('click', () => {selectVanillaVersion(`old_alpha-${id}`)});
            dropdownContent.appendChild(version);
        })

        dropdown.appendChild(dropdownContent);

        document.getElementById('configInstall').appendChild(dropdown);
    }
    else if(document.getElementById('dropdownContent')){
        document.getElementById("dropdownContent").innerHTML = "";
        const snapshotVersions = Available_Vanilla_Configs.versions
            .filter(version => version.type === 'old_alpha')
            .map(({ id, url }) => ({ id, url }));

        snapshotVersions.forEach(({ id, url }) =>{
            const version = document.createElement('a');
            version.textContent = `old_alpha-${id}`;
            version.addEventListener('click', () => {selectVanillaVersion(`old_alpha-${id}`)});
            document.getElementById("dropdownContent").appendChild(version);
        })
    }
}

function selectVanillaVersion(fullVersion){
    document.getElementById('versionSelector').textContent = fullVersion;

    if(!document.getElementById('installBtn')){
        InstallBtn = document.createElement('button');
        InstallBtn.setAttribute("id", "installBtn");
        InstallBtn.className = "add_install_btn";
        InstallBtn.textContent = "Install";
        InstallBtn.addEventListener('click', ()=>getVanillaInfosFromVersion(document.getElementById('versionSelector').textContent));
        document.getElementById('configInstall').appendChild(InstallBtn);
    }
    else{
        document.getElementById('installBtn').addEventListener('click', ()=>getVanillaInfosFromVersion(document.getElementById('versionSelector').textContent));
    }
}

function getVanillaInfosFromVersion(fullVersion){
    let parts = fullVersion.split('-');
    let type_ = parts[0];
    version_ = fullVersion.replace(type_+"-", "");

    if (type_=="release"){
        
        const filteredVersion = Available_Vanilla_Configs.versions.find(version => version.type === type_ && version.id === version_);
        
        if (filteredVersion) {
            const index = Available_Vanilla_Configs.versions.indexOf(filteredVersion);
            const id = filteredVersion.id;
            const url = filteredVersion.url;

            ipc.send('installNewVersion', index ,"vanilla", "release", id, url);
        }
        
    }
    if (type_=="snapshot"){
        const filteredVersion = Available_Vanilla_Configs.versions.find(version => version.type === type_ && version.id === version_);
        
        if (filteredVersion) {
            const index = Available_Vanilla_Configs.versions.indexOf(filteredVersion);
            const id = filteredVersion.id;
            const url = filteredVersion.url;

            ipc.send('installNewVersion', index ,"vanilla", "snapshot", id, url);
        }
    }
    if (type_=="old_beta"){
        const filteredVersion = Available_Vanilla_Configs.versions.find(version => version.type === type_ && version.id === version_);
        
        if (filteredVersion) {
            const index = Available_Vanilla_Configs.versions.indexOf(filteredVersion);
            const id = filteredVersion.id;
            const url = filteredVersion.url;

            ipc.send('installNewVersion', index ,"vanilla", "old_beta", id, url);
        }
    }
    if (type_=="old_alpha"){
        const filteredVersion = Available_Vanilla_Configs.versions.find(version => version.type === type_ && version.id === version_);
        
        if (filteredVersion) {
            const index = Available_Vanilla_Configs.versions.indexOf(filteredVersion);
            const id = filteredVersion.id;
            const url = filteredVersion.url;

            ipc.send('installNewVersion', index ,"vanilla", "old_alpha", id, url);
        }
    }
}

ipc.on('sentInstalledConfigs', (event, jsonData) =>{

    if(document.getElementById('mainLayout').style.display == "none"){
        const containerDiv = document.getElementById('installedConfigsContainer');
        containerDiv.innerHTML = '';

        configArray = jsonData.configs;

        configArray.forEach((item, index) => {
            // Create a new div element
            const newDiv = document.createElement('div');
            newDiv.className = "installedConfig";

            // Check the loader type
            if (item.loader === "vanilla") {
                // Create and style the icon div
                const icon = document.createElement('div');
                icon.className = "vanilla_icon";
                icon.style.width = "40px";
                icon.style.height = "40px";
                icon.style.marginRight = "30%";
                // Append icon to newDiv
                newDiv.appendChild(icon);
            }

            const version_text = document.createElement('p');
            if(item.loader === "vanilla"){
                if(item.type == "release"){
                    version_text.textContent = `release-${item.version}`;
                }
                if(item.type == "snapshot"){
                    version_text.textContent = `snapshot-${item.version}`;
                }
                if(item.type == "old_beta"){
                    version_text.textContent = `old_beta-${item.version}`;
                }
                if(item.type == "old_alpha"){
                    version_text.textContent = `old_alpha-${item.version}`;
                }
            }
            else{
                version_text.textContent = item.version;
            }
            version_text.style.width="100px";

            const selectBtn = document.createElement('div');
            selectBtn.className = "selectConfigButton";

            selectBtn.addEventListener('click', () =>{
                selectConfig(index);
            })

            const selectBtnText = document.createElement('p');
            selectBtnText.textContent = "Select";
            selectBtn.appendChild(selectBtnText);

            const deleteBtn = document.createElement('div');
            deleteBtn.className = "deleteConfigButton";
            deleteBtn.addEventListener('click', () =>{
                deleteConfig(index);
            })
            deleteBtn.innerHTML = `<img width=15 src="./icons/trash-solid.svg" alt="trash_icon">`;

            newDiv.setAttribute("index", index);

            // Set the text content of newDiv to item.version
            newDiv.appendChild(version_text);

            newDiv.appendChild(selectBtn);
            newDiv.appendChild(deleteBtn);
            
            
    
            // Append the new div to the container div
            containerDiv.appendChild(newDiv);
        });
    }
    else{
        const containerDiv = document.getElementById('versiondropdown');
        containerDiv.innerHTML = '';

        configArray = jsonData.configs;
        selectedConfigIndex = jsonData.current;

        configArray.forEach((item, index) => {
            const configBtn = document.createElement('button');
            configBtn.className = 'versionbtn';

            configBtn.setAttribute('index', index);

            // Check the loader type
            if (item.loader === "vanilla") {
                // Create and style the icon div
                const icon = document.createElement('div');
                icon.className = "vanilla_icon";
                configBtn.appendChild(icon);
            }

            const versionText = document.createElement('a');
            versionText.textContent = item.version;
            configBtn.appendChild(versionText);
            
            configBtn.addEventListener('click', ()=>{
                selectConfig(index);
            })

            containerDiv.appendChild(configBtn);

            if(index != jsonData.configs.length-1){
                //We add the separation line
                const line = document.createElement('div');
                line.className = "line";
                containerDiv.appendChild(line);
            }

        })

        setSelectedConfigButton(configArray, selectedConfigIndex);
    }
})

function selectConfig(index){
    ipc.send('setSelectedConfig', index);
}

function deleteConfig(index){
    ipc.send('deleteConfig', index);
}

ipc.on('deletedConfig', (event, index)=>{
    const configDiv = document.getElementById('installedConfigsContainer');
    for (let i = 0; i < configDiv.children.length; i++) {
        if(configDiv.children[i].getAttribute('index')==`${index}`){
            configDiv.removeChild(configDiv.children[i]);
        }
    }
})

function setSelectedConfigButton(configs, current){
    if(document.getElementById('mainLayout').style.display == "flex"){
        if(current >= 0){
            if (configs[current].loader === "vanilla"){
                document.getElementById('currentVersionLoaderIcon').className = 'vanilla_icon';
            }
            document.getElementById('currentVersionText').textContent = configs[current].version;
        }
        else{
            document.getElementById('currentVersionLoaderIcon').className = '';
            document.getElementById('currentVersionText').textContent = '';
        }
    }
}



/// EXT LINKS ///

document.getElementById('electron_link').addEventListener('click', () => {
    ipc.send("electron_link");
})

document.getElementById('fontawesome_link').addEventListener('click', () => {
    ipc.send("fontawesome_link");
})

document.getElementById('skinview3d_link').addEventListener('click', () => {
    ipc.send("skinview3d_link");
})

document.getElementById('complementary_link').addEventListener('click', () => {
    ipc.send("complementary_link");
})

document.getElementById('icons8_link').addEventListener('click', () =>{
    ipc.send("icons8_link");
})

document.getElementById('reportbugBtn').addEventListener('click', () =>{
    ipc.send("reportIssue");
})

document.getElementById('discordSVG').addEventListener('click', () => {
    ipc.send("discord_link");
})

/// GAME SETTINGS ///

document.getElementById('fullscreen').addEventListener('change', () =>{
    if (document.getElementById('fullscreen').checked) {
        document.getElementById('resX').disabled = true;
        document.getElementById('resY').disabled = true;

    } else {
        document.getElementById('resX').disabled = false;
        document.getElementById('resY').disabled = false;
    }
})

ipc.on('updated_java_exec', (event, jsonData) =>{
    document.getElementById('java_path').setAttribute('value', jsonData.javawPath);
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

for (let ele of document.getElementsByClassName('FileSelButton')) {
    if (ele.getAttribute('select-type') === "directories") {
        ele.onclick = async e => {
            ipc.send('selectDownloadsDirectory');
        }
    }
    if (ele.getAttribute('select-type') === "java") {
        ele.onclick = async e => {
            ipc.send('selectJavaw');
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
    if(!(customBG == "../images/background7.jpg")){
        document.getElementById('mainAppBG').style.backgroundImage = `url(${customBG})`;
    }
    
});



/// PLAY ///

document.getElementById('playButton').addEventListener('click',() =>{

    JVMArgs = document.getElementById('JVMArgs').getAttribute('value');
    ipc.send('play', JVMArgs);
})

/// PLAYER INFOS

async function setPlayerInfos(launcherSettingsDir){

    if(fs.existsSync(path.join(launcherSettingsDir,'accounts.json'))){

        let accountsfileContent = fs.readFileSync(path.join(launcherSettingsDir,'accounts.json'), 'utf-8');
        let accountsjsonData = JSON.parse(accountsfileContent);

        if(accountsjsonData.selectedAccount != ""){
            if(Object.keys(accountsjsonData.accounts).includes(accountsjsonData.selectedAccount)){
                document.getElementById('playersname').innerHTML = accountsjsonData.accounts[accountsjsonData.selectedAccount].displayName;
            }
        }
    }

    if(fs.existsSync(path.join(launcherSettingsDir,'skins.json'))){
        let skinsfileContent = fs.readFileSync(path.join(launcherSettingsDir,'skins.json'), 'utf-8');
        let skinsjsonData = JSON.parse(skinsfileContent);

        if(0 <= skinsjsonData.selected <= skinsjsonData.skins.length-1){
            const skinPath = skinsjsonData.skins[skinsjsonData.selected].path;

            skinViewer = new skinview3d.SkinViewer({
                canvas: document.getElementById('player_head'),
                width: 100,
                height: 100,
                renderPaused: true  // Ensure rendering is paused for setup
            });

            skinViewer.controls.enableRotate = false;
            skinViewer.controls.enableZoom = false;
            skinViewer.zoom = 2;

            // Make body parts invisible
            skinViewer.playerObject.skin.body.innerLayer.visible = false;
            skinViewer.playerObject.skin.body.outerLayer.visible = false;
            skinViewer.playerObject.skin.rightArm.innerLayer.visible = false;
            skinViewer.playerObject.skin.rightArm.outerLayer.visible = false;
            skinViewer.playerObject.skin.leftArm.innerLayer.visible = false;
            skinViewer.playerObject.skin.leftArm.outerLayer.visible = false;
            skinViewer.playerObject.skin.rightLeg.innerLayer.visible = false;
            skinViewer.playerObject.skin.rightLeg.outerLayer.visible = false;
            skinViewer.playerObject.skin.leftLeg.innerLayer.visible = false;
            skinViewer.playerObject.skin.leftLeg.outerLayer.visible = false;

            // Load the skin and render
            (async function () {
                await skinViewer.loadSkin(skinPath)
                skinViewer.playerObject.skin.head.rotation.x = 0.3;
                skinViewer.playerObject.skin.head.rotation.y = 0.8;
                skinViewer.playerObject.skin.head.position.y = -11.5;
                skinViewer.playerObject.skin.head.position.y = -11.5;
                skinViewer.render();
            })();

            function animate() {
                requestAnimationFrame(animate);
                skinViewer.render();
            }

            animate();
        }
        else{
            if(fs.existsSync(path.join(launcherSettingsDir,'accounts.json'))){
                let accountsfileContent = fs.readFileSync(path.join(launcherSettingsDir,'accounts.json'), 'utf-8');
                let accountsjsonData = JSON.parse(accountsfileContent);

                if(accountsjsonData.selectedAccount != ""){
                    if(Object.keys(accountsjsonData.accounts).includes(accountsjsonData.selectedAccount)){
                        
                        uuid = accountsjsonData.accounts[accountsjsonData.selectedAccount].uuid;
                        skinPath = await getSkinPath(uuid, launcherSettingsDir);

                        

                        skinViewer = new skinview3d.SkinViewer({
                            canvas: document.getElementById('player_head'),
                            width: 100,
                            height: 100,
                            renderPaused: true  // Ensure rendering is paused for setup
                        });
            
                        skinViewer.controls.enableRotate = false;
                        skinViewer.controls.enableZoom = false;
                        skinViewer.zoom = 2;
            
                        // Make body parts invisible
                        skinViewer.playerObject.skin.body.innerLayer.visible = false;
                        skinViewer.playerObject.skin.body.outerLayer.visible = false;
                        skinViewer.playerObject.skin.rightArm.innerLayer.visible = false;
                        skinViewer.playerObject.skin.rightArm.outerLayer.visible = false;
                        skinViewer.playerObject.skin.leftArm.innerLayer.visible = false;
                        skinViewer.playerObject.skin.leftArm.outerLayer.visible = false;
                        skinViewer.playerObject.skin.rightLeg.innerLayer.visible = false;
                        skinViewer.playerObject.skin.rightLeg.outerLayer.visible = false;
                        skinViewer.playerObject.skin.leftLeg.innerLayer.visible = false;
                        skinViewer.playerObject.skin.leftLeg.outerLayer.visible = false;
            
                        // Load the skin and render
                        (async function () {
                            await skinViewer.loadSkin(skinPath)
                            skinViewer.playerObject.skin.head.rotation.x = 0.3;
                            skinViewer.playerObject.skin.head.rotation.y = 0.8;
                            skinViewer.playerObject.skin.head.position.y = -11.5;
                            skinViewer.playerObject.skin.head.position.y = -11.5;
                            skinViewer.render();
                        })();
            
                        function animate() {
                            requestAnimationFrame(animate);
                            skinViewer.render();
                        }
            
                        animate();
                    } 
                }
            }
        }
        
    }
    
}

async function getSkinPath(uuid, launcherSettingsDir){
    const response = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    textureDataB64 = data['properties'][0]['value'];
    textureDataStr = atob(textureDataB64);
    textureURL = JSON.parse(textureDataStr).textures.SKIN.url;
    filePath = path.join(launcherSettingsDir, 'current.png');

    fs.rmSync(filePath);

    try {
        const response = await fetch(textureURL);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const buffer = await response.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(buffer));
        return filePath;
    } catch (error) {
        console.error('Current skin download failed:', error);
    }
    
}


/// ACCOUNTS SETTINGS
