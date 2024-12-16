import {
  getAllBehaviors,
  addBehavior,
  deleteBehavior,
  updateBehavior,
  saveDiaryEntries,
} from "./behaviors.js";

// Функция для создания карточки поведения
function createBehaviorCard(behavior) {
  const card = document.createElement("div");
  card.className = "behavior-card";

  // Создаем контрол в зависимости от типа поведения
  let actionControlHtml = "";
  if (isFillingMode) {
    switch (behavior.type) {
      case "boolean":
        actionControlHtml = `
                    <div class="control-group">
                        <div class="boolean-control">
                            <button class="scale-button boolean-button diary-button" data-value="false" data-id="${behavior.id}" data-field="action">
                                <i class="ri-close-line"></i>
                            </button>
                            <button class="scale-button boolean-button diary-button" data-value="true" data-id="${behavior.id}" data-field="action">
                                <i class="ri-check-line"></i>
                            </button>
                        </div>
                    </div>
                `;
        break;
      case "scale":
        actionControlHtml = `
                    <div class="control-group">
                        <div class="scale-control">
                            <div class="scale-buttons">
                                <button class="scale-button diary-button" data-value="0" data-id="${behavior.id}" data-field="action">0</button>
                                <button class="scale-button diary-button" data-value="1" data-id="${behavior.id}" data-field="action">1</button>
                                <button class="scale-button diary-button" data-value="2" data-id="${behavior.id}" data-field="action">2</button>
                                <button class="scale-button diary-button" data-value="3" data-id="${behavior.id}" data-field="action">3</button>
                                <button class="scale-button diary-button" data-value="4" data-id="${behavior.id}" data-field="action">4</button>
                                <button class="scale-button diary-button" data-value="5" data-id="${behavior.id}" data-field="action">5</button>
                            </div>
                        </div>
                    </div>
                `;
        break;
      case "text":
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
  const desireControlHtml = isFillingMode
    ? `
        <div class="control-group">
            <div class="scale-control">
                <div class="scale-buttons">
                    <button class="scale-button diary-button" data-value="0" data-id="${behavior.id}" data-field="desire">0</button>
                    <button class="scale-button diary-button" data-value="1" data-id="${behavior.id}" data-field="desire">1</button>
                    <button class="scale-button diary-button" data-value="2" data-id="${behavior.id}" data-field="desire">2</button>
                    <button class="scale-button diary-button" data-value="3" data-id="${behavior.id}" data-field="desire">3</button>
                    <button class="scale-button diary-button" data-value="4" data-id="${behavior.id}" data-field="desire">4</button>
                    <button class="scale-button diary-button" data-value="5" data-id="${behavior.id}" data-field="desire">5</button>
                </div>
            </div>
        </div>
    `
    : "";

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
        ${
          isFillingMode
            ? `
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
            `
            : ""
        }
    `;

  // Добавляем обработчики для кнопок
  if (isFillingMode) {
    // Обработчики для кнопок желания
    const desireButtons = card.querySelectorAll('.scale-button[data-field="desire"]');
    desireButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Убираем active у всех кнопок желания в этой карточке
        desireButtons.forEach(btn => btn.classList.remove('active'));
        // Добавляем active к нажатой кнопке
        button.classList.add('active');
      });
    });

    // Обработчики для кнопок действия
    const actionButtons = card.querySelectorAll('.scale-button[data-field="action"]');
    actionButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Убираем active у всех кнопок действия в этой карточке
        actionButtons.forEach(btn => btn.classList.remove('active'));
        // Добавляем active к нажатой кнопке
        button.classList.add('active');
      });
    });
  }

  // Добавляем обработчики для кнопок удаления и редактирования
  const deleteButton = card.querySelector(".delete-btn");
  if (deleteButton) {
    deleteButton.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (confirm("Удалить это поведение?")) {
        await deleteBehavior(behavior.id);
        await displayBehaviors();
      }
    });
  }

  const editButton = card.querySelector(".edit-btn");
  if (editButton) {
    editButton.addEventListener("click", (e) => {
      e.stopPropagation();
      openEditModal(behavior);
    });
  }

  addBehaviorCardHandlers(card);
  return card;
}

// Функция для добавления обработчиков кнопок в карточке поведения
function addBehaviorCardHandlers(card) {
  // Обработчики для кнопок шкалы и булевых значений
  card.querySelectorAll('.scale-button').forEach(button => {
    button.addEventListener('click', () => {
      // Находим все кнопки в той же группе
      const field = button.dataset.field;
      const group = card.querySelectorAll(`.scale-button[data-field="${field}"]`);
      
      // Убираем активный класс у всех кнопок в группе
      group.forEach(btn => btn.classList.remove('active'));
      
      // Добавляем активный класс нажатой кнопке
      button.classList.add('active');
    });
  });
}

// Функция для создания карточки с использованием навыков
function createSkillUsageCard() {
  const card = document.createElement("div");
  card.className = "behavior-card skill-usage-card";
  
  const options = [
    "Не думал о навыках и не использовал",
    "Думал о навыках, не хотел применять, не использовал",
    "Думал о навыках, хотел применить, но не использовал",
    "Старался, но не смог применить навыки",
    "Старался, смог применить навыки, но они не помогли",
    "Старался, смог применить навыки, они помогли",
    "Использовал навыки, не стараясь (автоматически), они не помогли",
    "Использовал навыки, не стараясь (автоматически), они помогли"
  ];

  const radioButtons = options.map((option) => `
    <label class="radio-control">
      <input type="radio" name="skill-usage" value="${option}">
      <span class="radio-custom"></span>
      <span class="radio-label">${option.charAt(0).toUpperCase() + option.slice(1)}</span>
    </label>
  `).join('');

  card.innerHTML = `
    <div class="skill-usage-wrapper">
      <div class="skill-usage-options">
        ${radioButtons}
      </div>
    </div>
  `;

  return card;
}

// Функция для получения дат недели
function getWeekDates() {
  const dates = [];
  const today = new Date();
  
  // Получаем даты для последних 7 дней
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    dates.push(date);
  }
  
  return dates;
}

// Функция для создания карточки с датами
function createDateCard() {
  const dateCard = document.createElement("div");
  dateCard.className = "behavior-card date-card";
  
  const weekDates = getWeekDates();
  const dateButtons = weekDates.map(date => {
    const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });
    const dayNumber = date.getDate();
    const isToday = date.toDateString() === new Date().toDateString();
    
    return `
      <button class="date-btn ${isToday ? 'active' : ''}" data-date="${date.toISOString().split('T')[0]}">
        <span class="day-name">${dayName}</span>
        <span class="day-number">${dayNumber}</span>
      </button>
    `;
  }).join('');

  dateCard.innerHTML = `
    <div class="date-card-wrapper">
      <div class="date-buttons">
        ${dateButtons}
      </div>
      <div class="diary-status-wrapper">
        <label class="toggle-control">
          <input type="checkbox" checked>
          <span class="toggle-switch"></span>
          <span class="toggle-label">Дневник заполнен сегодня</span>
        </label>
      </div>
    </div>
  `;

  // Добавляем обработчики для кнопок выбора даты
  const dateButtonsElement = dateCard.querySelectorAll(".date-btn");
  const toggleInput = dateCard.querySelector(".toggle-control input");
  
  dateButtonsElement.forEach((button) => {
    button.addEventListener("click", () => {
      dateButtonsElement.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      
      // Проверяем, является ли выбранная дата сегодняшней
      const selectedDate = new Date(button.dataset.date);
      const today = new Date();
      const isToday = selectedDate.toDateString() === today.toDateString();
      
      // Обновляем состояние свитчера
      toggleInput.checked = isToday;
    });
  });

  return dateCard;
}

// Функция для отображения всех поведений
async function displayBehaviors() {
  const behaviorCards = document.querySelector(".behavior-cards");
  const behaviors = await getAllBehaviors();
  const fillDiaryButton = document.getElementById("fillDiaryBtn");
  behaviorCards.innerHTML = ""; // Очищаем текущий список

  // Управляем состоянием кнопки заполнения дневника
  if (fillDiaryButton) {
    fillDiaryButton.disabled = behaviors.length === 0;
    fillDiaryButton.title =
      behaviors.length === 0
        ? "Сначала добавьте хотя бы одно поведение"
        : "Заполнить дневник";
  }

  if (behaviors.length === 0) {
    // Если режим заполнения был активен, выключаем его
    if (isFillingMode) {
      cleanupDiaryMode();
    }

    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.innerHTML = `
            <p>Здесь будут отображаться ваши записи о поведении</p>
            <button class="create-demo-card">
                <i class="ri-add-line"></i>
                Добавить примеры проблемного поведения
            </button>
            <p class="demo-note">Позднее вы сможете их отредактировать или удалить</p>
        `;

    // Добавляем обработчик для кнопки создания примеров
    const demoButton = emptyState.querySelector(".create-demo-card");
    if (demoButton) {
      demoButton.addEventListener("click", addExampleBehaviors);
    }

    behaviorCards.appendChild(emptyState);
    return;
  }

  behaviors.forEach((behavior) => {
    behaviorCards.appendChild(createBehaviorCard(behavior));
  });

  // В режиме редактирования добавляем карточки с кнопками
  if (isFillingMode) {
    // Карточка с кнопками выбора даты (добавляем в начало)
    const dateCard = createDateCard();

    // Вставляем карточку с датами в начало списка
    behaviorCards.insertBefore(dateCard, behaviorCards.firstChild);

    // Карточка с использованием навыков
    const skillUsageCard = createSkillUsageCard();
    behaviorCards.appendChild(skillUsageCard);

    // Карточка с кнопкой сохранения (в конец)
    const saveCard = document.createElement("div");
    saveCard.className = "behavior-card save-card";
    saveCard.innerHTML = `
            <button class="save-diary-btn">
                <i class="ri-save-line"></i>
                <span>Сохранить дневник</span>
            </button>
        `;

    const saveButton = saveCard.querySelector(".save-diary-btn");
    saveButton.addEventListener("click", async () => {
      const data = await collectDiaryData();
      
      if (data) {
        try {
          await saveDiaryEntries(data.date, data);
          showEncouragingMessage();
          setTimeout(() => {
            cleanupDiaryMode();
            isFillingMode = false;
            displayBehaviors();
          }, 2000);
        } catch (error) {
          console.error("Ошибка при сохранении дневника:", error);
          alert("Произошла ошибка при сохранении дневника. Пожалуйста, попробуйте еще раз.");
        }
      } else {
        alert("Пожалуйста, заполните все поля дневника перед сохранением.");
      }
    });

    behaviorCards.appendChild(saveCard);
  }
}

// Функция для добавления примеров поведений
async function addExampleBehaviors() {
  const examples = [
    {
      name: "Пропуск сессии или тренинга",
      type: "boolean",
    },
    {
      name: "Импульсивные траты (такси, рестораны, подарки)",
      type: "boolean",
    },
    {
      name: "Необдуманные обещания",
      type: "boolean",
    },
    {
      name: "Денежные долги",
      type: "boolean",
    },
    {
      name: "Проявление агрессии",
      type: "scale",
    },
  ];

  for (const example of examples) {
    await addBehavior(example);
  }

  await displayBehaviors();
}

// Показ подсказок при выборе типа поведения
function showTypeHint() {
  const typeSelect = document.getElementById("behaviorType");
  const hints = {
    boolean: document.getElementById("booleanHint"),
    scale: document.getElementById("scaleHint"),
    text: document.getElementById("textHint"),
  };

  // Скрываем все подсказки
  Object.values(hints).forEach((hint) => {
    if (hint) hint.style.display = "none";
  });

  // Показываем подсказку для выбранного типа
  const selectedHint = hints[typeSelect.value];
  if (selectedHint) selectedHint.style.display = "block";
}

// Функция для открытия модального окна для редактирования
function openEditModal(behavior) {
  const modal = document.getElementById("addBehaviorModal");
  const input = document.getElementById("behaviorInput");
  const typeSelect = document.getElementById("behaviorType");
  const modalTitle = modal.querySelector("h2");

  // Заполняем поля данными поведения
  input.value = behavior.name;
  typeSelect.value = behavior.type;

  // Меняем заголовок и текст кнопки
  modalTitle.textContent = "Редактировать поведение";
  const saveButton = modal.querySelector(".save-button");
  saveButton.textContent = "Сохранить изменения";

  // Сохраняем ID редактируемого поведения
  modal.dataset.editId = behavior.id;

  showTypeHint();
  modal.style.display = "flex";
}

// Функция для открытия модального окна для добавления
async function openModal() {
  const modal = document.getElementById("addBehaviorModal");
  const input = document.getElementById("behaviorInput");
  const typeSelect = document.getElementById("behaviorType");
  const modalTitle = modal.querySelector("h2");

  // Проверяем, есть ли уже добавленные поведения
  const behaviors = await getAllBehaviors();
  if (behaviors.length === 0) {
    input.value = "Пропуск сессии или тренинга";
    typeSelect.value = "boolean";
  } else {
    // Очищаем поля
    input.value = "";
    typeSelect.value = "boolean";
  }

  typeSelect.disabled = false;

  // Возвращаем исходный заголовок и текст кнопки
  modalTitle.textContent = "Добавить проблемное поведение";
  const saveButton = modal.querySelector(".save-button");
  saveButton.textContent = "Добавить";

  // Удаляем ID редактируемого поведения
  delete modal.dataset.editId;

  showTypeHint();
  modal.style.display = "flex";
}

// Функция для закрытия модального окна
function closeModal() {
  const modal = document.getElementById("addBehaviorModal");
  modal.style.display = "none";
}

// Функция для сохранения поведения
async function saveBehavior() {
  const modal = document.getElementById("addBehaviorModal");
  const input = document.getElementById("behaviorInput");
  const typeSelect = document.getElementById("behaviorType");

  if (input.value.trim()) {
    const behaviorData = {
      name: input.value.trim(),
      type: typeSelect.value,
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
      console.error("Ошибка при сохранении поведения:", error);
    }
  }
}

// Массив воодушевляющих сообщений
const encouragingMessages = [
  "Спасибо",
  "Заебись",
  "Вы — молодец",
  "Всё в порядке",
  "Отличная работа",
  "Изменения сохранены",
];

// Массив иконок для сообщений
const messageIcons = [
  "ri-heart-line",
  "ri-star-line",
  "ri-sun-line",
  "ri-rainbow-line",
  "ri-plant-line",
  "ri-leaf-line",
  "ri-sparkling-line",
  "ri-award-line",
];

// Функция для показа воодушевляющего сообщения
function showEncouragingMessage() {
  const messageContainer = document.getElementById("successMessage");
  const messageText = messageContainer.querySelector(".message-text");
  const messageIcon = messageContainer.querySelector("i");

  // Выбираем случайное сообщение и иконку
  const randomMessage =
    encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
  const randomIcon =
    messageIcons[Math.floor(Math.random() * messageIcons.length)];

  messageText.textContent = randomMessage;
  messageIcon.className = randomIcon; // Заменяем класс иконки на случайный

  // Показываем сообщение
  messageContainer.classList.add("show");

  // Скрываем сообщение через 3 секунды
  setTimeout(() => {
    messageContainer.classList.remove("show");
    setTimeout(() => {
      cleanupDiaryMode();
    }, 400); // Даем время на анимацию исчезновения
  }, 3000);
}

// Состояние режима заполнения дневника
let isFillingMode = false;

// Функция очистки режима заполнения дневника
function cleanupDiaryMode() {
  if (isFillingMode) {
    isFillingMode = false;
    document.body.classList.remove("diary-filling-mode");
    displayBehaviors();
  }
}

// Функция для сбора данных дневника
async function collectDiaryData() {
  const behaviors = [];
  const cards = document.querySelectorAll(".behavior-card");
  const dateButton = document.querySelector(".date-btn.active");
  const isFilledToday = document.querySelector(".toggle-control input").checked;
  const skillUsageRadio = document.querySelector('input[name="skill-usage"]:checked');

  // Получаем все поведения для определения их типов
  const allBehaviors = await getAllBehaviors();

  // Только дата обязательна, так как это ключ
  if (!dateButton) {
    console.error("Не выбрана дата");
    return null;
  }

  // Собираем данные с каждой карточки поведения
  cards.forEach(card => {
    // Пропускаем служебные карточки
    if (card.classList.contains("date-card") || 
        card.classList.contains("skill-usage-card") || 
        card.classList.contains("save-card")) {
      return;
    }

    const behaviorHeader = card.querySelector(".behavior-header");
    const behaviorId = parseInt(behaviorHeader.querySelector("button").dataset.id);
    const behaviorName = behaviorHeader.querySelector(".behavior-name").textContent.trim();
    const behavior = allBehaviors.find(b => b.id === behaviorId);
    const desireButton = card.querySelector('.scale-button[data-field="desire"].active');
    const actionControl = card.querySelector('.scale-button[data-field="action"].active, .behavior-value[data-field="action"]');

    // Если хотя бы одно поле заполнено, добавляем запись
    if (desireButton || (actionControl && actionControl.value)) {
      // Форматируем действие в зависимости от типа
      let action = null;
      if (actionControl) {
        if (behavior.type === 'boolean') {
          action = actionControl.dataset.value === 'true' ? 'да' : 'нет';
        } else if (behavior.type === 'scale') {
          action = parseInt(actionControl.dataset.value);  // оставляем как число
        } else if (behavior.type === 'text') {
          action = actionControl.value.trim();
        }
      }

      behaviors.push({
        behaviorId,
        name: behaviorName,
        type: behavior.type,
        desire: desireButton ? parseInt(desireButton.dataset.value) : null,
        action
      });
    }
  });

  return {
    date: dateButton.dataset.date,
    isFilledToday,
    skillUsage: skillUsageRadio ? skillUsageRadio.value : null,
    behaviors
  };
}

document.addEventListener("DOMContentLoaded", () => {
  // Получаем необходимые элементы DOM
  const modal = document.getElementById("addBehaviorModal");
  const addButton = document.getElementById("addBehaviorBtn");
  const fillDiaryButton = document.getElementById("fillDiaryBtn");

  // Обработчик для кнопки заполнения дневника
  fillDiaryButton?.addEventListener("click", () => {
    isFillingMode = !isFillingMode;
    document.body.classList.toggle("diary-filling-mode", isFillingMode);
    document.querySelector('.main-nav a[href="#diary"]').click();
    displayBehaviors();
  });

  // Добавляем слушатель на изменение хэша URL
  window.addEventListener("hashchange", () => {
    const hash = window.location.hash;
    if (hash && hash !== "#diary" && isFillingMode) {
      cleanupDiaryMode();
    }
  });

  // Также очищаем режим при прямом клике на другие пункты навигации
  document.querySelectorAll(".main-nav a").forEach((link) => {
    if (link.getAttribute("href") !== "#diary") {
      link.addEventListener("click", cleanupDiaryMode);
    }
  });

  // Добавляем обработчики событий
  addButton.addEventListener("click", openModal);
  modal.querySelector(".cancel-button").addEventListener("click", closeModal);
  modal.querySelector(".save-button").addEventListener("click", saveBehavior);
  document
    .getElementById("behaviorType")
    .addEventListener("change", showTypeHint);

  // Закрытие модального окна при клике вне его
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Обработка нажатия Enter в поле ввода
  document.getElementById("behaviorInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      saveBehavior();
    }
  });

  // Инициализация: отображаем существующие поведения
  displayBehaviors();
});
