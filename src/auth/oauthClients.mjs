import { google } from 'googleapis';
import fetch from 'node-fetch';
import { Buffer } from 'node:buffer';
import {
    GOOGLE_CONFIG,
    LINE_CONFIG,
    GITHUB_CONFIG,
    TWITTER_CONFIG,
    FACEBOOK_CONFIG
} from '../config/index.mjs';

const OAUTH_PROVIDERS = {
    google: {
        config: GOOGLE_CONFIG,
        client: new google.auth.OAuth2(
            GOOGLE_CONFIG.CLIENT_ID,
            GOOGLE_CONFIG.CLIENT_SECRET,
            GOOGLE_CONFIG.CALLBACK_URL
        ),
        getAuthUrl: (client) => {
            const url = client.generateAuthUrl({
                access_type: 'offline',
                scope: GOOGLE_CONFIG.SCOPES.join(' '),
                include_granted_scopes: true
            });
            console.log('Google Auth URL:', url);
            return url;
        },
        getToken: async (client, code) => {
            console.log('Google: Getting token');
            const tokens = (await client.getToken(code)).tokens;
            console.log('Google: Token obtained', tokens);
            return tokens;
        },
        getUserInfo: async (client, tokens) => {
            console.log('Google: Getting user info');
            client.setCredentials(tokens);
            const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: GOOGLE_CONFIG.CLIENT_ID });
            const payload = ticket.getPayload();
            console.log('Google: User info obtained', payload);
            return { id: payload.sub, email: payload.email, name: payload.name };
        }
    },
    line: {
        config: LINE_CONFIG,
        getAuthUrl: () => {
            const url = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CONFIG.CHANNEL_ID}&redirect_uri=${LINE_CONFIG.CALLBACK_URL}&state=your_state&scope=${encodeURIComponent(LINE_CONFIG.SCOPES.join(' '))}`;
            console.log('LINE Auth URL:', url);
            return url;
        },
        getToken: async (code) => {
            console.log('LINE: Getting token');
            const response = await fetch('https://api.line.me/oauth2/v2.1/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: LINE_CONFIG.CALLBACK_URL,
                    client_id: LINE_CONFIG.CHANNEL_ID,
                    client_secret: LINE_CONFIG.CHANNEL_SECRET
                })
            });
            const tokenData = await response.json();
            console.log('LINE: Token obtained', tokenData);
            const idTokenPayload = JSON.parse(Buffer.from(tokenData.id_token.split('.')[1], 'base64').toString());
            console.log('LINE: User info obtained', idTokenPayload);
            return { tokenData, user: { id: idTokenPayload.sub, email: idTokenPayload.email, name: idTokenPayload.name } };
        }
    },
    github: {
        config: GITHUB_CONFIG,
        getAuthUrl: () => {
            const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CONFIG.CLIENT_ID}&redirect_uri=${GITHUB_CONFIG.CALLBACK_URL}&scope=${encodeURIComponent(GITHUB_CONFIG.SCOPES.join(' '))}`;
            console.log('GitHub Auth URL:', url);
            return url;
        },
        getToken: async (code) => {
            console.log('GitHub: Getting token');
            const response = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: GITHUB_CONFIG.CLIENT_ID,
                    client_secret: GITHUB_CONFIG.CLIENT_SECRET,
                    code,
                    redirect_uri: GITHUB_CONFIG.CALLBACK_URL
                })
            });
            const tokenData = await response.json();
            console.log('GitHub: Token obtained', tokenData);
            const userResponse = await fetch('https://api.github.com/user', {
                headers: { 'Authorization': `token ${tokenData.access_token}` }
            });
            const userData = await userResponse.json();
            console.log('GitHub: User info obtained', userData);
            return { tokenData, user: { id: userData.id, username: userData.login, email: userData.email } };
        }
    },
    twitter: {
        config: TWITTER_CONFIG,
        getAuthUrl: () => {
            const url = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${TWITTER_CONFIG.CLIENT_ID}&redirect_uri=${TWITTER_CONFIG.CALLBACK_URL}&scope=${encodeURIComponent(TWITTER_CONFIG.SCOPES.join(' '))}&state=your_state&code_challenge=challenge&code_challenge_method=plain`;
            console.log('Twitter Auth URL:', url);
            return url;
        },
        getToken: async (code) => {
            console.log('Twitter: Getting token');
            const response = await fetch('https://api.twitter.com/2/oauth2/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: TWITTER_CONFIG.CALLBACK_URL,
                    client_id: TWITTER_CONFIG.CLIENT_ID,
                    code_verifier: 'challenge' // 簡略化のため固定値を使用
                })
            });
            const tokenData = await response.json();
            console.log('Twitter: Token obtained', tokenData);
            const userResponse = await fetch('https://api.twitter.com/2/users/me', {
                headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
            });
            const userData = await userResponse.json();
            console.log('Twitter: User info obtained', userData);
            return { tokenData, user: { id: userData.data.id, name: userData.data.name, username: userData.data.username } };
        }
    },
    facebook: {
        config: FACEBOOK_CONFIG,
        getAuthUrl: () => {
            const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FACEBOOK_CONFIG.CLIENT_ID}&redirect_uri=${FACEBOOK_CONFIG.CALLBACK_URL}&state=your_state&scope=${encodeURIComponent(FACEBOOK_CONFIG.SCOPES.join(','))}`;
            console.log('Facebook Auth URL:', url);
            return url;
        },
        getToken: async (code) => {
            console.log('Facebook: Getting token');
            const response = await fetch('https://graph.facebook.com/v19.0/oauth/access_token', {
                method: 'GET',
                params: {
                    client_id: FACEBOOK_CONFIG.CLIENT_ID,
                    client_secret: FACEBOOK_CONFIG.CLIENT_SECRET,
                    redirect_uri: FACEBOOK_CONFIG.CALLBACK_URL,
                    code,
                }
            });
            const tokenData = await response.json();
            console.log('Facebook: Token obtained', tokenData);
            const userResponse = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${tokenData.access_token}`);
            const userData = await userResponse.json();
            console.log('Facebook: User info obtained', userData);
            return { tokenData, user: { id: userData.id, name: userData.name, email: userData.email } };
        }
    }
};

export default OAUTH_PROVIDERS;