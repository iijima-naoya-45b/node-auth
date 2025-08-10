import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { setupRoutes } from './routes/index.mjs';
import { SERVER_PORT, SERVER_HOST } from './config/index.mjs';

const app = new Hono();
setupRoutes(app);

serve({
    fetch: app.fetch,
    port: SERVER_PORT,
    hostname: SERVER_HOST,
});

export default app;