import { db } from './db.js';

// Функция для получения всех поведений
export async function getAllBehaviors() {
    try {
        return await db.behaviors.toArray();
    } catch (error) {
        console.error('Ошибка при получении поведений:', error);
        return [];
    }
}

// Функция для добавления нового поведения
export async function addBehavior(behavior) {
    try {
        const id = await db.behaviors.add(behavior);
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

// Функция для обновления поведения
export async function updateBehavior(behavior) {
    try {
        await db.behaviors.update(behavior.id, behavior);
    } catch (error) {
        console.error('Ошибка при обновлении поведения:', error);
        throw error;
    }
}
