// --- 共通ユーティリティ関数 ---
export const parseCookies = (cookieHeader) => {
    const cookies = {};
    if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
            const [name, ...rest] = cookie.split('=');
            cookies[name.trim()] = rest.join('=').trim();
        });
    }
    return cookies;
};
