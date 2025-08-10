import { redirectToProvider, handleCallback } from './auth.mjs';

export const webRedirectToProvider = redirectToProvider;
export const webHandleCallback = (providerName) => handleCallback(providerName, true);