import { getAllBehaviors, addBehavior, deleteBehavior } from './behaviors.js';

// Функция для создания карточки поведения
function createBehaviorCard(behavior) {
    const card = document.createElement('div');
    card.className = 'behavior-card';
    const typeLabel = {
        'scale': 'Шкала (0-5)',
        'text': 'Текст',
        'boolean': 'Было/не было'
    }[behavior.type];
    
    card.innerHTML = `
        <h3>${behavior.name}</h3>
        <p class="behavior-type">${typeLabel}</p>
    `;
    return card;
}

// Функция для отображения всех поведений
async function displayBehaviors() {
    const behaviorCards = document.querySelector('.behavior-cards');
    const behaviors = await getAllBehaviors();
    behaviorCards.innerHTML = ''; // Очищаем текущий список
    behaviors.forEach(behavior => {
        behaviorCards.appendChild(createBehaviorCard(behavior));
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Получаем необходимые элементы DOM
    const modal = document.getElementById('addBehaviorModal');
    const addButton = document.querySelector('.add-behavior-button');
    const input = document.getElementById('behaviorInput');
    const typeSelect = document.getElementById('behaviorType');
    const saveButton = modal.querySelector('.save-button');
    const cancelButton = modal.querySelector('.cancel-button');

    // Открытие модального окна
    function openModal() {
        modal.classList.add('active');
        input.value = '';
        input.focus();
    }

    // Закрытие модального окна
    function closeModal() {
        modal.classList.remove('active');
    }

    // Сохранение нового поведения
    async function saveBehavior() {
        const name = input.value.trim();
        const type = typeSelect.value;
        if (name) {
            await addBehavior(name, type);
            await displayBehaviors();
            closeModal();
        }
    }

    // Добавляем обработчики событий
    addButton.addEventListener('click', openModal);
    cancelButton.addEventListener('click', closeModal);
    saveButton.addEventListener('click', saveBehavior);

    // Закрытие модального окна при клике вне его
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Обработка нажатия Enter в поле ввода
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveBehavior();
        }
    });

    // Инициализация: отображаем существующие поведения
    displayBehaviors();
});
