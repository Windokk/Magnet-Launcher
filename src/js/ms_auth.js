const got = require('got'); // Assuming got is being used as HTTP client

const RestResponseStatus = {
    SUCCESS: 'SUCCESS',
    ERROR: 'ERROR'
};

const MicrosoftAuth = {
    TIMEOUT: 2500,

    TOKEN_ENDPOINT: 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token',
    XBL_AUTH_ENDPOINT: 'https://user.auth.xboxlive.com/user/authenticate',
    XSTS_AUTH_ENDPOINT: 'https://xsts.auth.xboxlive.com/xsts/authorize',
    MC_AUTH_ENDPOINT: 'https://api.minecraftservices.com/authentication/login_with_xbox',
    MC_ENTITLEMENT_ENDPOINT: 'https://api.minecraftservices.com/entitlements/mcstore',
    MC_PROFILE_ENDPOINT: 'https://api.minecraftservices.com/minecraft/profile',

    STANDARD_HEADERS: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
    },

    handleGotError: function (operation, error, dataProvider) {
        const response = handleGotError(operation, error, console, dataProvider);

        if (error instanceof got.HTTPError) {
            if (error.response.statusCode === 404 && error.request.requestUrl === MicrosoftAuth.MC_PROFILE_ENDPOINT) {
                response.microsoftErrorCode = 'NO_PROFILE';
            } else {
                response.microsoftErrorCode = decipherErrorCode(error.response.body);
            }
        } else {
            response.microsoftErrorCode = 'UNKNOWN';
        }

        return response;
    },

    getAccessToken: async function (code, refresh, clientId) {
        try {
            const BASE_FORM = {
                client_id: clientId,
                scope: 'XboxLive.signin',
                redirect_uri: 'https://login.microsoftonline.com/common/oauth2/nativeclient',
            };

            let form;
            if (refresh) {
                form = {
                    ...BASE_FORM,
                    refresh_token: code,
                    grant_type: 'refresh_token'
                };
            } else {
                form = {
                    ...BASE_FORM,
                    code: code,
                    grant_type: 'authorization_code'
                };
            }

            const res = await got.post(this.TOKEN_ENDPOINT, {
                form,
                responseType: 'json'
            });

            return {
                data: res.body,
                responseStatus: 'SUCCESS'
            };

        } catch (error) {
            return MicrosoftAuth.handleGotError(`Get ${refresh ? 'Refresh' : 'Auth'} Token`, error, () => null);
        }
    },

    getXBLToken: async function (accessToken) {
        try {
            const res = await got.post(this.XBL_AUTH_ENDPOINT, {
                json: {
                    Properties: {
                        AuthMethod: 'RPS',
                        SiteName: 'user.auth.xboxlive.com',
                        RpsTicket: `d=${accessToken}`
                    },
                    RelyingParty: 'http://auth.xboxlive.com',
                    TokenType: 'JWT'
                },
                headers: MicrosoftAuth.STANDARD_HEADERS,
                responseType: 'json'
            });

            return {
                data: res.body,
                responseStatus: 'SUCCESS'
            };

        } catch (error) {
            return MicrosoftAuth.handleGotError('Get XBL Token', error, () => null);
        }
    },

    getXSTSToken: async function (xblResponse) {
        try {
            const res = await got.post(this.XSTS_AUTH_ENDPOINT, {
                json: {
                    Properties: {
                        SandboxId: 'RETAIL',
                        UserTokens: [xblResponse.Token]
                    },
                    RelyingParty: 'rp://api.minecraftservices.com/',
                    TokenType: 'JWT'
                },
                headers: MicrosoftAuth.STANDARD_HEADERS,
                responseType: 'json'
            });

            return {
                data: res.body,
                responseStatus: 'SUCCESS'
            };

        } catch (error) {
            return MicrosoftAuth.handleGotError('Get XSTS Token', error, () => null);
        }
    },

    getMCAccessToken: async function (xstsResponse) {
        try {
            const res = await got.post(this.MC_AUTH_ENDPOINT, {
                json: {
                    identityToken: `XBL3.0 x=${xstsResponse.DisplayClaims.xui[0].uhs};${xstsResponse.Token}`
                },
                headers: MicrosoftAuth.STANDARD_HEADERS,
                responseType: 'json'
            });

            return {
                data: res.body,
                responseStatus: 'SUCCESS'
            };

        } catch (error) {
            return MicrosoftAuth.handleGotError('Get MC Access Token', error, () => null);
        }
    },

    getMCProfile: async function (mcAccessToken) {
        try {
            const res = await got.get(this.MC_PROFILE_ENDPOINT, {
                headers: {
                    Authorization: `Bearer ${mcAccessToken}`
                },
                responseType: 'json'
            });

            return {
                data: res.body,
                responseStatus: 'SUCCESS'
            };

        } catch (error) {
            return MicrosoftAuth.handleGotError('Get MC Profile', error, () => null);
        }
    }
};

// Export the module
module.exports = { MicrosoftAuth, RestResponseStatus };

// Helper functions
function handleGotError(operation, error, logger, dataProvider) {
    logger.error(`Error during ${operation}:`, error.message);
    return {
        data: dataProvider(),
        responseStatus: 'FAILURE'
    };
}

function decipherErrorCode(responseBody) {
    // Implementation for deciphering the error code from the response body
    return 'UNKNOWN_ERROR';
}