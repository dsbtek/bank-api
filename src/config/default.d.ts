declare const _default: {
    port: string | number;
    env: string;
    mongodb: {
        uri: string;
        options: {
            maxPoolSize: number;
            serverSelectionTimeoutMS: number;
            socketTimeoutMS: number;
        };
    };
    redis: {
        host: string;
        port: number;
        password: string | undefined;
    };
    jwt: {
        secret: string;
        accessExpiry: string;
        refreshExpiry: string;
    };
    rateLimit: {
        windowMs: number;
        max: number;
        transferWindowMs: number;
        transferMax: number;
    };
    security: {
        bcryptRounds: number;
        maxLoginAttempts: number;
        lockoutTime: number;
    };
    swagger: {
        definition: {
            openapi: string;
            info: {
                title: string;
                version: string;
                description: string;
            };
            servers: {
                url: string;
                description: string;
            }[];
        };
        apis: string[];
    };
};
export default _default;
//# sourceMappingURL=default.d.ts.map