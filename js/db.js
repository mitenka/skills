// Импортируем Dexie
import Dexie from 'https://unpkg.com/dexie@latest/dist/modern/dexie.min.mjs';

// Создаем класс для нашей базы данных
class BehaviorDatabase extends Dexie {
    constructor() {
        // Название нашей базы данных
        super('behaviorDB');
        
        // Определяем схему базы данных
        // ++id означает автоинкрементное поле
        // name - это поле для хранения названия проблемного поведения
        this.version(1).stores({
            behaviors: '++id, name'
        });
    }
}

// Создаем и экспортируем экземпляр базы данных
export const db = new BehaviorDatabase();
