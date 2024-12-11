import { getAllBehaviors, addBehavior, deleteBehavior } from './behaviors.js';

// Функция для создания карточки поведения
function createBehaviorCard(behavior) {
    const card = document.createElement('div');
    card.className = 'behavior-card';
    
    // Создаем контрол в зависимости от типа
    let controlHtml = '';
    switch (behavior.type) {
        case 'boolean':
            controlHtml = `
                <label class="toggle-control">
                    <input type="checkbox" class="behavior-value" data-id="${behavior.id}">
                    <span class="toggle-switch"></span>
                </label>
            `;
            break;
        case 'scale':
            controlHtml = `
                <div class="scale-control">
                    <input type="range" 
                        class="behavior-value" 
                        data-id="${behavior.id}"
                        min="0" 
                        max="5" 
                        value="0"
                    >
                    <div class="scale-labels">
                        <span>0</span>
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                        <span>4</span>
                        <span>5</span>
                    </div>
                </div>
            `;
            break;
        case 'text':
            controlHtml = `
                <div class="text-control">
                    <textarea 
                        class="behavior-value" 
                        data-id="${behavior.id}"
                        placeholder="Опишите ситуацию..."
                        rows="3"
                    ></textarea>
                </div>
            `;
            break;
    }
    
    card.innerHTML = `
        <div class="behavior-header">
            <h3>${behavior.name}</h3>
            <button class="delete-behavior" data-id="${behavior.id}">
                <i class="ri-delete-bin-line"></i>
            </button>
        </div>
        ${controlHtml}
    `;

    // Добавляем обработчик для удаления
    const deleteButton = card.querySelector('.delete-behavior');
    if (deleteButton) {
        deleteButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm('Удалить это поведение?')) {
                await deleteBehavior(behavior.id);
                await displayBehaviors();
            }
        });
    }

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
    const addButton = document.getElementById('addBehaviorBtn');
    const input = document.getElementById('behaviorInput');
    const typeSelect = document.getElementById('behaviorType');
    const saveButton = modal.querySelector('.save-button');
    const cancelButton = modal.querySelector('.cancel-button');

    // Показ подсказок при выборе типа поведения
    function showTypeHint() {
        // Скрываем все подсказки
        document.querySelectorAll('.behavior-type-hint').forEach(hint => {
            hint.classList.remove('active');
        });
        // Показываем подсказку для выбранного типа
        const selectedType = typeSelect.value;
        const hint = document.getElementById(`${selectedType}Hint`);
        if (hint) {
            hint.classList.add('active');
        }
    }

    // Открытие модального окна
    function openModal() {
        modal.classList.add('active');
        input.value = '';
        input.focus();
        showTypeHint(); // Показываем подсказку для начального значения
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
            await addBehavior({ name, type });
            await displayBehaviors();
            closeModal();
        }
    }

    // Добавляем обработчики событий
    addButton.addEventListener('click', openModal);
    cancelButton.addEventListener('click', closeModal);
    saveButton.addEventListener('click', saveBehavior);
    typeSelect.addEventListener('change', showTypeHint);

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
