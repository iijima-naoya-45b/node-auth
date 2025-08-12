import { serve } from '@hono/node-server';
import app from './app.mjs';
import { SERVER_PORT } from './config/constants.mjs';



serve(
    {
        fetch: app.fetch,
        port: SERVER_PORT,
    }
);