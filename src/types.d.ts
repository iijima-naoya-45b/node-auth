import { HonoRequest } from 'hono';
import { JwtPayload } from 'jsonwebtoken';

// Extend HonoRequest to include custom properties
interface CustomHonoRequest extends HonoRequest {
    user?: JwtPayload; // Add user property for authenticated user data
}

declare module 'hono' {
    interface Context {
        req: CustomHonoRequest;
    }
} 