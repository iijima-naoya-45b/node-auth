import fetch from 'node-fetch';
import { describe, it, expect, vi } from 'vitest';
import { sendUserDataToRails } from '../src/auth/railsIntegration.mjs';

vi.mock('node-fetch', () => ({
    default: vi.fn()
}));

describe('sendUserDataToRails', () => {
    it('should send user data to Rails API and receive a success response', async () => {
        const fetchMock = vi.mocked(fetch);

        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ success: true })
        });

        const user = { id: '123', name: 'Test User' };
        const jwtToken = 'mock_jwt_token';

        const result = await sendUserDataToRails(user, jwtToken);

        expect(result).toEqual({ success: true });
    });

    it('should handle errors from Rails API', async () => {
        const fetchMock = vi.mocked(fetch);

        fetchMock.mockResolvedValueOnce({
            ok: false,
            statusText: 'Internal Server Error'
        });

        const user = { id: '123', name: 'Test User' };
        const jwtToken = 'mock_jwt_token';

        await expect(sendUserDataToRails(user, jwtToken))
            .rejects
            .toThrow('Rails API error: Internal Server Error');
    });
});
