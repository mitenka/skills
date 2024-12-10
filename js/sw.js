// Service Worker для работы с IndexedDB
importScripts('db.js');

const db = new DiaryDB();
let isDbInitialized = false;

self.addEventListener('install', (event) => {
  event.waitUntil(
    db.init().then(() => {
      isDbInitialized = true;
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', async (event) => {
  if (!isDbInitialized) {
    await db.init();
    isDbInitialized = true;
  }

  const { type, userId, data } = event.data;

  try {
    let response;
    switch (type) {
      case 'saveBehaviors':
        await db.saveBehaviors(userId, data);
        response = { success: true };
        break;

      case 'getBehaviors':
        response = {
          success: true,
          data: await db.getBehaviors(userId)
        };
        break;

      case 'addEntry':
        const entryId = await db.addEntry(userId, data);
        response = { success: true, entryId };
        break;

      case 'getEntries':
        response = {
          success: true,
          data: await db.getEntries(userId)
        };
        break;

      default:
        response = {
          success: false,
          error: 'Unknown command'
        };
    }

    event.ports[0].postMessage(response);
  } catch (error) {
    event.ports[0].postMessage({
      success: false,
      error: error.message
    });
  }
});
