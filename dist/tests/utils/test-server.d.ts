/// <reference types="node" resolution-mode="require"/>
export class TestServer {
    constructor(options?: {});
    port: any;
    host: any;
    routes: Map<any, any>;
    middleware: any[];
    server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse> | null;
    requestCount: number;
    errorCount: number;
    start(): Promise<any>;
    stop(): Promise<any>;
    addRoute(method: any, path: any, handler: any): void;
    addMiddleware(middleware: any): void;
    handleRequest(req: any, res: any): void;
    sendResponse(res: any, statusCode: any, data: any): void;
    getStats(): {
        requestCount: number;
        errorCount: number;
        uptime: number;
    };
    reset(): void;
}
import http = require("http");
//# sourceMappingURL=test-server.d.ts.map