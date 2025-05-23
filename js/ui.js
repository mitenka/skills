import {
  getAllBehaviors,
  addBehavior,
  deleteBehavior,
  updateBehavior,
  saveDiaryEntries,
  getDiaryEntriesByDate,
} from "./behaviors.js";

import { updateDiaryHistory } from "./diary-history.js";
import { db } from "./db.js";
import { exportDiaryToImage, exportDiaryToCSV } from "./export-utils.js";

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
    const desireButtons = card.querySelectorAll(
      '.scale-button[data-field="desire"]'
    );
    desireButtons.forEach((button) => {
      button.addEventListener("click", () => {
        // Убираем active у всех кнопок желания в этой карточке
        desireButtons.forEach((btn) => btn.classList.remove("active"));
        // Добавляем active к нажатой кнопке
        button.classList.add("active");
      });
    });

    // Обработчики для кнопок действия
    const actionButtons = card.querySelectorAll(
      '.scale-button[data-field="action"]'
    );
    actionButtons.forEach((button) => {
      button.addEventListener("click", () => {
        // Убираем active у всех кнопок действия в этой карточке
        actionButtons.forEach((btn) => btn.classList.remove("active"));
        // Добавляем active к нажатой кнопке
        button.classList.add("active");
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
  card.querySelectorAll(".scale-button").forEach((button) => {
    button.addEventListener("click", () => {
      // Находим все кнопки в той же группе
      const field = button.dataset.field;
      const group = card.querySelectorAll(
        `.scale-button[data-field="${field}"]`
      );

      // Убираем активный класс у всех кнопок в группе
      group.forEach((btn) => btn.classList.remove("active"));

      // Добавляем активный класс нажатой кнопке
      button.classList.add("active");
    });
  });
}

const skillOptionsTemplate = {
  feminine: [
    "Не думала о навыках и не использовала",
    "Думала о навыках, не хотела применять, не использовала",
    "Думала о навыках, хотела применить, но не использовала",
    "Старалась, но не смогла применить навыки",
    "Старалась, смогла применить навыки, но они не помогли",
    "Старалась, смогла применить навыки, они помогли",
    "Использовала навыки, не стараясь (автоматически), они не помогли",
    "Использовала навыки, не стараясь (автоматически), они помогли",
  ],
  masculine: [
    "Не думал о навыках и не использовал",
    "Думал о навыках, не хотел применять, не использовал",
    "Думал о навыках, хотел применить, но не использовал",
    "Старался, но не смог применить навыки",
    "Старался, смог применить навыки, но они не помогли",
    "Старался, смог применить навыки, они помогли",
    "Использовал навыки, не стараясь (автоматически), они не помогли",
    "Использовал навыки, не стараясь (автоматически), они помогли",
  ],
};

function getPreferredGender() {
  return localStorage.getItem("preferredGender") || "feminine";
}

function setPreferredGender(gender) {
  localStorage.setItem("preferredGender", gender);
}

function updateSkillOptions(gender) {
  const radioButtons = document.querySelectorAll('input[name="skill-usage"]');
  const labels = document.querySelectorAll(".skill-usage-option label");

  radioButtons.forEach((radio, index) => {
    labels[index].textContent = skillOptionsTemplate[gender][index];
  });
}

// Функция для создания карточки с использованием навыков
function createSkillUsageCard() {
  const card = document.createElement("div");
  card.className = "behavior-card skill-usage-card";

  const currentGender = getPreferredGender();
  const options = skillOptionsTemplate[currentGender];

  const radioButtons = options
    .map(
      (option, index) => `
        <div class="skill-usage-option">
          <input
            type="radio"
            id="skill-usage-${index}"
            name="skill-usage"
            value="${index}"
          >
          <label for="skill-usage-${index}">${option}</label>
        </div>
      `
    )
    .join("");

  card.innerHTML = `
    <div class="skill-usage-options">
      ${radioButtons}
    </div>
  `;

  return card;
}

// Функция для создания карточки с датами
function createDateCard() {
  const dateCard = document.createElement("div");
  dateCard.className = "behavior-card date-card";

  // Сохраняем текущую активную дату, если она есть
  const currentActiveDate =
    document.querySelector(".date-btn.active")?.dataset.date;

  const weekDates = getWeekDates();
  const today = weekDates.find((date) => {
    const dateStr = formatLocalDate(date);
    return dateStr === formatLocalDate(new Date());
  });

  const dateButtons = weekDates
    .map((date) => {
      const dateValue = formatLocalDate(date);
      const dayName = date.toLocaleDateString("ru-RU", { weekday: "short" });
      const dayNumber = date.getDate();
      // Устанавливаем активную дату либо из сохраненной, либо сегодняшнюю если нет сохраненной
      const isActive = currentActiveDate
        ? dateValue === currentActiveDate
        : date === today;

      return `
      <button class="date-btn ${
        isActive ? "active" : ""
      }" data-date="${dateValue}">
        <span class="day-name">${dayName}</span>
        <span class="day-number">${dayNumber}</span>
      </button>
    `;
    })
    .join("");

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
    button.addEventListener("click", async () => {
      dateButtonsElement.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Проверяем, является ли выбранная дата сегодняшней
      const selectedDate = parseLocalDate(button.dataset.date);
      const today = new Date();
      const isToday = selectedDate.toDateString() === today.toDateString();

      toggleInput.checked = isToday;

      // Загружаем существующие данные дневника
      if (isFillingMode) {
        await loadExistingDiaryEntry(button.dataset.date);
      }
    });
  });

  return dateCard;
}

// Функция для создания карточки с состоянием
function createStateCard() {
  const card = document.createElement("div");
  card.className = "behavior-card state-card";

  const states = [
    { id: "emotional", name: "Эмоциональное страдание" },
    { id: "physical", name: "Физическое страдание" },
    { id: "pleasure", name: "Удовольствие" },
  ];

  const stateInputs = states
    .map((state) => {
      const buttons = Array.from(
        { length: 6 },
        (_, i) => `
      <button class="scale-button" data-field="${state.id}" data-value="${i}" title="${i}">
        <span class="scale-value">${i}</span>
      </button>
    `
      ).join("");

      return `
      <div class="state-row behavior-scale">
        <div class="behavior-info">
          <span class="behavior-name">${state.name}</span>
        </div>
        <div class="scale-buttons">
          ${buttons}
        </div>
      </div>
    `;
    })
    .join("");

  card.innerHTML = `
    <div class="state-card-wrapper">
      ${stateInputs}
    </div>
  `;

  // Добавляем обработчики для кнопок
  states.forEach((state) => {
    const buttons = card.querySelectorAll(
      `.scale-button[data-field="${state.id}"]`
    );
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        buttons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
      });
    });
  });

  return card;
}

// Функция для форматирования даты
export function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Функция для парсинга даты
export function parseLocalDate(dateString) {
  const [y, m, d] = dateString.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Функция для получения дат недели
export function getWeekDates() {
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

// Функция для отображения всех поведений
async function displayBehaviors() {
  const behaviorCards = document.querySelector(".behavior-cards");
  behaviorCards.innerHTML = "";

  try {
    // Получаем все поведения
    const behaviors = await getAllBehaviors();
    const fillDiaryButton = document.getElementById("fillDiaryBtn");

    fillDiaryButton.disabled = behaviors.length === 0;
    fillDiaryButton.title =
      behaviors.length === 0
        ? "Сначала добавьте хотя бы одно поведение"
        : "Заполнить дневник";

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
                Создать примеры поведения
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

    // В режиме заполнения добавляем карточки с кнопками
    if (isFillingMode) {
      // Карточка с датами (в начало)
      const dateCard = createDateCard();
      behaviorCards.appendChild(dateCard);

      // Карточка с состоянием (сразу после дат)
      const stateCard = createStateCard();
      behaviorCards.appendChild(stateCard);
    }

    behaviors.forEach((behavior) => {
      behaviorCards.appendChild(createBehaviorCard(behavior));
    });

    // В режиме заполнения добавляем оставшиеся карточки
    if (isFillingMode) {
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
        try {
          const data = await collectDiaryData();

          if (data) {
            // Показываем индикатор загрузки
            saveButton.classList.add("loading");
            saveButton.disabled = true;

            try {
              // Проверяем существование записи до сохранения
              const existingEntry = await db.diaryEntries.get(data.date);

              if (existingEntry) {
                const confirmOverwrite = confirm(
                  "За этот день уже есть запись в дневнике. Хотите перезаписать её новыми данными?"
                );

                if (!confirmOverwrite) {
                  return;
                }
              }

              const result = await saveDiaryEntries(data.date, data);

              // Обновляем только историю, не перерисовывая всю страницу
              await updateDiaryHistory();

              // Показываем сообщение об успехе
              showEncouragingMessage();

              // Очищаем форму, но сохраняем выбранную дату
              const selectedDate =
                document.querySelector(".date-btn.active")?.dataset.date;
              clearDiaryData();
              if (selectedDate) {
                const dateButton = document.querySelector(
                  `.date-btn[data-date="${selectedDate}"]`
                );
                if (dateButton) {
                  document
                    .querySelectorAll(".date-btn")
                    .forEach((btn) => btn.classList.remove("active"));
                  dateButton.classList.add("active");
                }
              }
            } catch (error) {
              console.error("Ошибка при сохранении дневника:", error);
              alert(
                "Произошла ошибка при сохранении дневника. Пожалуйста, попробуйте еще раз. Пожалуйста, заполните хотя бы одно поле (желание или действие) для любого поведения, либо включите переключатель заполнения, либо выберите использование навыков."
              );
            } finally {
              // Убираем индикатор загрузки и разблокируем кнопку
              saveButton.classList.remove("loading");
              saveButton.disabled = false;
            }
          } else {
            alert(
              "Нет данных для сохранения. Пожалуйста, заполните хотя бы одно поле (желание или действие) для любого поведения, либо включите переключатель заполнения, либо выберите использование навыков."
            );
          }
        } catch (error) {
          console.error("Ошибка при сохранении дневника:", error);
        }
      });

      behaviorCards.appendChild(saveCard);
    }
  } catch (error) {
    console.error("Ошибка при отображении поведений:", error);
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

  // Запускаем салют
  if (window.Fireworks) {
    const fireworks = new window.Fireworks();
    fireworks.celebrate();
  }

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
  const behaviorCards = document.querySelector(".behavior-cards");
  const cards = behaviorCards.querySelectorAll(".behavior-card");
  const dateButton = behaviorCards.querySelector(".date-btn.active");
  const isFilledToday = behaviorCards.querySelector(
    ".toggle-control input"
  ).checked;
  const skillUsageRadio = behaviorCards.querySelector(
    'input[name="skill-usage"]:checked'
  );

  // Получаем все поведения для определения их типов
  const allBehaviors = await getAllBehaviors();
  const behaviors = [];

  if (!dateButton) {
    return null;
  }

  // Собираем данные состояния
  const stateCard = behaviorCards.querySelector(".state-card");
  const states = {
    emotional: null,
    physical: null,
    pleasure: null,
  };

  if (stateCard) {
    ["emotional", "physical", "pleasure"].forEach((stateId) => {
      const activeButton = stateCard.querySelector(
        `.scale-button[data-field="${stateId}"].active`
      );
      if (activeButton) {
        states[stateId] = parseInt(activeButton.dataset.value);
      }
    });
  }

  // Собираем данные с каждой карточки поведения
  cards.forEach((card) => {
    // Пропускаем служебные карточки
    if (
      card.classList.contains("date-card") ||
      card.classList.contains("skill-usage-card") ||
      card.classList.contains("save-card") ||
      card.classList.contains("state-card")
    ) {
      return;
    }

    // Получаем заголовок поведения
    const behaviorHeader = card.querySelector(".behavior-header");
    if (!behaviorHeader) return;

    const behaviorId = parseInt(
      behaviorHeader.querySelector("button").dataset.id
    );
    const behaviorName = behaviorHeader
      .querySelector(".behavior-name")
      .textContent.trim();
    const behavior = allBehaviors.find((b) => b.id === behaviorId);
    const desireButton = card.querySelector(
      '.scale-button[data-field="desire"].active'
    );
    const actionControl = card.querySelector(
      '.scale-button[data-field="action"].active, .behavior-value[data-field="action"]'
    );

    // Если хотя бы одно поле заполнено, добавляем запись
    if (
      desireButton ||
      (actionControl && (actionControl.value || actionControl.dataset.value))
    ) {
      let action = null;
      if (actionControl) {
        if (behavior.type === "boolean") {
          action = actionControl.dataset.value === "true";
        } else if (behavior.type === "scale") {
          action = parseInt(actionControl.dataset.value);
        } else if (behavior.type === "text") {
          action = actionControl.value.trim();
        }
      }

      behaviors.push({
        behaviorId,
        name: behaviorName,
        type: behavior.type,
        desire: desireButton ? parseInt(desireButton.dataset.value) : null,
        action,
      });
    }
  });

  // Проверяем, есть ли хоть какие-то данные для сохранения
  const hasStates = Object.values(states).some((value) => value !== null);
  const hasData =
    behaviors.length > 0 ||
    skillUsageRadio?.value ||
    isFilledToday ||
    hasStates;

  if (!hasData) {
    return null;
  }

  const result = {
    date: dateButton.dataset.date,
    isFilledToday,
    skillUsage: skillUsageRadio ? parseInt(skillUsageRadio.value) : null,
    behaviors,
    states,
  };

  return result;
}

// Функция для загрузки существующей записи дневника
async function loadExistingDiaryEntry(dateStr) {
  try {
    // Удаляем предыдущее уведомление, если оно есть
    const existingNotification = document.querySelector(".edit-notification");
    if (existingNotification) {
      existingNotification.remove();
    }

    // Сбрасываем все значения перед загрузкой новых данных
    const filledToggle = document.querySelector(".toggle-control input");
    filledToggle.checked = false;

    document.querySelectorAll('input[name="skill-usage"]').forEach((radio) => {
      radio.checked = false;
    });

    document
      .querySelectorAll(".state-card .scale-button.active")
      .forEach((button) => {
        button.classList.remove("active");
      });

    document
      .querySelectorAll(".behavior-card .scale-button.active")
      .forEach((button) => {
        button.classList.remove("active");
      });

    document
      .querySelectorAll('.behavior-value[data-field="action"]')
      .forEach((input) => {
        input.value = "";
      });

    const entry = await getDiaryEntriesByDate(dateStr);

    if (entry) {
      // Показываем уведомление о редактировании
      const notification = document.createElement("div");
      notification.className = "edit-notification";
      const formattedDate = parseLocalDate(dateStr);
      notification.innerHTML = `
        <i class="ri-edit-line"></i>
        <span>Вы редактируете существующую запись за ${formatDate(
          formattedDate
        )}</span>
      `;

      document
        .querySelector(".behavior-cards")
        .insertBefore(
          notification,
          document.querySelector(".behavior-cards").firstChild
        );

      // Устанавливаем значение переключателя заполнения
      if (filledToggle) {
        filledToggle.checked = entry.isFilledToday || false;
      }

      // Загружаем состояния
      if (entry.states) {
        const stateCard = document.querySelector(".state-card");
        if (stateCard) {
          ["emotional", "physical", "pleasure"].forEach((stateId) => {
            if (
              entry.states[stateId] !== null &&
              entry.states[stateId] !== undefined
            ) {
              const stateButton = stateCard.querySelector(
                `.scale-button[data-field="${stateId}"][data-value="${entry.states[stateId]}"]`
              );
              if (stateButton) {
                stateButton.classList.add("active");
              }
            }
          });
        }
      }

      // Устанавливаем значение использования навыков
      if (entry.skillUsage !== undefined && entry.skillUsage !== null) {
        const skillRadio = document.querySelector(
          `input[name="skill-usage"][value="${entry.skillUsage}"]`
        );
        if (skillRadio) {
          skillRadio.checked = true;
        }
      }

      // Устанавливаем значения для каждого поведения
      entry.behaviors.forEach((behaviorEntry) => {
        const card = document
          .querySelector(
            `.behavior-card button[data-id="${behaviorEntry.behaviorId}"]`
          )
          ?.closest(".behavior-card");
        if (!card) return;

        // Устанавливаем значение desire если есть
        if (
          behaviorEntry.desire !== null &&
          behaviorEntry.desire !== undefined
        ) {
          const desireButton = card.querySelector(
            `.scale-button[data-field="desire"][data-value="${behaviorEntry.desire}"]`
          );
          if (desireButton) {
            desireButton.classList.add("active");
          }
        }

        // Устанавливаем значение action если есть
        if (
          behaviorEntry.action !== null &&
          behaviorEntry.action !== undefined
        ) {
          if (behaviorEntry.type === "boolean") {
            const actionButton = card.querySelector(
              `.scale-button[data-field="action"][data-value="${behaviorEntry.action}"]`
            );
            if (actionButton) {
              actionButton.classList.add("active");
            }
          } else if (behaviorEntry.type === "scale") {
            const actionButton = card.querySelector(
              `.scale-button[data-field="action"][data-value="${behaviorEntry.action}"]`
            );
            if (actionButton) {
              actionButton.classList.add("active");
            }
          } else if (behaviorEntry.type === "text") {
            const actionInput = card.querySelector(
              '.behavior-value[data-field="action"]'
            );
            if (actionInput) {
              actionInput.value = behaviorEntry.action;
            }
          }
        }
      });
    }
  } catch (error) {
    console.error("Ошибка при загрузке существующих данных:", error);
  }
}

// Функция для очистки данных дневника
function clearDiaryData() {
  // Сохраняем текущую активную дату
  const activeDate = document.querySelector(".date-btn.active")?.dataset.date;

  // Очищаем состояния
  document
    .querySelectorAll(".state-card .scale-button.active")
    .forEach((button) => {
      button.classList.remove("active");
    });

  // Очищаем значения в карточках поведений
  document
    .querySelectorAll(".behavior-card .scale-button.active")
    .forEach((button) => {
      button.classList.remove("active");
    });

  // Восстанавливаем активную дату
  if (activeDate) {
    const dateButton = document.querySelector(
      `.date-btn[data-date="${activeDate}"]`
    );
    if (dateButton) {
      document
        .querySelectorAll(".date-btn")
        .forEach((btn) => btn.classList.remove("active"));
      dateButton.classList.add("active");
    }
  }
}

// Функция для активации режима заполнения дневника
async function activateFillDiaryMode() {
  isFillingMode = !isFillingMode; // Переключаем режим
  document.body.classList.toggle("diary-filling-mode", isFillingMode);
  await displayBehaviors();

  // После отображения всех карточек загружаем данные для текущей даты
  if (isFillingMode) {
    const activeDate = document.querySelector(".date-btn.active");
    if (activeDate) {
      await loadExistingDiaryEntry(activeDate.dataset.date);
    }
  }
}

// Функция для открытия модального окна экспорта
function openExportModal() {
  const modal = document.getElementById("exportDiaryModal");
  modal.style.display = "flex";

  // Сбрасываем активные кнопки
  const activeButtons = modal.querySelectorAll(
    ".scale-button.diary-button.active"
  );
  activeButtons.forEach((button) => {
    button.classList.remove("active");
  });

  // Устанавливаем значение по умолчанию для количества дней
  const input = document.getElementById("exportDays");
  if (input) input.value = "7";
}

// Функция для закрытия модального окна экспорта
function closeExportModal() {
  const modal = document.getElementById("exportDiaryModal");
  modal.style.display = "none";
}

// Функция для сохранения дневника
async function exportDiary() {
  const input = document.getElementById("exportDays");
  const days = parseInt(input.value);

  if (isNaN(days) || days < 1) {
    alert("Пожалуйста, введите корректное количество дней");
    return;
  }

  // Получаем выбранный формат экспорта
  const formatRadios = document.getElementsByName("exportFormat");
  let selectedFormat = "png"; // По умолчанию PNG
  
  for (const radio of formatRadios) {
    if (radio.checked) {
      selectedFormat = radio.value;
      break;
    }
  }

  try {
    // Выбираем метод экспорта в зависимости от формата
    if (selectedFormat === "png") {
      console.log(`Экспорт дневника в формате PNG за ${days} дней`);
      await exportDiaryToImage(days);
    } else if (selectedFormat === "csv") {
      console.log(`Экспорт дневника в формате CSV за ${days} дней`);
      await exportDiaryToCSV(days);
    }
  } catch (error) {
    console.error("Ошибка при экспорте дневника:", error);
    alert(`Ошибка при экспорте дневника: ${error.message}. Попробуйте другой формат или меньший период.`);
  }

  // Закрываем модальное окно
  closeExportModal();
}

document.addEventListener("DOMContentLoaded", () => {
  // Получаем необходимые элементы DOM
  const modal = document.getElementById("addBehaviorModal");
  const addButton = document.getElementById("addBehaviorBtn");
  const fillDiaryButton = document.getElementById("fillDiaryBtn");

  // Обработчик для кнопки заполнения дневника
  fillDiaryButton?.addEventListener("click", async () => {
    await activateFillDiaryMode();
  });

  // Инициализация переключателя рода
  const genderToggle = document.getElementById("preferredGender");
  if (genderToggle) {
    genderToggle.checked = getPreferredGender() === "feminine";
    genderToggle.addEventListener("change", (e) => {
      const gender = e.target.checked ? "feminine" : "masculine";
      setPreferredGender(gender);
      updateSkillOptions(gender);
    });
  }

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

  // Обработчики для модального окна экспорта дневника
  const exportBtn = document.getElementById("exportScreenshotBtn");
  const exportModal = document.getElementById("exportDiaryModal");

  if (exportBtn) {
    exportBtn.addEventListener("click", openExportModal);
  }

  if (exportModal) {
    // Обработчик для кнопки отмены
    const cancelBtn = exportModal.querySelector(".cancel-button");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", closeExportModal);
    }

    // Обработчик для кнопки сохранения
    const saveBtn = exportModal.querySelector(".save-button");
    if (saveBtn) {
      saveBtn.addEventListener("click", exportDiary);
    }

    // Обработчики для быстрых ссылок
    const links = exportModal.querySelectorAll(".dotted-link");
    links.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const days = parseInt(e.target.dataset.days);
        document.getElementById("exportDays").value = days;
      });
    });
  }
});

function formatDate(date) {
  return date
    .toLocaleString("ru-RU", {
      day: "numeric",
      month: "long",
      monthDisplay: "long",
    })
    .replace(" г.", "");
}
