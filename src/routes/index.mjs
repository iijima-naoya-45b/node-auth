import {
    ensureAuthenticated,
    checkAuthStatus,
    redirectToProvider,
    handleCallback,
    handleMobileAuth
} from '../auth/auth.mjs';

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
        app.get(`${path}`, redirectToProvider(provider));
        app.get(`${path}/callback`, handleCallback(provider));
    });

    // mobile認証ルート
    app.post('/auth/mobile', handleMobileAuth);
};