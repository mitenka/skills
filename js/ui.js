import { getAllBehaviors, addBehavior, deleteBehavior, updateBehavior } from './behaviors.js';

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
            <div class="behavior-actions">
                <button class="edit-behavior" data-id="${behavior.id}">
                    <i class="ri-edit-line"></i>
                </button>
                <button class="delete-behavior" data-id="${behavior.id}">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </div>
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

    // Добавляем обработчик для редактирования
    const editButton = card.querySelector('.edit-behavior');
    if (editButton) {
        editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditModal(behavior);
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

// Показ подсказок при выборе типа поведения
function showTypeHint() {
    const typeSelect = document.getElementById('behaviorType');
    const hints = {
        boolean: document.getElementById('booleanHint'),
        scale: document.getElementById('scaleHint'),
        text: document.getElementById('textHint')
    };
    
    // Скрываем все подсказки
    Object.values(hints).forEach(hint => {
        if (hint) hint.style.display = 'none';
    });
    
    // Показываем подсказку для выбранного типа
    const selectedHint = hints[typeSelect.value];
    if (selectedHint) selectedHint.style.display = 'block';
}

// Функция для открытия модального окна для редактирования
function openEditModal(behavior) {
    const modal = document.getElementById('addBehaviorModal');
    const input = document.getElementById('behaviorInput');
    const typeSelect = document.getElementById('behaviorType');
    const modalTitle = modal.querySelector('h2');

    // Заполняем поля данными поведения
    input.value = behavior.name;
    typeSelect.value = behavior.type;
    typeSelect.disabled = true; // Запрещаем менять тип при редактировании
    
    // Меняем заголовок и текст кнопки
    modalTitle.textContent = 'Редактировать поведение';
    const saveButton = modal.querySelector('.save-button');
    saveButton.textContent = 'Сохранить изменения';
    
    // Сохраняем ID редактируемого поведения
    modal.dataset.editId = behavior.id;
    
    showTypeHint();
    modal.style.display = 'flex';
}

// Функция для открытия модального окна для добавления
function openModal() {
    const modal = document.getElementById('addBehaviorModal');
    const input = document.getElementById('behaviorInput');
    const typeSelect = document.getElementById('behaviorType');
    const modalTitle = modal.querySelector('h2');
    
    // Очищаем поля
    input.value = '';
    typeSelect.value = 'boolean';
    typeSelect.disabled = false;
    
    // Возвращаем исходный заголовок и текст кнопки
    modalTitle.textContent = 'Добавить проблемное поведение';
    const saveButton = modal.querySelector('.save-button');
    saveButton.textContent = 'Добавить';
    
    // Удаляем ID редактируемого поведения
    delete modal.dataset.editId;
    
    showTypeHint();
    modal.style.display = 'flex';
}

// Функция для закрытия модального окна
function closeModal() {
    const modal = document.getElementById('addBehaviorModal');
    const typeSelect = document.getElementById('behaviorType');
    typeSelect.disabled = false;
    modal.style.display = 'none';
}

// Функция для сохранения поведения
async function saveBehavior() {
    const modal = document.getElementById('addBehaviorModal');
    const input = document.getElementById('behaviorInput');
    const typeSelect = document.getElementById('behaviorType');
    
    if (input.value.trim()) {
        const behaviorData = {
            name: input.value.trim(),
            type: typeSelect.value
        };
        
        if (modal.dataset.editId) {
            // Редактирование существующего поведения
            behaviorData.id = parseInt(modal.dataset.editId);
            console.log('Updating behavior:', behaviorData);
            try {
                await updateBehavior(behaviorData);
                console.log('Behavior updated successfully');
            } catch (error) {
                console.error('Failed to update behavior:', error);
            }
        } else {
            // Добавление нового поведения
            console.log('Adding new behavior:', behaviorData);
            try {
                await addBehavior(behaviorData);
                console.log('Behavior added successfully');
            } catch (error) {
                console.error('Failed to add behavior:', error);
            }
        }
        
        closeModal();
        await displayBehaviors();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Получаем необходимые элементы DOM
    const modal = document.getElementById('addBehaviorModal');
    const addButton = document.getElementById('addBehaviorBtn');
    const cancelButton = modal.querySelector('.cancel-button');
    const saveButton = modal.querySelector('.save-button');
    const input = document.getElementById('behaviorInput');
    const typeSelect = document.getElementById('behaviorType');
    const modalTitle = modal.querySelector('h2');

    // Добавляем обработчики событий
    addButton.addEventListener('click', openModal);
    cancelButton.addEventListener('click', closeModal);
    saveButton.addEventListener('click', saveBehavior);
    typeSelect.addEventListener('change', showTypeHint);
    typeSelect.addEventListener('change', (e) => {
        console.log('Type changed to:', e.target.value);
    });

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
