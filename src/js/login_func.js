const { ipcRenderer } = require('electron')
const maxResBtn = document.getElementById('maxResBtn')
const ipc = ipcRenderer
const loginMicrosoft = document.getElementById('login_ms')
const { AZURE_CLIENT_ID, MSFT_OPCODE, MSFT_REPLY_TYPE, MSFT_ERROR, SHELL_OPCODE } = require('./js/ipcconstants')
const { MicrosoftAuth, RestResponseStatus } = require('./js/ms_auth');
const { addMicrosoftAuthAccount, updateMicrosoftAuthAccount } = require('./js/accounts')
const path = require('path');
const fs = require('fs');




let launcherSettingsDir_ = "";

ipc.on('launcherAccountsSettingsDir', (event, dir) =>{
    if(launcherSettingsDir_ == ""){
        launcherSettingsDir_ = dir;
        checkForSelectedAccount();
    }
})

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

let loginOptionsViewOnLoginSuccess;
let loginOptionsViewOnLoginCancel;

loginMicrosoft.addEventListener('click', () => {
    ipc.send(
            MSFT_OPCODE.OPEN_LOGIN,
            loginOptionsViewOnLoginSuccess,
            loginOptionsViewOnLoginCancel
        )
})

ipc.on(MSFT_OPCODE.REPLY_LOGIN, (_, ...arguments_) => {
    
    if(launcherSettingsDir_ == ""){
        launcherSettingsDir_ = arguments_[3];
    }
    
    if (arguments_[0] === MSFT_REPLY_TYPE.ERROR) {

        const viewOnClose = arguments_[2]
        console.log(arguments_)
        
    } else if(arguments_[0] === MSFT_REPLY_TYPE.SUCCESS) {
        const queryMap = arguments_[1]
        const viewOnClose = arguments_[2]

        // Error from request to Microsoft.
        if (Object.prototype.hasOwnProperty.call(queryMap, 'error')) {
            // TODO Dont know what these errors are. Just show them I guess.
            // This is probably if you messed up the app registration with Azure.      
            let error = queryMap.error // Error might be 'access_denied' ?
            let errorDesc = queryMap.error_description
            console.log('Error getting authCode, is Azure application registered correctly?')
            console.log(error)
            console.log(errorDesc)
            console.log('Full query map: ', queryMap)
        } 
        else {

            console.log('Acquired authCode, proceeding with authentication.')

            const authCode = queryMap.code
            addMicrosoftAccount(authCode).then(value => {
                ipc.send('loadLauncherPage');
            }).catch((displayableError) => {
                console.log(displayableError);
            }) 
        }
    }
})

const AUTH_MODE = { FULL: 0, MS_REFRESH: 1, MC_REFRESH: 2 }

function microsoftErrorDisplayable(errorCode) {
    switch (errorCode) {
        case MicrosoftErrorCode.NO_PROFILE:
            return {
                title: 'Error During Login : Profile Not Set Up',
                desc: 'Your Microsoft account does not yet have a Minecraft profile set up. If you have recently purchased the game or redeemed it through Xbox Game Pass, you have to set up your profile on <a href=\"https://minecraft.net/\">Minecraft.net</a>.<br><br>If you have not yet purchased the game, you can also do that on <a href=\"https://minecraft.net/\">Minecraft.net</a>.'
            }
        case MicrosoftErrorCode.NO_XBOX_ACCOUNT:
            return {
                title: 'Error During Login : No Xbox Account',
                desc: 'Your Microsoft account has no Xbox account associated with it.'
            }
        case MicrosoftErrorCode.XBL_BANNED:
            return {
                title: 'Error During Login : Xbox Live Unavailable',
                desc: 'Your Microsoft account is from a country where Xbox Live is not available or banned.'
            }
        case MicrosoftErrorCode.UNDER_18:
            return {
                title: 'Error During Login : Parental Approval Required',
                desc: 'Accounts for users under the age of 18 must be added to a Family by an adult.'
            }
        case MicrosoftErrorCode.UNKNOWN:
            return {
                title: 'Unknown Error During Login',
                desc: 'An unknown error has occurred. Please see the console for details.'
            }
    }
}

async function fullMicrosoftAuthFlow(entryCode, authMode) {
    try {
        let accessTokenRaw
        let accessToken
        if(authMode !== AUTH_MODE.MC_REFRESH) {
            const accessTokenResponse = await MicrosoftAuth.getAccessToken(entryCode, authMode === AUTH_MODE.MS_REFRESH, AZURE_CLIENT_ID)
            if(accessTokenResponse.responseStatus === RestResponseStatus.ERROR) {
                return Promise.reject(microsoftErrorDisplayable(accessTokenResponse.microsoftErrorCode))
            }
            accessToken = accessTokenResponse.data
            accessTokenRaw = accessToken.access_token
        } else {
            accessTokenRaw = entryCode
        }
        
        const xblResponse = await MicrosoftAuth.getXBLToken(accessTokenRaw)
        if(xblResponse.responseStatus === RestResponseStatus.ERROR) {
            return Promise.reject(microsoftErrorDisplayable(xblResponse.microsoftErrorCode))
        }
        const xstsResonse = await MicrosoftAuth.getXSTSToken(xblResponse.data)
        if(xstsResonse.responseStatus === RestResponseStatus.ERROR) {
            return Promise.reject(microsoftErrorDisplayable(xstsResonse.microsoftErrorCode))
        }
        const mcTokenResponse = await MicrosoftAuth.getMCAccessToken(xstsResonse.data)
        if(mcTokenResponse.responseStatus === RestResponseStatus.ERROR) {
            return Promise.reject(microsoftErrorDisplayable(mcTokenResponse.microsoftErrorCode))
        }
        const mcProfileResponse = await MicrosoftAuth.getMCProfile(mcTokenResponse.data.access_token)
        if(mcProfileResponse.responseStatus === RestResponseStatus.ERROR) {
            return Promise.reject(microsoftErrorDisplayable(mcProfileResponse.microsoftErrorCode))
        }
        return {
            accessToken,
            accessTokenRaw,
            xbl: xblResponse.data,
            xsts: xstsResonse.data,
            mcToken: mcTokenResponse.data,
            mcProfile: mcProfileResponse.data
        }
    } catch(err) {
        log.error(err)
        return Promise.reject(microsoftErrorDisplayable(MicrosoftErrorCode.UNKNOWN))
    }
}


function calculateExpiryDate(nowMs, epiresInS) {
    return nowMs + ((epiresInS-10)*1000)
}

async function addMicrosoftAccount(authCode) {

    const fullAuth = await fullMicrosoftAuthFlow(authCode, AUTH_MODE.FULL);
    // Advance expiry by 10 seconds to avoid close calls.
    const now = new Date().getTime()

    const ret = addMicrosoftAuthAccount(
        fullAuth.mcProfile.id,
        fullAuth.mcToken.access_token,
        fullAuth.mcProfile.name,
        calculateExpiryDate(now, fullAuth.mcToken.expires_in),
        fullAuth.accessToken.access_token,
        fullAuth.accessToken.refresh_token,
        calculateExpiryDate(now, fullAuth.accessToken.expires_in),
        launcherSettingsDir_
    )

    return ret
}

async function validateSelectedMicrosoftAccount(){
    const fileContent = fs.readFileSync(path.join(launcherSettingsDir,'accounts.json'), 'utf-8');
    const jsonData = JSON.parse(fileContent);
    const current = jsonData.accounts[jsonData.selectedAccount];
    const now = new Date().getTime()
    const mcExpiresAt = current.expiresAt
    const mcExpired = now >= mcExpiresAt

    if(!mcExpired) {
        return true
    }

    // MC token expired. Check MS token.

    const msExpiresAt = current.microsoft.expires_at
    const msExpired = now >= msExpiresAt

    if(msExpired) {
        // MS expired, do full refresh.
        try {
            const res = await fullMicrosoftAuthFlow(current.microsoft.refresh_token, AUTH_MODE.MS_REFRESH)

            updateMicrosoftAuthAccount(
                current.uuid,
                res.mcToken.access_token,
                res.accessToken.access_token,
                res.accessToken.refresh_token,
                calculateExpiryDate(now, res.accessToken.expires_in),
                calculateExpiryDate(now, res.mcToken.expires_in),
                launcherSettingsDir_
            )
            return true
        } catch(err) {
            return false
        }
    } else {
        // Only MC expired, use existing MS token.
        try {
            const res = await fullMicrosoftAuthFlow(current.microsoft.access_token, AUTH_MODE.MC_REFRESH)

            updateMicrosoftAuthAccount(
                current.uuid,
                res.mcToken.access_token,
                current.microsoft.access_token,
                current.microsoft.refresh_token,
                current.microsoft.expires_at,
                calculateExpiryDate(now, res.mcToken.expires_in),
                launcherSettingsDir_
            )
            return true
        }
        catch(err) {
            return false
        }
    }
}

function checkForSelectedAccount(){
    const fileContent = fs.readFileSync(path.join(launcherSettingsDir_,'accounts.json'), 'utf-8');
    const jsonData = JSON.parse(fileContent);

    //One account is selected
    if(jsonData.selectedAccount != ""){
        if(validateSelectedMicrosoftAccount){
            ipc.send('loadLauncherPage');
        }
        else{
            console.log("Encountered error while trying to validate selected account, please login again");
            document.getElementById('loginContainer').style.display = "flex";
            //We show the loginContainer, so that user can login using MS;
        }
    }
    //No account is selected
    else{
        //Some accounts are registered
        if(Object.keys(jsonData.accounts).length != 0){
            document.getElementById('selectAccountContainer').style.display = "block";
            const accountSelectionList = document.getElementById('accountSelectionList');
            for (const key in jsonData.accounts) {
                if (jsonData.accounts.hasOwnProperty(key)) {
                    
                    btncontainer = document.createElement('div');
                    btncontainer.className = "btncontainer";
                    btncontainer.innerHTML = `
                        <button id="account_ms">
                        <img alt="player_head" src="https://mc-heads.net/head/${jsonData.accounts[key].uuid}/50" />
                        <p class="button-text"><b>${jsonData.accounts[key].displayName}</b></p>
                        <svg class="button-icon" width="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23">
                        <path fill="#f35325" d="M1 1h10v10H1z" />
                        <path fill="#81bc06" d="M12 1h10v10H12z" />
                        <path fill="#05a6f0" d="M1 12h10v10H1z" />
                        <path fill="#ffba08" d="M12 12h10v10H12z" />
                        </svg>
                        </button>`;
                    btncontainer.addEventListener('click', () =>{
                        selectAccount(jsonData.accounts[key].uuid);
                    })
                    accountSelectionList.appendChild(btncontainer);
                }
            }
        }
        //No account is registered
        else{
            document.getElementById('loginContainer').style.display = "flex";
            //We show the loginContainer, so that user can login using MS;
        }
    }
}

function selectAccount(uuid){
    const fileContent = fs.readFileSync(path.join(launcherSettingsDir_,'accounts.json'), 'utf-8');
    const jsonData = JSON.parse(fileContent);
    jsonData.selectedAccount = uuid;
    fs.writeFileSync(path.join(launcherSettingsDir_,'accounts.json'), JSON.stringify(jsonData, null, 2));
    ipc.send('loadLauncherPage');
}