declare module 'tauri-plugin-turso' {
  export class Database {
    path: string;
    constructor(path: string);
    static load(pathOrOptions: string | LoadOptions): Promise<Database>;
    execute(query: string, bindValues?: unknown[]): Promise<QueryResult>;
    select<T>(query: string, bindValues?: unknown[]): Promise<T>;
    batch(queries: string[]): Promise<void>;
    sync(): Promise<void>;
    close(db?: string): Promise<boolean>;
  }

  export interface LoadOptions {
    path: string;
    encryption?: EncryptionConfig;
    syncUrl?: string;
    authToken?: string;
    experimental?: string[];
  }

  export interface QueryResult {
    rowsAffected: number;
    lastInsertId: number;
  }

  export interface EncryptionConfig {
    cipher: Cipher;
    key: number[] | Uint8Array;
  }

  export type Cipher = 'aes256cbc';
}
