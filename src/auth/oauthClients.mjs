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
                access_type: 'offline', // リフレッシュトークン取得に必須
                prompt: 'consent', // リフレッシュトークンを確実に取得
                scope: GOOGLE_CONFIG.SCOPES.join(' '),
                include_granted_scopes: true
            });
            return url;
        },
        getToken: async (client, code) => {
            const tokens = (await client.getToken(code)).tokens;
            return { tokenData: tokens, user: null }; // ユーザー情報は別途取得
        },
        getUserInfo: async (client, tokens) => {
            client.setCredentials(tokens);
            const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: GOOGLE_CONFIG.CLIENT_ID });
            const payload = ticket.getPayload();
            return { id: payload.sub, email: payload.email, name: payload.name };
        },
        // リフレッシュトークン更新メソッドを追加
        refreshAccessToken: async (refreshToken) => {
            const client = new google.auth.OAuth2(
                GOOGLE_CONFIG.CLIENT_ID,
                GOOGLE_CONFIG.CLIENT_SECRET,
                GOOGLE_CONFIG.CALLBACK_URL
            );
            client.setCredentials({ refresh_token: refreshToken });
            const { credentials } = await client.refreshAccessToken();
            return credentials;
        }
    },
    line: {
        config: LINE_CONFIG,
        getAuthUrl: () => {
            const url = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CONFIG.CHANNEL_ID}&redirect_uri=${LINE_CONFIG.CALLBACK_URL}&state=your_state&scope=${encodeURIComponent(LINE_CONFIG.SCOPES.join(' '))}`;
            return url;
        },
        getToken: async (code) => {
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
            const idTokenPayload = JSON.parse(Buffer.from(tokenData.id_token.split('.')[1], 'base64').toString());
            return { tokenData, user: { id: idTokenPayload.sub, email: idTokenPayload.email, name: idTokenPayload.name } };
        },
        // LINEにはrefreshAccessTokenメソッドがない
        refreshAccessToken: async (refreshToken) => {
            const response = await fetch('https://api.line.me/oauth2/v2.1/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                    client_id: LINE_CONFIG.CHANNEL_ID,
                    client_secret: LINE_CONFIG.CHANNEL_SECRET
                })
            });
            const credentials = await response.json();
            if (credentials.error) {
                throw new Error(credentials.error_description);
            }
            return credentials;
        }
    },
    github: {
        config: GITHUB_CONFIG,
        getAuthUrl: () => {
            const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CONFIG.CLIENT_ID}&redirect_uri=${GITHUB_CONFIG.CALLBACK_URL}&scope=${encodeURIComponent(GITHUB_CONFIG.SCOPES.join(' '))}`;
            return url;
        },
        getToken: async (code) => {
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
            const userResponse = await fetch('https://api.github.com/user', {
                headers: { 'Authorization': `token ${tokenData.access_token}` }
            });
            const userData = await userResponse.json();
            return { tokenData, user: { id: userData.id, username: userData.login, email: userData.email } };
        },
    },
    twitter: {
        config: TWITTER_CONFIG,
        getAuthUrl: () => {
            const url = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${TWITTER_CONFIG.CLIENT_ID}&redirect_uri=${TWITTER_CONFIG.CALLBACK_URL}&scope=${encodeURIComponent(TWITTER_CONFIG.SCOPES.join(' '))}&state=your_state&code_challenge=challenge&code_challenge_method=plain`;
            return url;
        },
        getToken: async (code) => {
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
            const userResponse = await fetch('https://api.twitter.com/2/users/me', {
                headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
            });
            const userData = await userResponse.json();
            return { tokenData, user: { id: userData.data.id, name: userData.data.name, username: userData.data.username } };
        },
        // TwitterにrefreshAccessTokenメソッドを追加
        refreshAccessToken: async (refreshToken) => {
            // Twitter v2の認証はリフレッシュトークンをサポートする
            const response = await fetch('https://api.twitter.com/2/oauth2/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                    client_id: TWITTER_CONFIG.CLIENT_ID,
                    client_secret: TWITTER_CONFIG.CLIENT_SECRET,
                })
            });
            const credentials = await response.json();
            if (credentials.error) {
                throw new Error(credentials.error_description);
            }
            return credentials;
        }
    },
    facebook: {
        config: FACEBOOK_CONFIG,
        getAuthUrl: () => {
            const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FACEBOOK_CONFIG.CLIENT_ID}&redirect_uri=${FACEBOOK_CONFIG.CALLBACK_URL}&state=your_state&scope=${encodeURIComponent(FACEBOOK_CONFIG.SCOPES.join(','))}`;
            return url;
        },
        getToken: async (code) => {
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
            const userResponse = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${tokenData.access_token}`);
            const userData = await userResponse.json();
            return { tokenData, user: { id: userData.id, name: userData.name, email: userData.email } };
        },
    }
};

export default OAUTH_PROVIDERS;