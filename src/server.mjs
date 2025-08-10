import { serve } from '@hono/node-server';
import app from './app.mjs';
import { cors } from 'hono/cors';
import { FE_LOCALHOST, SERVER_PORT, FE_DOMAIN } from './config/constants.mjs';

app.use(
    cors({
        origin: [FE_LOCALHOST, FE_DOMAIN],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Authorization', 'Content-Type'],
    })
);

serve(
    {
        fetch: app.fetch,
        port: SERVER_PORT,
    }
);