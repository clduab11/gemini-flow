/**
 * SQLite Adapter Implementations
 * 
 * Provides unified interface for better-sqlite3, sqlite3, and sql.js
 * with graceful fallback and consistent API
 */

import { Logger } from '../utils/logger.js';

export interface DatabaseAdapter {
  init(dbPath: string): Promise<void>;
  exec(sql: string): void;
  prepare(sql: string): PreparedStatement;
  close(): Promise<void>;
  isOpen(): boolean;
  getImplementation(): string;
}

export interface PreparedStatement {
  run(...params: any[]): { changes: number; lastInsertRowid?: number | bigint } | Promise<{ changes: number; lastInsertRowid?: number | bigint }>;
  get(...params: any[]): any | Promise<any>;
  all(...params: any[]): any[] | Promise<any[]>;
}

/**
 * Better-SQLite3 Adapter (Highest Performance)
 */
export class BetterSQLite3Adapter implements DatabaseAdapter {
  private db: any;
  private logger: Logger;
  private _isOpen = false;

  constructor() {
    this.logger = new Logger('BetterSQLite3Adapter');
  }

  async init(dbPath: string): Promise<void> {
    try {
      const Database = await import('better-sqlite3');
      this.db = new Database.default(dbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this._isOpen = true;
      this.logger.info(`✅ better-sqlite3 initialized: ${dbPath}`);
    } catch (error) {
      this.logger.error(`❌ better-sqlite3 initialization failed: ${error.message}`);
      throw error;
    }
  }

  exec(sql: string): void {
    if (!this._isOpen) throw new Error('Database not initialized');
    this.db.exec(sql);
  }

  prepare(sql: string): PreparedStatement {
    if (!this._isOpen) throw new Error('Database not initialized');
    const stmt = this.db.prepare(sql);
    
    return {
      run: (...params: any[]) => {
        const result = stmt.run(...params);
        return {
          changes: result.changes,
          lastInsertRowid: typeof result.lastInsertRowid === 'bigint' 
            ? Number(result.lastInsertRowid) 
            : result.lastInsertRowid
        };
      },
      get: (...params: any[]) => stmt.get(...params),
      all: (...params: any[]) => stmt.all(...params)
    };
  }

  async close(): Promise<void> {
    if (this.db && this._isOpen) {
      this.db.close();
      this._isOpen = false;
      this.logger.info('better-sqlite3 database closed');
    }
  }

  isOpen(): boolean {
    return this._isOpen;
  }

  getImplementation(): string {
    return 'better-sqlite3';
  }
}

/**
 * SQLite3 Adapter (Promise-wrapped, Medium Performance)
 */
export class SQLite3Adapter implements DatabaseAdapter {
  private db: any;
  private logger: Logger;
  private _isOpen = false;

  constructor() {
    this.logger = new Logger('SQLite3Adapter');
  }

  async init(dbPath: string): Promise<void> {
    try {
      const sqlite3 = await import('sqlite3');
      const Database = sqlite3.default.Database;
      
      this.db = await new Promise((resolve, reject) => {
        const db = new Database(dbPath, (err) => {
          if (err) reject(err);
          else resolve(db);
        });
      });
      
      // Enable WAL mode for better concurrency
      await this.execAsync('PRAGMA journal_mode = WAL');
      await this.execAsync('PRAGMA synchronous = NORMAL');
      
      this._isOpen = true;
      this.logger.info(`✅ sqlite3 initialized: ${dbPath}`);
    } catch (error) {
      this.logger.error(`❌ sqlite3 initialization failed: ${error.message}`);
      throw error;
    }
  }

  exec(sql: string): void {
    if (!this._isOpen) throw new Error('Database not initialized');
    this.db.exec(sql);
  }

  prepare(sql: string): PreparedStatement {
    if (!this._isOpen) throw new Error('Database not initialized');
    
    return {
      run: (...params: any[]): Promise<{ changes: number; lastInsertRowid?: number }> => {
        return new Promise((resolve, reject) => {
          this.db.run(sql, params, function(err: any) {
            if (err) reject(err);
            else resolve({ 
              changes: this.changes, 
              lastInsertRowid: typeof this.lastID === 'bigint' ? Number(this.lastID) : this.lastID 
            });
          });
        });
      },
      get: (...params: any[]): Promise<any> => {
        return new Promise((resolve, reject) => {
          this.db.get(sql, params, (err: any, row: any) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
      },
      all: (...params: any[]): Promise<any[]> => {
        return new Promise((resolve, reject) => {
          this.db.all(sql, params, (err: any, rows: any[]) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });
      }
    };
  }

  async close(): Promise<void> {
    if (this.db && this._isOpen) {
      await new Promise<void>((resolve, reject) => {
        this.db.close((err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
      this._isOpen = false;
      this.logger.info('sqlite3 database closed');
    }
  }

  isOpen(): boolean {
    return this._isOpen;
  }

  getImplementation(): string {
    return 'sqlite3';
  }

  private async execAsync(sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

/**
 * SQL.js WASM Adapter (Universal Compatibility)
 */
export class SQLJSAdapter implements DatabaseAdapter {
  private db: any;
  private SQL: any;
  private logger: Logger;
  private _isOpen = false;
  private dbPath = '';

  constructor() {
    this.logger = new Logger('SQLJSAdapter');
  }

  async init(dbPath: string): Promise<void> {
    try {
      const initSqlJs = await import('sql.js');
      this.SQL = await initSqlJs.default();
      this.dbPath = dbPath;
      
      // Try to load existing database file
      let data: Uint8Array | undefined;
      if (dbPath !== ':memory:') {
        try {
          const fs = await import('fs/promises');
          const buffer = await fs.readFile(dbPath);
          data = new Uint8Array(buffer);
        } catch (err) {
          // File doesn't exist, start with empty database
          this.logger.debug(`Creating new database file: ${dbPath}`);
        }
      }
      
      this.db = new this.SQL.Database(data);
      this._isOpen = true;
      this.logger.info(`✅ sql.js WASM initialized: ${dbPath}`);
    } catch (error) {
      this.logger.error(`❌ sql.js initialization failed: ${error.message}`);
      throw error;
    }
  }

  exec(sql: string): void {
    if (!this._isOpen) throw new Error('Database not initialized');
    this.db.run(sql);
  }

  prepare(sql: string): PreparedStatement {
    if (!this._isOpen) throw new Error('Database not initialized');
    
    return {
      run: (...params: any[]) => {
        const stmt = this.db.prepare(sql);
        stmt.run(params);
        stmt.free();
        return { changes: this.db.getRowsModified(), lastInsertRowid: undefined };
      },
      get: (...params: any[]) => {
        const stmt = this.db.prepare(sql);
        const result = stmt.getAsObject(params);
        return result[0] || null;
      },
      all: (...params: any[]) => {
        const stmt = this.db.prepare(sql);
        const results = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      }
    };
  }

  async close(): Promise<void> {
    if (this.db && this._isOpen) {
      // Save database to file if not in-memory
      if (this.dbPath !== ':memory:') {
        try {
          const data = this.db.export();
          const fs = await import('fs/promises');
          await fs.writeFile(this.dbPath, data);
          this.logger.debug(`Database saved to: ${this.dbPath}`);
        } catch (err) {
          this.logger.warn(`Failed to save database: ${err.message}`);
        }
      }
      
      this.db.close();
      this._isOpen = false;
      this.logger.info('sql.js database closed');
    }
  }

  isOpen(): boolean {
    return this._isOpen;
  }

  getImplementation(): string {
    return 'sql.js';
  }
}