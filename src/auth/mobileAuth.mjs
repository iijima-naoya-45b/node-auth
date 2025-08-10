import { redirectToProvider, handleCallback } from './auth.mjs';

export const mobileRedirectToProvider = redirectToProvider;
export const mobileHandleCallback = (providerName) => handleCallback(providerName, false);