import fetch from 'node-fetch';
import { RAILS_URL } from '../config/constants.mjs';

export const sendUserDataToRails = async (user, jwtToken) => {
    try {
        const response = await fetch(`${RAILS_URL}/api/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify({ user })
        });

        if (!response.ok) {
            throw new Error(`Rails API error: ${response.statusText}`);
        }

        const result = await response.json();
        return result
    } catch (error) {
        console.error('Error sending data to Rails API:', error);
        throw error;
    }
};