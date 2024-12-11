import { db } from './db.js';

// Функция для получения всех проблемных поведений
export async function getAllBehaviors() {
    try {
        return await db.behaviors.toArray();
    } catch (error) {
        console.error('Ошибка при получении списка поведений:', error);
        return [];
    }
}

// Функция для добавления нового поведения
export async function addBehavior(name) {
    try {
        const id = await db.behaviors.add({ name });
        return id;
    } catch (error) {
        console.error('Ошибка при добавлении поведения:', error);
        throw error;
    }
}

// Функция для удаления поведения
export async function deleteBehavior(id) {
    try {
        await db.behaviors.delete(id);
    } catch (error) {
        console.error('Ошибка при удалении поведения:', error);
        throw error;
    }
}
