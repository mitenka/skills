// Навигация
function initNavigation() {
  const navLinks = document.querySelectorAll(".main-nav a");
  const pages = document.querySelectorAll(".page");

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href").slice(1);

      // Обновляем активные классы в навигации
      navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      // Показываем нужную страницу
      pages.forEach((page) => {
        page.classList.remove("active");
        if (page.id === targetId) {
          page.classList.add("active");
        }
      });
    });
  });
}

// Регистрация и обновление Service Worker
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        // Проверяем обновления каждые 60 минут
        setInterval(() => {
          registration.update();
        }, 1000 * 60 * 60);

        // Отслеживаем обновления
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                // Новый Service Worker установлен, показываем уведомление
                showUpdateNotification();
              }
            }
          });
        });
      })
      .catch((error) =>
        console.error("ServiceWorker registration failed:", error)
      );
  }
}

// Показ уведомления об обновлении
function showUpdateNotification() {
  const notification = document.createElement("div");
  notification.className = "update-notification";
  notification.innerHTML = `
        <p>Доступна новая версия приложения!</p>
        <button onclick="window.location.reload()">Обновить</button>
    `;
  document.body.appendChild(notification);
}

// Загрузка данных из JSON
async function loadTheoryData() {
  try {
    const [theoryResponse, axiomsResponse] = await Promise.all([
      fetch("data/theory.json"),
      fetch("data/assumptions.json"),
    ]);

    // Проверяем статус ответа
    if (!theoryResponse.ok || !axiomsResponse.ok) {
      throw new Error("Ошибка при загрузке данных");
    }

    const theoryData = await theoryResponse.json();
    const axiomsData = await axiomsResponse.json();

    renderTheoryBlocks(theoryData);

    // Проверяем настройку отображения допущений
    const showAssumptions = localStorage.getItem("showAssumptions") !== "false";
    if (showAssumptions) {
      renderAxioms(axiomsData);
    } else {
      // Удаляем существующую карточку допущения, если она есть
      const assumptionCard = document.querySelector(".assumption-card");
      if (assumptionCard) {
        assumptionCard.remove();
      }
    }
  } catch (error) {
    console.error("Ошибка при загрузке данных:", error);
    if (!navigator.onLine) {
      showOfflineMessage();
    }
  }
}

// Отображение блоков теории
function renderTheoryBlocks(data) {
  const container = document.querySelector(".blocks-container");
  if (!container) return;

  function renderPoints(points) {
    if (!points?.length) return "";

    return points
      .map(
        (point) => `
      <div class="point">
        <p>${point.text}</p>
        ${
          point.subpoints
            ? `
          <ul>
            ${point.subpoints.map((sub) => `<li>${sub}</li>`).join("")}
          </ul>
        `
            : ""
        }
      </div>
    `
      )
      .join("");
  }

  container.innerHTML = data.blocks
    .map(
      (block) => `
    <div class="theory-block">
      <h2>${block.title}</h2>
      <div class="skills-grid">
        ${
          block.skills.length > 0
            ? block.skills
                .map(
                  (skill) => `
                <div class="skill-card">
                  <div class="skill-header">
                    <div class="skill-title">
                      <h3>${skill.name}</h3>
                      ${
                        skill.category
                          ? `<span class="skill-category">${skill.category}</span>`
                          : ""
                      }
                    </div>
                    <span class="arrow">▼</span>
                  </div>
                  <div class="skill-details">
                    ${renderPoints(skill.points)}
                  </div>
                </div>
              `
                )
                .join("")
            : `
                <div class="empty-skills-message">
                  <i class="ri-lock-line"></i> Информация будет доступна по мере прохождения тренинга
                </div>
              `
        }
      </div>
    </div>
  `
    )
    .join("");

  // Добавляем обработчики для анимации
  container.querySelectorAll(".skill-card").forEach((card) => {
    const content = card.querySelector(".skill-details");
    const arrow = card.querySelector(".arrow");

    // Предварительно измеряем высоту
    content.style.height = "auto";
    content.style.maxHeight = "none";
    content.style.opacity = "0";
    content.style.display = "block";
    const height = content.offsetHeight;
    content.style.display = "";
    content.style.opacity = "";
    content.style.maxHeight = "";
    content.style.height = "";

    // Устанавливаем реальную высоту как CSS-переменную
    card.style.setProperty("--content-height", `${height}px`);

    card.addEventListener("click", () => {
      requestAnimationFrame(() => {
        content.classList.toggle("open");
        arrow.classList.toggle("open");
      });
    });
  });
}

// Храним предыдущий индекс
let previousAssumptionIndex = -1;

function getRandomAssumption(assumptions) {
  if (!assumptions || assumptions.length === 0) return null;

  // Если в массиве только одно допущение, возвращаем его
  if (assumptions.length === 1) return assumptions[0];

  // Выбираем случайный индекс, исключая предыдущий
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * assumptions.length);
  } while (newIndex === previousAssumptionIndex);

  // Сохраняем новый индекс как предыдущий
  previousAssumptionIndex = newIndex;
  return assumptions[newIndex];
}

// Отображение случайного допущения
function renderAxioms(data) {
  if (!data.assumptions || data.assumptions.length === 0) return;

  const section = document.getElementById("theory");
  const randomAssumption = getRandomAssumption(data.assumptions);
  if (!randomAssumption) return;

  const container = document.createElement("div");
  container.className = "assumption-card";
  container.innerHTML = `
    <div class="assumption-header">
      <button class="refresh-button" aria-label="Показать следующее допущение">
        <i class="ri-refresh-line"></i>
      </button>
    </div>
    <div class="assumption-title">${randomAssumption.title}</div>
    <div class="assumption-text">${randomAssumption.text}</div>
  `;

  // Находим существующую карточку и заменяем её
  const existingCard = section.querySelector(".assumption-card");
  if (existingCard) {
    section.replaceChild(container, existingCard);
  } else {
    // Если карточки нет, добавляем её после заголовка
    const title = section.querySelector("h1");
    title.after(container);
  }

  // Добавляем обработчик для кнопки обновления
  const refreshButton = container.querySelector(".refresh-button");
  refreshButton.addEventListener("click", () => {
    renderAxioms(data);
  });
}

// Сообщение об офлайн режиме
function showOfflineMessage() {
  const message = document.createElement("div");
  message.className = "offline-message";
  message.textContent =
    "Вы находитесь в офлайн режиме. Некоторые данные могут быть недоступны.";
  document.body.appendChild(message);

  setTimeout(() => {
    message.remove();
  }, 3000);
}

// Инициализация настроек
function initSettings() {
  const showAssumptionsToggle = document.getElementById("showAssumptions");
  if (showAssumptionsToggle) {
    // Устанавливаем начальное состояние
    const showAssumptions = localStorage.getItem("showAssumptions") !== "false";
    showAssumptionsToggle.checked = showAssumptions;

    // Добавляем обработчик изменений
    showAssumptionsToggle.addEventListener("change", (e) => {
      const showAssumptions = e.target.checked;
      localStorage.setItem("showAssumptions", showAssumptions);

      // Обновляем отображение допущений
      const assumptionCard = document.querySelector(".assumption-card");
      if (assumptionCard) {
        if (showAssumptions) {
          loadTheoryData(); // Перезагружаем данные для отображения допущения
        } else {
          assumptionCard.style.display = "none"; // Скрываем карточку допущения
        }
      } else if (showAssumptions) {
        loadTheoryData(); // Если карточки нет, но включили показ - загружаем данные
      }
    });
  }

  const showInstallButtonToggle = document.getElementById("showInstallButton");
  if (showInstallButtonToggle) {
    // Устанавливаем начальное состояние
    const showInstallButton =
      localStorage.getItem("showInstallButton") !== "false";
    showInstallButtonToggle.checked = showInstallButton;

    // Применяем текущее состояние
    const installButton = document.getElementById("installButton");
    if (installButton) {
      installButton.style.display = showInstallButton ? "flex" : "none";
    }

    // Добавляем обработчик изменений
    showInstallButtonToggle.addEventListener("change", (e) => {
      const showInstallButton = e.target.checked;
      localStorage.setItem("showInstallButton", showInstallButton);

      // Обновляем отображение кнопки установки
      const installButton = document.getElementById("installButton");
      if (installButton) {
        installButton.style.display = showInstallButton ? "flex" : "none";
      }
    });
  }
}

import { db } from "./db.js";
import { getAllDiaryEntries } from "./behaviors.js";

// Функция для очистки всех данных
async function clearAllData() {
  try {
    // Очищаем IndexedDB
    await db.delete();

    // Очищаем localStorage
    localStorage.clear();

    // Перезагружаем страницу для пересоздания базы данных
    window.location.reload();
  } catch (error) {
    console.error("Ошибка при очистке данных:", error);
    alert("Произошла ошибка при удалении данных. Попробуйте еще раз.");
  }
}

// Обработчик для кнопки очистки данных
document.getElementById("clearDataBtn")?.addEventListener("click", () => {
  if (
    confirm(
      "Вы уверены, что хотите удалить все данные? Это действие нельзя отменить."
    )
  ) {
    clearAllData();
  }
});

let deferredPrompt;

// Обработка события beforeinstallprompt
window.addEventListener("beforeinstallprompt", (e) => {
  // Предотвращаем показ стандартного баннера установки
  e.preventDefault();
  // Сохраняем событие для последующего использования
  deferredPrompt = e;
});

// Инициализация кнопки установки
function initInstallButton() {
  const installButton = document.getElementById("installButton");
  if (!installButton) return;

  installButton.addEventListener("click", async () => {
    if (deferredPrompt) {
      // Браузер поддерживает установку
      try {
        // Показываем диалог установки
        const result = await deferredPrompt.prompt();
        // Ждем ответа пользователя
        await deferredPrompt.userChoice;
        // Очищаем сохраненное событие
        deferredPrompt = null;
      } catch (err) {
        console.error("Ошибка при установке:", err);
      }
    } else {
      // Браузер не поддерживает установку или приложение уже установлено
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);

      let message = "Как установить приложение на ваше устройство:\n\n";

      if (isIOS) {
        message +=
          '1. Нажмите кнопку "Поделиться" внизу экрана (значок квадратика со стрелочкой 📤)\n\n';
        message +=
          '2. В появившемся меню пролистайте нижний ряд иконок вправо, пока не увидите "На экран «Домой»"\n\n';
        message += '3. Нажмите "На экран «Домой»", затем "Добавить"\n\n';
        message +=
          "Готово! Теперь приложение будет доступно на главном экране вашего iPhone или iPad как обычное приложение 📱";
      } else if (isAndroid) {
        message +=
          "1. Посмотрите вверх экрана. Справа вы увидите три точки ⋮ (меню браузера)\n\n";
        message += "2. Нажмите на эти три точки\n\n";
        message +=
          '3. В появившемся меню найдите и нажмите "Установить приложение" или "Добавить на главный экран"\n\n';
        message +=
          "Готово! Приложение появится на главном экране вашего телефона 📱";
      } else {
        message +=
          "1. Посмотрите в правый верхний угол браузера. Там вы увидите значок ⋮ или ⋯ (меню)\n\n";
        message += "2. Нажмите на этот значок\n\n";
        message +=
          '3. Найдите в меню пункт "Установить приложение" или "Добавить на рабочий стол"\n\n';
        message +=
          "Готово! Теперь вы сможете запускать приложение прямо с рабочего стола компьютера 🖥️";
      }

      alert(message);
    }
  });
}

// Функция для форматирования даты
function formatDate(dateString) {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateString).toLocaleDateString("ru-RU", options);
}

// Функция для форматирования значения
function formatValue(value) {
  if (value === undefined || value === null) return "?";
  if (typeof value === "boolean") return value ? "✓" : "✕";
  return value;
}

// Инициализация приложения
import "./ui.js";

document.addEventListener("DOMContentLoaded", async () => {
  initNavigation();
  loadTheoryData();
  registerServiceWorker();
  initSettings();
  initInstallButton();

  const diaryPage = document.getElementById("diary");
  const diaryHistoryContainer = document.createElement("div");
  diaryHistoryContainer.classList.add("diary-history");
  diaryPage.appendChild(diaryHistoryContainer);

  const diaryEntries = await getAllDiaryEntries();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  diaryEntries
    .filter((entry) => new Date(entry.date) >= oneWeekAgo)
    .sort((a, b) => new Date(b.date) - new Date(a.date)) // Сортировка по убыванию даты
    .forEach((entry) => {
      const entryElement = document.createElement("div");
      entryElement.classList.add("diary-entry");

      const dateElement = document.createElement("h2");
      dateElement.textContent = formatDate(entry.date);
      entryElement.appendChild(dateElement);

      // Добавляем отображение состояния заполнения дневника
      const filledTodayElement = document.createElement("div");
      filledTodayElement.classList.add("entry-filled-today");
      filledTodayElement.style.backgroundColor = "#e0e0e0";
      filledTodayElement.style.padding = "5px";
      filledTodayElement.style.borderRadius = "5px";
      filledTodayElement.style.marginBottom = "10px";
      filledTodayElement.textContent = entry.isFilledToday
        ? "Дневник заполнен сегодня? ✓"
        : "Дневник заполнен сегодня? ✕";
      entryElement.appendChild(filledTodayElement);

      // Добавляем отображение состояний на плашку
      const statesElement = document.createElement("div");
      statesElement.classList.add("entry-states");
      statesElement.style.backgroundColor = "#f0f0f0";
      statesElement.style.padding = "10px";
      statesElement.style.borderRadius = "5px";
      statesElement.style.marginBottom = "10px";
      statesElement.innerHTML = `
        <div class="entry-state" style="font-weight: normal;">
          Эмоциональное состояние: ${formatValue(entry.states.emotional)}
        </div>
        <div class="entry-state" style="font-weight: normal;">
          Физическое состояние: ${formatValue(entry.states.physical)}
        </div>
        <div class="entry-state" style="font-weight: normal;">
          Удовольствие: ${formatValue(entry.states.pleasure)}
        </div>
      `;
      entryElement.appendChild(statesElement);

      entry.behaviors.forEach((behavior) => {
        const behaviorElement = document.createElement("div");
        behaviorElement.classList.add("entry-item");

        const nameElement = document.createElement("div");
        nameElement.classList.add("entry-label");
        nameElement.textContent = behavior.name;
        behaviorElement.appendChild(nameElement);

        const desireElement = document.createElement("div");
        desireElement.classList.add("entry-value");
        desireElement.textContent = `Желание: ${formatValue(behavior.desire)}`;
        behaviorElement.appendChild(desireElement);

        const actionElement = document.createElement("div");
        actionElement.classList.add("entry-value");
        actionElement.textContent = `Действие: ${formatValue(behavior.action)}`;
        behaviorElement.appendChild(actionElement);

        entryElement.appendChild(behaviorElement);
      });

      diaryHistoryContainer.appendChild(entryElement);
    });
});
