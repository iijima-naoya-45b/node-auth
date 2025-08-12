import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { setupRoutes } from './routes/index.mjs';
import { SERVER_PORT, SERVER_HOST } from './config/index.mjs';
import { cors } from 'hono/cors';
import { FRONTEND_URL } from './config/constants.mjs';

const app = new Hono();

app.use(
    cors({
        origin: FRONTEND_URL,
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Authorization', 'Content-Type'],
        credentials: true,
    })
);

setupRoutes(app);

serve({
    fetch: app.fetch,
    port: SERVER_PORT,
    hostname: SERVER_HOST,
});

export default app;