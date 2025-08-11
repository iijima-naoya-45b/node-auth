import { serve } from '@hono/node-server';
import app from './app.mjs';
import { cors } from 'hono/cors';
import { FRONTEND_URL, SERVER_PORT } from './config/constants.mjs';

app.use(
    cors({
        origin: FRONTEND_URL,
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