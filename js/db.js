// Импортируем Dexie
import Dexie from 'https://unpkg.com/dexie@latest/dist/modern/dexie.min.mjs';

// Создаем класс для нашей базы данных
class BehaviorDatabase extends Dexie {
    constructor() {
        // Название нашей базы данных
        super('behaviorDB');
        
        // Определяем схему базы данных
        // Таблица behaviors - индексируются все поля:
        // ++id - автоинкрементное поле
        // name - название проблемного поведения
        // type - тип оценки поведения (scale, text, boolean)
        //
        // Таблица diaryEntries - индексируются только:
        // date - дата записи (первичный ключ)
        // isFilledToday - отметка о заполнении дневника в этот день
        // skillUsage - текстовое описание использования навыков
        //
        // Остальные поля хранятся как JSON:
        // behaviors - массив записей о поведениях:
        //   - behaviorId - ID поведения
        //   - name - название поведения на момент записи
        //   - desire - уровень желания
        //   - action - предпринятое действие
        this.version(1).stores({
            behaviors: '++id, name, type',
            diaryEntries: 'date, isFilledToday, skillUsage'
        });
    }
}

// Создаем и экспортируем экземпляр базы данных
export const db = new BehaviorDatabase();
