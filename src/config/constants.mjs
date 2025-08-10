// JWT
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
// Google
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
export const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;
// LINE
export const LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID;
export const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
export const LINE_CALLBACK_URL = process.env.LINE_CALLBACK_URL;
// GitHub
export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
export const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL;
// サーバー設定
export const SERVER_PORT = process.env.SERVER_PORT;
export const SERVER_HOST = process.env.SERVER_HOST;
export const FE_LOCALHOST = process.env.FE_LOCALHOST;
export const FE_DOMAIN = process.env.FE_DOMAIN;
export const RAILS_LOCALHOST = process.env.RAILS_LOCALHOST;
export const RAILS_DOMAIN = process.env.RAILS_DOMAIN;
// 認証スコープの設定
export const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
];