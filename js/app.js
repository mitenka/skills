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
      fetch("data/axioms.json"),
    ]);

    // Проверяем статус ответа
    if (!theoryResponse.ok || !axiomsResponse.ok) {
      throw new Error("Ошибка при загрузке данных");
    }

    const theoryData = await theoryResponse.json();
    const axiomsData = await axiomsResponse.json();

    renderTheoryBlocks(theoryData);
    renderAxioms(axiomsData);
  } catch (error) {
    console.error("Ошибка при загрузке данных:", error);
    // Показываем сообщение об ошибке только если действительно офлайн
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
    if (!points?.length) return '';
    
    return points.map(point => `
      <div class="point">
        <p>${point.text}</p>
        ${point.subpoints ? `
          <ul>
            ${point.subpoints.map(sub => `<li>${sub}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    `).join('');
  }

  container.innerHTML = data.blocks.map(block => `
    <div class="theory-block">
      <h2>${block.title}</h2>
      <div class="skills-grid">
        ${block.skills.map(skill => `
          <details class="skill-card">
            <summary class="skill-header">
              <div class="skill-title">
                <h3>${skill.name}</h3>
                ${skill.category ? `<span class="skill-category">${skill.category}</span>` : ''}
              </div>
            </summary>
            <div class="skill-details">
              ${renderPoints(skill.points)}
            </div>
          </details>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// Отображение аксиом
function renderAxioms(data) {
  const container = document.querySelector(".axioms-list");
  if (!container) return;

  const axiomsHTML = data.axioms
    .map(
      (axiom) => `
        <div class="axiom-card">
            <h3>${axiom.title}</h3>
            <p>${axiom.text}</p>
        </div>
    `
    )
    .join("");

  container.innerHTML = axiomsHTML;
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

// Инициализация приложения
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  loadTheoryData();
  registerServiceWorker();
});
