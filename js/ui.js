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
                <div class="boolean-control">
                    <button class="boolean-button" data-value="true" data-id="${behavior.id}">
                        <i class="ri-check-line"></i>
                    </button>
                    <button class="boolean-button" data-value="false" data-id="${behavior.id}">
                        <i class="ri-close-line"></i>
                    </button>
                </div>
            `;
            break;
        case 'scale':
            controlHtml = `
                <div class="scale-control">
                    <div class="scale-buttons">
                        <button class="scale-button" data-value="0" data-id="${behavior.id}">0</button>
                        <button class="scale-button" data-value="1" data-id="${behavior.id}">1</button>
                        <button class="scale-button" data-value="2" data-id="${behavior.id}">2</button>
                        <button class="scale-button" data-value="3" data-id="${behavior.id}">3</button>
                        <button class="scale-button" data-value="4" data-id="${behavior.id}">4</button>
                        <button class="scale-button" data-value="5" data-id="${behavior.id}">5</button>
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
    
    if (behaviors.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <p>Здесь будут отображаться ваши записи о поведении</p>
            <button class="create-demo-card">
                <i class="ri-add-line"></i>
                Добавить примеры проблемного поведения
            </button>
            <p class="demo-note">Позднее вы сможете их отредактировать или удалить</p>
        `;
        
        // Добавляем обработчик для кнопки создания примеров
        const demoButton = emptyState.querySelector('.create-demo-card');
        if (demoButton) {
            demoButton.addEventListener('click', addExampleBehaviors);
        }
        
        behaviorCards.appendChild(emptyState);
        return;
    }

    behaviors.forEach(behavior => {
        behaviorCards.appendChild(createBehaviorCard(behavior));
    });
}

// Функция для добавления примеров поведений
async function addExampleBehaviors() {
    const examples = [
        {
            name: 'Пропуск сессии или тренинга',
            type: 'boolean'
        },
        {
            name: 'Импульсивные траты (такси, рестораны, подарки)',
            type: 'boolean'
        },
        {
            name: 'Необдуманные обещания',
            type: 'boolean'
        },
        {
            name: 'Денежные долги',
            type: 'boolean'
        },
        {
            name: 'Проявление агрессии',
            type: 'scale'
        }
    ];

    for (const example of examples) {
        await addBehavior(example);
    }
    
    await displayBehaviors();
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
async function openModal() {
    const modal = document.getElementById('addBehaviorModal');
    const input = document.getElementById('behaviorInput');
    const typeSelect = document.getElementById('behaviorType');
    const modalTitle = modal.querySelector('h2');
    
    // Проверяем, есть ли уже добавленные поведения
    const behaviors = await getAllBehaviors();
    if (behaviors.length === 0) {
        input.value = 'Пропуск сессии или тренинга';
        typeSelect.value = 'boolean';
    } else {
        // Очищаем поля
        input.value = '';
        typeSelect.value = 'boolean';
    }
    
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
        
        try {
            if (modal.dataset.editId) {
                // Редактирование существующего поведения
                behaviorData.id = parseInt(modal.dataset.editId);
                await updateBehavior(behaviorData);
            } else {
                // Добавление нового поведения
                await addBehavior(behaviorData);
            }
            closeModal();
            await displayBehaviors();
        } catch (error) {
            console.error('Ошибка при сохранении поведения:', error);
        }
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
