class DiaryDB {
  constructor() {
    this.dbName = 'diaryDB';
    this.dbVersion = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store for user behaviors
        if (!db.objectStoreNames.contains('behaviors')) {
          const behaviorsStore = db.createObjectStore('behaviors', { keyPath: 'id' });
          behaviorsStore.createIndex('userId', 'userId', { unique: false });
        }

        // Store for diary entries
        if (!db.objectStoreNames.contains('entries')) {
          const entriesStore = db.createObjectStore('entries', { keyPath: 'id', autoIncrement: true });
          entriesStore.createIndex('userId', 'userId', { unique: false });
          entriesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async saveBehaviors(userId, behaviors) {
    const transaction = this.db.transaction(['behaviors'], 'readwrite');
    const store = transaction.objectStore('behaviors');

    return new Promise((resolve, reject) => {
      const request = store.put({
        id: userId,
        userId,
        behaviors,
        timestamp: new Date().toISOString()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getBehaviors(userId) {
    const transaction = this.db.transaction(['behaviors'], 'readonly');
    const store = transaction.objectStore('behaviors');

    return new Promise((resolve, reject) => {
      const request = store.get(userId);
      
      request.onsuccess = () => {
        resolve(request.result ? request.result.behaviors : null);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async addEntry(userId, measurements) {
    const transaction = this.db.transaction(['entries'], 'readwrite');
    const store = transaction.objectStore('entries');

    return new Promise((resolve, reject) => {
      const request = store.add({
        userId,
        measurements,
        timestamp: new Date().toISOString()
      });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getEntries(userId) {
    const transaction = this.db.transaction(['entries'], 'readonly');
    const store = transaction.objectStore('entries');
    const index = store.index('userId');

    return new Promise((resolve, reject) => {
      const request = index.getAll(userId);
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => reject(request.error);
    });
  }
}
