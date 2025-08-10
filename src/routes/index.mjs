// src/routes.mjs
import { ensureAuthenticated, checkAuthStatus } from '../auth/auth.mjs';
import { webRedirectToProvider, webHandleCallback } from '../auth/webAuth.mjs';
import { mobileRedirectToProvider, mobileHandleCallback } from '../auth/mobileAuth.mjs';

export const setupRoutes = (app) => {
    // 共通認証ルート
    app.get('/auth/status', checkAuthStatus);
    app.get('/api/data', ensureAuthenticated, (c) => {
        const jwtPayload = c.get('jwtPayload');
        return c.json({ message: `Protected Data for user: ${jwtPayload.user.name}` });
    });

    // Web認証ルート
    const webAuthRoutes = [
        { provider: 'google', path: '/auth/web/google' },
        { provider: 'line', path: '/auth/web/line' },
        { provider: 'github', path: '/auth/web/github' }
    ];
    webAuthRoutes.map(({ provider, path }) => {
        app.get(`${path}`, webRedirectToProvider(provider));
        app.get(`${path}/callback`, webHandleCallback(provider));
    });

    // Mobile認証ルート
    const mobileAuthRoutes = [
        { provider: 'google', path: '/auth/mobile/google' },
        { provider: 'line', path: '/auth/mobile/line' },
        { provider: 'github', path: '/auth/mobile/github' }
    ];
    mobileAuthRoutes.map(({ provider, path }) => {
        app.get(`${path}`, mobileRedirectToProvider(provider));
        app.get(`${path}/callback`, mobileHandleCallback(provider));
    });
};