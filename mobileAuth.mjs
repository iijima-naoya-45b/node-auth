import { Hono } from 'hono';
import { OAuth2Client } from 'google-auth-library';
import { sign } from 'hono/jwt';
import { JWT_SECRET } from '../config/constants.mjs';

const mobileAuth = new Hono();
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

mobileAuth.post('/google', async (c) => {
    const { id_token } = await c.req.json();

    if (!id_token) {
        return c.json({ error: 'IDトークンが提供されていません' }, 400);
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: id_token,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        const jwtPayload = { userId: payload.sub, email: payload.email };
        const jwtToken = await sign(jwtPayload, JWT_SECRET);

        return c.json({
            message: 'Authentication successful',
            token: jwtToken,
        });
    } catch (error) {
        console.error('IDトークンの検証に失敗しました:', error);
        return c.json({ error: 'Authentication failed' }, 401);
    }
});

export default mobileAuth;
