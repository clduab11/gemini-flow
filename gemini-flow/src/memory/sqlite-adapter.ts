/**
 * SQLite Database Adapter Interface
 * 
 * Provides a unified interface for different SQLite implementations:
 * - better-sqlite3 (performance optimized)
 * - sqlite3 (Node.js compatible)
 * - sql.js (WASM cross-platform)
 */

export interface SQLiteRow {
  [key: string]: any;
}

export interface SQLiteResult {
  changes?: number;
  lastInsertRowid?: number;
}

export interface SQLiteStatement {
  run(...params: any[]): SQLiteResult;
  get(...params: any[]): SQLiteRow | undefined;
  all(...params: any[]): SQLiteRow[];
}

export interface SQLiteDatabase {
  prepare(sql: string): SQLiteStatement;
  exec(sql: string): void;
  pragma(pragma: string): any;
  close(): void;
  readonly name: string;
  readonly open: boolean;
}

export type SQLiteImplementation = 'better-sqlite3' | 'sqlite3' | 'sql.js';

export interface SQLiteDetectionResult {
  available: SQLiteImplementation[];
  recommended: SQLiteImplementation;
  errors: Record<string, Error>;
}

/**
 * Detects available SQLite implementations and returns fallback hierarchy
 */
export async function detectSQLiteImplementations(): Promise<SQLiteDetectionResult> {
  const result: SQLiteDetectionResult = {
    available: [],
    recommended: 'sql.js', // Default fallback
    errors: {}
  };

  // Test better-sqlite3 (highest performance)
  try {
    const BetterSqlite3 = (await import('better-sqlite3')).default;
    // Test basic functionality
    const testDb = new BetterSqlite3(':memory:');
    testDb.exec('CREATE TABLE test (id INTEGER)');
    testDb.close();
    result.available.push('better-sqlite3');
    result.recommended = 'better-sqlite3';
  } catch (error) {
    result.errors['better-sqlite3'] = error as Error;
  }

  // Test sqlite3 (Node.js standard)
  try {
    await import('sqlite3');
    result.available.push('sqlite3');
    if (result.recommended === 'sql.js') {
      result.recommended = 'sqlite3';
    }
  } catch (error) {
    result.errors['sqlite3'] = error as Error;
  }

  // Test sql.js (always available WASM)
  try {
    await import('sql.js');
    result.available.push('sql.js');
  } catch (error) {
    result.errors['sql.js'] = error as Error;
  }

  return result;
}

/**
 * Creates a database instance using the best available implementation
 */
export async function createSQLiteDatabase(
  dbPath: string, 
  preferredImpl?: SQLiteImplementation
): Promise<SQLiteDatabase> {
  const detection = await detectSQLiteImplementations();
  
  if (detection.available.length === 0) {
    throw new Error('No SQLite implementations available. Please install better-sqlite3, sqlite3, or sql.js');
  }

  const implementation = preferredImpl && detection.available.includes(preferredImpl) 
    ? preferredImpl 
    : detection.recommended;

  switch (implementation) {
    case 'better-sqlite3':
      return await createBetterSQLite3Database(dbPath);
    
    case 'sqlite3':
      return await createSQLite3Database(dbPath);
    
    case 'sql.js':
      return await createSqlJsDatabase(dbPath);
    
    default:
      throw new Error(`Unsupported SQLite implementation: ${implementation}`);
  }
}

/**
 * Better-SQLite3 adapter implementation
 */
async function createBetterSQLite3Database(dbPath: string): Promise<SQLiteDatabase> {
  const BetterSqlite3 = (await import('better-sqlite3')).default;
  const db = new BetterSqlite3(dbPath);
  
  return {
    name: 'better-sqlite3',
    open: db.open,
    
    prepare(sql: string): SQLiteStatement {
      const stmt = db.prepare(sql);
      return {
        run: (...params: any[]) => stmt.run(...params),
        get: (...params: any[]) => stmt.get(...params),
        all: (...params: any[]) => stmt.all(...params)
      };
    },
    
    exec(sql: string): void {
      db.exec(sql);
    },
    
    pragma(pragma: string): any {
      return db.pragma(pragma);
    },
    
    close(): void {
      db.close();
    }
  };
}

/**
 * SQLite3 adapter implementation
 */
async function createSQLite3Database(dbPath: string): Promise<SQLiteDatabase> {
  const { default: sqlite3 } = await import('sqlite3');
  const db = new sqlite3.Database(dbPath);
  
  return {
    name: 'sqlite3',
    open: true,
    
    prepare(sql: string): SQLiteStatement {
      return {
        run: (...params: any[]): SQLiteResult => {
          return new Promise((resolve, reject) => {
            db.run(sql, params, function(this: any, err: Error) {
              if (err) reject(err);
              else resolve({ 
                changes: this.changes, 
                lastInsertRowid: this.lastID 
              });
            });
          }) as any;
        },
        
        get: (...params: any[]): SQLiteRow | undefined => {
          return new Promise((resolve, reject) => {
            db.get(sql, params, (err: Error, row: SQLiteRow) => {
              if (err) reject(err);
              else resolve(row);
            });
          }) as any;
        },
        
        all: (...params: any[]): SQLiteRow[] => {
          return new Promise((resolve, reject) => {
            db.all(sql, params, (err: Error, rows: SQLiteRow[]) => {
              if (err) reject(err);
              else resolve(rows);
            });
          }) as any;
        }
      };
    },
    
    exec(sql: string): void {
      db.exec(sql);
    },
    
    pragma(pragma: string): any {
      // SQLite3 doesn't support pragma directly, implement as exec
      this.exec(`PRAGMA ${pragma}`);
      return null;
    },
    
    close(): void {
      db.close();
    }
  };
}

/**
 * SQL.js WASM adapter implementation
 */
async function createSqlJsDatabase(dbPath: string): Promise<SQLiteDatabase> {
  const { default: initSqlJs } = await import('sql.js');
  const fs = await import('fs');
  const path = await import('path');
  
  const SQL = await initSqlJs();
  
  // Load existing database or create new one
  let dbData: Uint8Array | undefined;
  try {
    if (dbPath !== ':memory:' && fs.existsSync(dbPath)) {
      dbData = fs.readFileSync(dbPath);
    }
  } catch (error) {
    // Ignore file read errors, will create new database
  }
  
  const db = new SQL.Database(dbData);
  
  // Auto-save functionality for persistent storage
  let saveTimer: NodeJS.Timeout | null = null;
  const scheduleSync = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (dbPath !== ':memory:') {
        try {
          const dir = path.dirname(dbPath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          const data = db.export();
          fs.writeFileSync(dbPath, data);
        } catch (error) {
          console.warn('Failed to save SQLite database:', error);
        }
      }
    }, 1000);
  };
  
  return {
    name: 'sql.js',
    open: true,
    
    prepare(sql: string): SQLiteStatement {
      return {
        run: (...params: any[]): SQLiteResult => {
          try {
            const stmt = db.prepare(sql);
            if (params.length > 0) {
              stmt.bind(params);
            }
            stmt.step();
            const changes = db.getRowsModified();
            stmt.free();
            scheduleSync();
            return { 
              changes,
              lastInsertRowid: undefined // SQL.js doesn't provide this easily
            };
          } catch (error) {
            throw error;
          }
        },
        
        get: (...params: any[]): SQLiteRow | undefined => {
          try {
            const stmt = db.prepare(sql);
            if (params.length > 0) {
              stmt.bind(params);
            }
            const hasRow = stmt.step();
            const results = hasRow ? stmt.getAsObject() : {};
            stmt.free();
            return Object.keys(results).length > 0 ? results : undefined;
          } catch (error) {
            throw error;
          }
        },
        
        all: (...params: any[]): SQLiteRow[] => {
          try {
            const stmt = db.prepare(sql);
            const results: SQLiteRow[] = [];
            if (params.length > 0) {
              stmt.bind(params);
            }
            while (stmt.step()) {
              results.push(stmt.getAsObject());
            }
            stmt.free();
            return results;
          } catch (error) {
            throw error;
          }
        }
      };
    },
    
    exec(sql: string): void {
      db.exec(sql);
      scheduleSync();
    },
    
    pragma(pragma: string): any {
      // Execute pragma as regular SQL
      this.exec(`PRAGMA ${pragma}`);
      return null;
    },
    
    close(): void {
      if (saveTimer) {
        clearTimeout(saveTimer);
      }
      // Final sync before closing
      if (dbPath !== ':memory:') {
        try {
          const dir = path.dirname(dbPath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          const data = db.export();
          fs.writeFileSync(dbPath, data);
        } catch (error) {
          console.warn('Failed to save SQLite database on close:', error);
        }
      }
      db.close();
    }
  };
}