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
        // Проверяем обновления при загрузке страницы
        registration.update();

        // Отслеживаем обновления
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;

          newWorker.addEventListener("statechange", () => {
            // Когда новый Service Worker активирован
            if (newWorker.state === "activated") {
              // Показываем уведомление об обновлении
              showUpdateNotification();
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
    const showAssumptions = localStorage.getItem('showAssumptions') !== 'false';
    if (showAssumptions) {
      renderAxioms(axiomsData);
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
        ${block.skills
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
          .join("")}
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

// Отображение случайного допущения
function renderAxioms(data) {
  const container = document.querySelector(".axioms-list");
  if (!container || !data.assumptions || data.assumptions.length === 0) return;

  // Выбираем случайное допущение
  const randomIndex = Math.floor(Math.random() * data.assumptions.length);
  const randomAssumption = data.assumptions[randomIndex];

  container.innerHTML = `
    <div class="assumption-card">
      <div class="assumption-text">${randomAssumption.text}</div>
      <div class="assumption-title">${randomAssumption.title}</div>
    </div>
  `;
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
  const showAssumptionsToggle = document.getElementById('show-assumptions');
  if (showAssumptionsToggle) {
    // Устанавливаем начальное состояние
    const showAssumptions = localStorage.getItem('showAssumptions') !== 'false';
    showAssumptionsToggle.checked = showAssumptions;

    // Добавляем обработчик изменений
    showAssumptionsToggle.addEventListener('change', (e) => {
      const showAssumptions = e.target.checked;
      localStorage.setItem('showAssumptions', showAssumptions);
      
      // Обновляем отображение допущений
      const assumptionsContainer = document.querySelector('.axioms-list');
      if (assumptionsContainer) {
        if (showAssumptions) {
          loadTheoryData(); // Перезагружаем данные для отображения допущения
        } else {
          assumptionsContainer.innerHTML = ''; // Очищаем контейнер
        }
      }
    });
  }
}

// Инициализация приложения
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  loadTheoryData();
  registerServiceWorker();
  initSettings();
});
