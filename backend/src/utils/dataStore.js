/**
 * Simple in-memory data store for session data
 * In production, this should be replaced with a proper database (MongoDB, PostgreSQL, etc.)
 */

class DataStore {
  constructor() {
    this.store = new Map();
  }

  set(key, value) {
    this.store.set(key, value);
  }

  get(key) {
    return this.store.get(key);
  }

  delete(key) {
    return this.store.delete(key);
  }

  has(key) {
    return this.store.has(key);
  }

  getAll() {
    return Array.from(this.store.values());
  }

  clear() {
    this.store.clear();
  }
}

export const dataStore = new DataStore();

