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

// provider別の認証管理
export const handleCallback = (providerName) => async (c) => {
    const code = c.req.query('code');
    if (!code) {
        return c.json({ error: 'Authorization code not found' }, 400);
    }
    const provider = OAUTH_PROVIDERS[providerName];
    if (!provider) {
        return c.json({ error: 'Provider not found' }, 400);
    }
    try {
        let tokenData, user;
        let exp;

        switch (providerName) {
            case 'google':
                const tokens = await provider.getToken(provider.client, code);
                tokenData = tokens.tokenData;
                user = await provider.getUserInfo(provider.client, tokenData);
                const decodedIdToken = JSON.parse(Buffer.from(tokenData.id_token.split('.')[1], 'base64').toString());
                exp = decodedIdToken.exp;
                break;
            case 'line':
            case 'github':
            case 'twitter':
            case 'facebook':
                const result = await provider.getToken(code);
                tokenData = result.tokenData;
                user = result.user;
                exp = Math.floor(Date.now() / 1000) + (tokenData.expires_in || 3600);
                break;
            default:
                return c.json({ error: 'Unsupported provider' }, 400);
        }

        const jwtPayload = {
            user: user,
            providerName,
            accessToken: tokenData.access_token,
            // refreshToken: tokenData.refresh_token,
            exp: exp,
        };
        if (tokenData.refresh_token) {
            jwtPayload.refreshToken = tokenData.refresh_token;
        }
        const jwtToken = await sign(jwtPayload, JWT_SECRET);

        c.res.headers.set('Set-Cookie', `jwt=${jwtToken}; Path=/; HttpOnly; SameSite=Strict`);
        return c.redirect(`${FRONTEND_URL}`);
    } catch (error) {
        console.error(`${providerName} OAuthエラー:`, error);
        return c.json({ error: 'Authentication failed' }, 500);
    }
};

export const refreshAccessToken = async (c) => {
    const token =
        c.req.header('Authorization')?.split(' ')[1] ||
        parseCookies(c.req.header('Cookie'))['jwt'];

    if (!token) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
        const decoded = await verify(token, JWT_SECRET);
        const { refreshToken, user, providerName } = decoded;
        const provider = OAUTH_PROVIDERS[providerName];

        if (!refreshToken || !providerName || !provider || !provider.refreshAccessToken) {
            return c.json({ accessToken: decoded.accessToken });
        }

        // accessToken更新処理
        const tokenData = await provider.refreshAccessToken(refreshToken);

        const newRefreshToken = tokenData.refresh_token || refreshToken;
        const newAccessToken = tokenData.access_token;

        const newJwtPayload = {
            user,
            providerName,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            exp: Math.floor(Date.now() / 1000) + (tokenData.expires_in || 3600),
        };
        const newJwtToken = await sign(newJwtPayload, JWT_SECRET);

        // Cookie を更新
        c.res.headers.set(
            'Set-Cookie',
            `jwt=${newJwtToken}; Path=/; HttpOnly; SameSite=Strict`
        );

        return c.json({ accessToken: tokenData.access_token });
    } catch (error) {
        console.error('Error refreshing access token:', error);
        return c.json({ error: 'Could not refresh access token' }, 401);
    }
};

const googleClient = new OAuth2Client();

export const handleMobileAuth = async (c) => {
    const { providerName, token, clientId } = await c.req.json();

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