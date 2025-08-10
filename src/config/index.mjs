// JWTシークレットキー
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
// サーバー設定
export const SERVER_PORT = process.env.SERVER_PORT || 3001;
export const SERVER_HOST = process.env.SERVER_HOST || 'localhost';

// Google
export const GOOGLE_CONFIG = {
    CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
    SCOPES: ['openid', 'email', 'profile'],
};

// LINE
export const LINE_CONFIG = {
    CHANNEL_ID: process.env.LINE_CHANNEL_ID,
    CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET,
    CALLBACK_URL: process.env.LINE_CALLBACK_URL,
    SCOPES: ['profile', 'openid', 'email'],
};

// GitHub
export const GITHUB_CONFIG = {
    CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    CALLBACK_URL: process.env.GITHUB_CALLBACK_URL,
    SCOPES: ['read:user', 'user:email'],
};

// Twitter
export const TWITTER_CONFIG = {
    CLIENT_ID: process.env.TWITTER_CLIENT_ID,
    CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET,
    CALLBACK_URL: process.env.TWITTER_CALLBACK_URL,
    // Twitter v2 APIのスコープ
    SCOPES: ['users.read', 'tweet.read', 'offline.access'],
};

// Facebook
export const FACEBOOK_CONFIG = {
    CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
    CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
    CALLBACK_URL: process.env.FACEBOOK_CALLBACK_URL,
    // Facebookのスコープ
    SCOPES: ['email', 'public_profile'],
};