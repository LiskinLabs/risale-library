// Empty module stubs for excluding optional (Tauri-native) dependencies
// in web platform builds. These modules are only loaded at runtime when
// NEXT_PUBLIC_APP_PLATFORM !== 'web', so the stubs are never executed.

// ---- tauri-plugin-turso ----
export class Database {
  path: string;
  constructor(path: string) {
    this.path = path;
  }
  static async load(_pathOrOptions: unknown): Promise<Database> {
    throw new Error('Database not available on web platform');
  }
  async execute(_query: string, _bindValues?: unknown[]) {
    throw new Error('Database not available on web platform');
  }
  async select<T>(_query: string, _bindValues?: unknown[]): Promise<T> {
    throw new Error('Database not available on web platform');
  }
  async batch(_queries: string[]): Promise<void> {
    throw new Error('Database not available on web platform');
  }
  async sync(): Promise<void> {
    throw new Error('Database not available on web platform');
  }
  async close(_db?: string): Promise<boolean> {
    throw new Error('Database not available on web platform');
  }
}
export type LoadOptions = Record<string, unknown>;
export type QueryResult = { rowsAffected: number; lastInsertId: number };
