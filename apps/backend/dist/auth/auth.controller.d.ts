import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    azureLogin(loginDto: {
        azureAdObjectId: string;
        email: string;
        firstName?: string;
        lastName?: string;
    }): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import("../users/entities/user.entity").UserRole;
        };
    }>;
    getProfile(req: any): Promise<any>;
    verifyToken(body: {
        token: string;
    }): Promise<{
        valid: boolean;
        payload: any;
    }>;
}
