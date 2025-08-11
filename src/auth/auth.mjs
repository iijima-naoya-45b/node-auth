import { sign, verify } from 'hono/jwt';
import { OAuth2Client } from 'google-auth-library';
import { JWT_SECRET, FRONTEND_URL } from '../config/constants.mjs';
import OAUTH_PROVIDERS from './oauthClients.mjs';
// import { sendUserDataToRails } from './railsIntegration.mjs';
import { parseCookies } from './utils.mjs';

// --- 共通ミドルウェアとエンドポイント ---
export const ensureAuthenticated = async (c, next) => {
    const token = c.req.header('Authorization')?.split(' ')[1] || parseCookies(c.req.header('Cookie'))['jwt'];
    if (!token) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    try {
        const decoded = await verify(token, JWT_SECRET);
        c.set('jwtPayload', decoded);
        await next();
    } catch (error) {
        console.error('JWT検証エラー:', error);
        return c.json({ error: 'Unauthorized' }, 401);
    }
};

export const checkAuthStatus = async (c) => {
    const token = c.req.header('Authorization')?.split(' ')[1] || parseCookies(c.req.header('Cookie'))['jwt'];
    if (!token) {
        return c.json({ authenticated: false }, 401);
    }
    try {
        await verify(token, JWT_SECRET);
        return c.json({ authenticated: true });
    } catch (error) {
        return c.json({ authenticated: false }, 401);
    }
};

// --- Web認証フローの処理 ---
export const redirectToProvider = (providerName) => (c) => {
    const provider = OAUTH_PROVIDERS[providerName];
    if (!provider) {
        return c.json({ error: 'Provider not found' }, 400);
    }
    const authorizationUrl = provider.getAuthUrl(provider.client);
    return c.redirect(authorizationUrl);
};

export const handleCallback = (providerName) => async (c) => {
    const code = c.req.query('code');
    if (!code) {
        return c.json({ error: 'Authorization code not found' }, 400);
    }
    const provider = OAUTH_PROVIDERS[providerName];
    try {
        let tokenData, user;
        if (providerName === 'google') {
            tokenData = await provider.getToken(provider.client, code);
            user = await provider.getUserInfo(provider.client, tokenData);
        } else {
            const result = await provider.getToken(code);
            tokenData = result.tokenData;
            user = result.user;
        }

        const jwtPayload = { user: user, oauth_tokens: tokenData };
        const jwtToken = await sign(jwtPayload, JWT_SECRET);

        // await sendUserDataToRails(user, jwtToken);

        c.res.headers.set('Set-Cookie', `jwt=${jwtToken}; Path=/; HttpOnly; SameSite=Strict`);
        return c.redirect(`${FRONTEND_URL}`);
    } catch (error) {
        console.error(`${providerName} OAuthエラー:`, error);
        return c.json({ error: 'Authentication failed' }, 500);
    }
};

const googleClient = new OAuth2Client();

export const handleMobileAuth = async (c) => {
    const { providerName, token, clientId } = await c.req.json();

    console.log('Received mobile auth request:', { providerName, token, clientId });

    if (!providerName || !token || !clientId) {
        return c.json({ error: 'プロバイダー名、トークン、またはクライアントIDが提供されていません' }, 400);
    }

    let user;

    try {
        switch (providerName) {
            case 'google':
                const ticket = await googleClient.verifyIdToken({
                    idToken: token,
                    audience: clientId,
                });
                const payload = ticket.getPayload();
                user = { id: payload.sub, email: payload.email, name: payload.name };
                break;
            default:
                return c.json({ error: 'サポートされていないプロバイダーです' }, 400);
        }

        const jwtPayload = { user: user, oauth_tokens: null };
        const jwtToken = await sign(jwtPayload, JWT_SECRET);

        // await sendUserDataToRails(user, jwtToken);

        // keyChain返却
        return c.json({
            message: 'Authentication successful',
            token: jwtToken,
            user: user,
        });
    } catch (error) {
        console.error(`${providerName}認証エラー:`, error);
        return c.json({ error: 'Authentication failed' }, 401);
    }
};