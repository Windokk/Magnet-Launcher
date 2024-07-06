const fs = require('fs');
const path = require('path');

function addMicrosoftAuthAccount(uuid, accessToken, name, mcExpires, msAccessToken, msRefreshToken, msExpires, launcherSettingsDir) {

    const fileContent = fs.readFileSync(path.join(launcherSettingsDir,'accounts.json'), 'utf-8');
    const jsonData = JSON.parse(fileContent);
    
    jsonData.selectedAccount = uuid;
    jsonData.accounts[uuid] = {
        type: 'microsoft',
        accessToken,
        username: name.trim(),
        uuid: uuid.trim(),
        displayName: name.trim(),
        expiresAt: mcExpires,
        microsoft: {
            access_token: msAccessToken,
            refresh_token: msRefreshToken,
            expires_at: msExpires
        }
    }
    fs.writeFileSync(path.join(launcherSettingsDir,'accounts.json'), JSON.stringify(jsonData, null, 2));
    return jsonData.accounts[uuid];
}

function updateMicrosoftAuthAccount(uuid, accessToken, msAccessToken, msRefreshToken, msExpires, mcExpires, launcherSettingsDir){
    
    const fileContent = fs.readFileSync(path.join(launcherSettingsDir,'accounts.json'), 'utf-8');
    const jsonData = JSON.parse(fileContent);
    
    jsonData.accounts[uuid].accessToken = accessToken;
    jsonData.accounts[uuid].expiresAt = mcExpires;
    jsonData.accounts[uuid].microsoft.access_token = msAccessToken;
    jsonData.accounts[uuid].microsoft.refresh_token = msRefreshToken;
    jsonData.accounts[uuid].microsoft.expires_at = msExpires;

    fs.writeFileSync(path.join(launcherSettingsDir,'accounts.json'), JSON.stringify(jsonData, null, 2));

    return jsonData.accounts[uuid];
}

function getSelectedAccessToken(launcherSettingsDir){
    const fileContent = fs.readFileSync(path.join(launcherSettingsDir,'accounts.json'), 'utf-8');
    const jsonData = JSON.parse(fileContent);
    return jsonData.accounts[jsonData.selectedAccount].accessToken;
}

module.exports = { addMicrosoftAuthAccount, updateMicrosoftAuthAccount, getSelectedAccessToken };