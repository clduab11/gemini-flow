/**
 * Test Server Utility
 * Provides a lightweight test server for integration testing
 */
const http = require('http');
const url = require('url');
class TestServer {
    constructor(options = {}) {
        this.port = options.port || 3001;
        this.host = options.host || 'localhost';
        this.routes = new Map();
        this.middleware = [];
        this.server = null;
        this.requestCount = 0;
        this.errorCount = 0;
    }
    async start() {
        return new Promise((resolve, reject) => {
            this.server = http.createServer((req, res) => {
                this.handleRequest(req, res);
            });
            this.server.listen(this.port, this.host, (error) => {
                if (error) {
                    reject(error);
                }
                else {
                    console.log(`Test server running on http://${this.host}:${this.port}`);
                    resolve();
                }
            });
        });
    }
    async stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    console.log('Test server stopped');
                    resolve();
                });
            }
            else {
                resolve();
            }
        });
    }
    addRoute(method, path, handler) {
        const key = `${method.toUpperCase()}:${path}`;
        this.routes.set(key, handler);
    }
    addMiddleware(middleware) {
        this.middleware.push(middleware);
    }
    handleRequest(req, res) {
        this.requestCount++;
        try {
            // Apply middleware
            for (const middleware of this.middleware) {
                middleware(req, res);
            }
            const parsedUrl = url.parse(req.url, true);
            const key = `${req.method}:${parsedUrl.pathname}`;
            if (this.routes.has(key)) {
                const handler = this.routes.get(key);
                handler(req, res);
            }
            else {
                this.sendResponse(res, 404, { error: 'Not found' });
            }
        }
        catch (error) {
            this.errorCount++;
            this.sendResponse(res, 500, { error: 'Internal server error' });
        }
    }
    sendResponse(res, statusCode, data) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    }
    getStats() {
        return {
            requestCount: this.requestCount,
            errorCount: this.errorCount,
            uptime: process.uptime()
        };
    }
    reset() {
        this.requestCount = 0;
        this.errorCount = 0;
    }
}
module.exports = { TestServer };
export {};
//# sourceMappingURL=test-server.js.map