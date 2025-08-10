import { describe, it, expect } from 'vitest';
import { vi } from 'vitest';
import { checkAuthStatus } from '../src/auth/auth.mjs';

const mockValidToken = 'mock_valid_token';
const mockInvalidToken = 'mock_invalid_token';

// mock化
vi.mock('hono/jwt', () => ({
    verify: vi.fn((token) => {
        if (token === mockValidToken) {
            return Promise.resolve({ user: 'test-user' });
        }
        return Promise.reject(new Error('Invalid token'));
    }),
}));

const createMockContext = (headers = {}, cookies = {}) => {
    return {
        req: {
            header: vi.fn((name) => {
                if (name === 'Authorization') {
                    return headers.Authorization;
                }
                if (name === 'Cookie') {
                    return Object.entries(cookies)
                        .map(([key, value]) => `${key}=${value}`)
                        .join('; ');
                }
                return null;
            }),
        },
        json: vi.fn(),
    };
};

// --- テストスイート ---
describe('checkAuthStatus', () => {

    it('should return authenticated false if no token is provided', async () => {
        const c = createMockContext();
        await checkAuthStatus(c);
        expect(c.json).toHaveBeenCalledWith({ authenticated: false }, 401);
    });

    it('should return authenticated true with a valid Authorization header', async () => {
        const c = createMockContext({ Authorization: `Bearer ${mockValidToken}` });
        await checkAuthStatus(c);
        expect(c.json).toHaveBeenCalledWith({ authenticated: true });
    });

    it('should return authenticated true with a valid JWT cookie', async () => {
        const c = createMockContext({}, { jwt: mockValidToken });
        await checkAuthStatus(c);
        expect(c.json).toHaveBeenCalledWith({ authenticated: true });
    });

    it('should return authenticated false with an invalid token', async () => {
        const c = createMockContext({ Authorization: `Bearer ${mockInvalidToken}` });
        await checkAuthStatus(c);
        expect(c.json).toHaveBeenCalledWith({ authenticated: false }, 401);
    });

    it('should return authenticated false with an invalid cookie', async () => {
        const c = createMockContext({}, { jwt: mockInvalidToken });
        await checkAuthStatus(c);
        expect(c.json).toHaveBeenCalledWith({ authenticated: false }, 401);
    });

});