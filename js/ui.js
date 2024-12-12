import { getAllBehaviors, addBehavior, deleteBehavior, updateBehavior } from './behaviors.js';

// Функция для создания карточки поведения
function createBehaviorCard(behavior) {
    const card = document.createElement('div');
    card.className = 'behavior-card';
    
    // Создаем контрол в зависимости от типа поведения
    let actionControlHtml = '';
    if (isFillingMode) {
        switch (behavior.type) {
            case 'boolean':
                actionControlHtml = `
                    <div class="control-group">
                        <div class="boolean-control">
                            <button class="boolean-button" data-value="true" data-id="${behavior.id}" data-field="action">
                                <i class="ri-check-line"></i>
                            </button>
                            <button class="boolean-button" data-value="false" data-id="${behavior.id}" data-field="action">
                                <i class="ri-close-line"></i>
                            </button>
                        </div>
                    </div>
                `;
                break;
            case 'scale':
                actionControlHtml = `
                    <div class="control-group">
                        <div class="scale-control">
                            <div class="scale-buttons">
                                <button class="scale-button" data-value="0" data-id="${behavior.id}" data-field="action">0</button>
                                <button class="scale-button" data-value="1" data-id="${behavior.id}" data-field="action">1</button>
                                <button class="scale-button" data-value="2" data-id="${behavior.id}" data-field="action">2</button>
                                <button class="scale-button" data-value="3" data-id="${behavior.id}" data-field="action">3</button>
                                <button class="scale-button" data-value="4" data-id="${behavior.id}" data-field="action">4</button>
                                <button class="scale-button" data-value="5" data-id="${behavior.id}" data-field="action">5</button>
                            </div>
                        </div>
                    </div>
                `;
                break;
            case 'text':
                actionControlHtml = `
                    <div class="control-group">
                        <textarea 
                            class="behavior-value" 
                            data-id="${behavior.id}"
                            data-field="action"
                            placeholder="Опишите действие..."
                            rows="3"
                        ></textarea>
                    </div>
                `;
                break;
        }
    }

    // Создаем шкалу для желания (всегда шкала от 0 до 5)
    const desireControlHtml = isFillingMode ? `
        <div class="control-group">
            <div class="scale-control">
                <div class="scale-buttons">
                    <button class="scale-button" data-value="0" data-id="${behavior.id}" data-field="desire">0</button>
                    <button class="scale-button" data-value="1" data-id="${behavior.id}" data-field="desire">1</button>
                    <button class="scale-button" data-value="2" data-id="${behavior.id}" data-field="desire">2</button>
                    <button class="scale-button" data-value="3" data-id="${behavior.id}" data-field="desire">3</button>
                    <button class="scale-button" data-value="4" data-id="${behavior.id}" data-field="desire">4</button>
                    <button class="scale-button" data-value="5" data-id="${behavior.id}" data-field="desire">5</button>
                </div>
            </div>
        </div>
    ` : '';
    
    card.innerHTML = `
        <div class="behavior-header">
            <span class="behavior-name">${behavior.name}</span>
            <div class="behavior-actions">
                <button class="edit-btn" data-id="${behavior.id}">
                    <i class="ri-edit-line"></i>
                </button>
                <button class="delete-btn" data-id="${behavior.id}">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </div>
        </div>
        ${isFillingMode ? `
            <div class="behavior-controls">
                <div class="control-section">
                    <label class="control-label">Желание</label>
                    ${desireControlHtml}
                </div>
                <div class="control-section">
                    <label class="control-label">Действие</label>
                    ${actionControlHtml}
                </div>
            </div>
        ` : ''}
    `;

    // Добавляем обработчик для удаления
    const deleteButton = card.querySelector('.delete-btn');
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
    const editButton = card.querySelector('.edit-btn');
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
    const fillDiaryButton = document.getElementById('fillDiaryBtn');
    behaviorCards.innerHTML = ''; // Очищаем текущий список
    
    // Управляем состоянием кнопки заполнения дневника
    if (fillDiaryButton) {
        fillDiaryButton.disabled = behaviors.length === 0;
        fillDiaryButton.title = behaviors.length === 0 ? 
            'Сначала добавьте хотя бы одно поведение' : 
            'Заполнить дневник';
    }
    
    if (behaviors.length === 0) {
        // Если режим заполнения был активен, выключаем его
        if (isFillingMode) {
            cleanupDiaryMode();
        }
        
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

    // В режиме редактирования добавляем карточки с кнопками
    if (isFillingMode) {
        // Карточка с кнопками выбора даты (добавляем в начало)
        const dateCard = document.createElement('div');
        dateCard.className = 'behavior-card date-card';
        dateCard.innerHTML = `
            <div class="date-buttons">
                <button class="date-btn active">Сегодня</button>
                <button class="date-btn">Вчера</button>
                <button class="date-btn">Позавчера</button>
            </div>
        `;

        // Добавляем обработчики для кнопок выбора даты
        const dateButtons = dateCard.querySelectorAll('.date-btn');
        dateButtons.forEach(button => {
            button.addEventListener('click', () => {
                dateButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });

        // Вставляем карточку с датами в начало списка
        behaviorCards.insertBefore(dateCard, behaviorCards.firstChild);

        // Карточка с кнопкой сохранения (в конец)
        const saveCard = document.createElement('div');
        saveCard.className = 'behavior-card save-card';
        saveCard.innerHTML = `
            <button class="save-diary-btn">
                <i class="ri-save-line"></i>
                <span>Сохранить дневник</span>
            </button>
        `;

        const saveButton = saveCard.querySelector('.save-diary-btn');
        saveButton.addEventListener('click', () => {
            cleanupDiaryMode();
            isFillingMode = false;
            displayBehaviors();
        });

        behaviorCards.appendChild(saveCard);
    }
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

// Состояние режима заполнения дневника
let isFillingMode = false;

// Функция очистки режима заполнения дневника
function cleanupDiaryMode() {
    if (isFillingMode) {
        isFillingMode = false;
        document.body.classList.remove('diary-filling-mode');
        displayBehaviors();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Получаем необходимые элементы DOM
    const modal = document.getElementById('addBehaviorModal');
    const addButton = document.getElementById('addBehaviorBtn');
    const fillDiaryButton = document.getElementById('fillDiaryBtn');

    // Обработчик для кнопки заполнения дневника
    fillDiaryButton?.addEventListener('click', () => {
        isFillingMode = !isFillingMode;
        document.body.classList.toggle('diary-filling-mode', isFillingMode);
        document.querySelector('.main-nav a[href="#diary"]').click();
        displayBehaviors();
    });

    // Добавляем слушатель на изменение хэша URL
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash;
        if (hash && hash !== '#diary' && isFillingMode) {
            cleanupDiaryMode();
        }
    });

    // Также очищаем режим при прямом клике на другие пункты навигации
    document.querySelectorAll('.main-nav a').forEach(link => {
        if (link.getAttribute('href') !== '#diary') {
            link.addEventListener('click', cleanupDiaryMode);
        }
    });

    // Добавляем обработчики событий
    addButton.addEventListener('click', openModal);
    modal.querySelector('.cancel-button').addEventListener('click', closeModal);
    modal.querySelector('.save-button').addEventListener('click', saveBehavior);
    document.getElementById('behaviorType').addEventListener('change', showTypeHint);

    // Закрытие модального окна при клике вне его
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Обработка нажатия Enter в поле ввода
    document.getElementById('behaviorInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveBehavior();
        }
    });

    // Инициализация: отображаем существующие поведения
    displayBehaviors();
});
