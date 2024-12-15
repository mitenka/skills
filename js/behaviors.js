import { db } from "./db.js";

// Функция для получения всех поведений
export async function getAllBehaviors() {
  try {
    return await db.behaviors.toArray();
  } catch (error) {
    console.error("Ошибка при получении поведений:", error);
    return [];
  }
}

// Функция для добавления нового поведения
export async function addBehavior(behavior) {
  try {
    const id = await db.behaviors.add(behavior);
    return id;
  } catch (error) {
    console.error("Ошибка при добавлении поведения:", error);
    throw error;
  }
}

// Функция для обновления поведения
export async function updateBehavior(behavior) {
  try {
    await db.behaviors.update(behavior.id, behavior);
  } catch (error) {
    console.error("Ошибка при обновлении поведения:", error);
    throw error;
  }
}

// Функция для удаления поведения
export async function deleteBehavior(id) {
  try {
    await db.behaviors.delete(id);
  } catch (error) {
    console.error("Ошибка при удалении поведения:", error);
    throw error;
  }
}

// Функция для сохранения записей дневника
export async function saveDiaryEntries(date, entries) {
  try {
    // Начинаем транзакцию
    await db.transaction("rw", db.diaryEntries, async () => {
      // Создаем запись дневника, сохраняя все поля как есть
      const diaryEntry = {
        date,
        isFilledToday: entries.isFilledToday,
        skillUsage: entries.skillUsage,
        behaviors: entries.behaviors
      };

      // Сохраняем или обновляем запись
      await db.diaryEntries.put(diaryEntry);
    });
  } catch (error) {
    console.error("Ошибка при сохранении записей дневника:", error);
    throw error;
  }
}

// Функция для получения записей дневника за определенную дату
export async function getDiaryEntriesByDate(date) {
  try {
    const entry = await db.diaryEntries.get(date);
    if (!entry) return null;

    // Возвращаем запись как есть, все нужные данные уже сохранены
    return entry;
  } catch (error) {
    console.error("Ошибка при получении записей дневника:", error);
    return null;
  }
}
