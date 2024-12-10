export class SkillsApp {
  constructor() {
    console.log('Initializing SkillsApp...');
    this.skillList = document.querySelector(".skill-list");
    this.bottomNav = document.querySelector(".bottom-nav");
    this.currentView = "theory"; // Set initial view

    // Добавляем ссылки на элементы принципа
    this.principleCard = document.querySelector(".principle-card");
    this.principleHeader = document.querySelector(".principle-header");
    this.principleTitle = document.querySelector(".principle-title");
    this.principleDescription = document.querySelector(
      ".principle-description"
    );
    this.principleImplications = document.querySelector(
      ".principle-implications"
    );
    this.principleApplication = document.querySelector(
      ".principle-application"
    );

    this.behaviors = null;
    this.currentEntry = {};

    this.setupEventListeners();
    this.loadData();
  }

  setupEventListeners() {
    // Навигация
    this.bottomNav.addEventListener("click", (e) => {
      const navItem = e.target.closest(".nav-item");
      if (!navItem) return;

      const view = navItem.dataset.view;
      if (view) {
        this.switchView(view);
      }
    });
  }

  switchView(view) {
    // Remove active class from all nav items
    this.bottomNav.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.remove("active");
    });

    // Add active class to selected nav item
    const activeNav = this.bottomNav.querySelector(`[data-view="${view}"]`);
    if (activeNav) {
      activeNav.classList.add("active");
    }

    // Hide all content first
    this.skillList.style.display = "none";
    if (this.principleCard) {
      this.principleCard.style.display = "none";
    }

    // Show selected view content
    switch (view) {
      case "theory":
        this.skillList.style.display = "block";
        this.renderSkills();
        break;
      case "practice":
        if (this.principleCard) {
          this.principleCard.style.display = "block";
          this.showRandomPrinciple();
        }
        break;
      case "diary":
        this.skillList.style.display = "block";
        this.renderDiary();
        break;
      case "settings":
        this.skillList.style.display = "block";
        this.renderSettings();
        break;
    }

    this.currentView = view;
  }

  async loadData() {
    try {
      console.log('Loading data...');
      const [skillsResponse, principlesResponse, behaviorsResponse, versionResponse] =
        await Promise.all([
          fetch("./data/skills.json"),
          fetch("./data/principles.json"),
          fetch("./data/behaviors.json"),
          fetch("./data/version.json"),
        ]);

      if (!skillsResponse.ok) {
        throw new Error(`Failed to load skills.json: ${skillsResponse.status}`);
      }

      this.skills = await skillsResponse.json();
      this.principles = await principlesResponse.json();
      this.behaviors = await behaviorsResponse.json();
      this.version = await versionResponse.json();

      console.log('Data loaded:', { skills: this.skills, principles: this.principles, version: this.version });

      this.renderSkills();
      this.setupPrincipleCard();
      this.showRandomPrinciple();
    } catch (error) {
      console.error('Error loading data:', error);
      this.skillList.innerHTML = `<div class="error-message">Ошибка загрузки данных: ${error.message}</div>`;
    }
  }

  renderSkills() {
    console.log('Rendering skills...', { currentView: this.currentView, skills: this.skills });
    if (this.currentView !== "theory" || !this.skills) {
      console.log('Skipping render - wrong view or no skills');
      return;
    }
    
    this.skillList.innerHTML = "";
    
    this.skills.categories.forEach(category => {
      console.log('Rendering category:', category.title);
      const categorySection = document.createElement("section");
      categorySection.className = "category-section";
      
      const categoryHeader = document.createElement("div");
      categoryHeader.className = "category-header";
      categoryHeader.innerHTML = `
        <i class="ph ph-${category.icon}"></i>
        <h2>${category.title}</h2>
      `;
      categorySection.appendChild(categoryHeader);

      if (category.skillGroups) {
        category.skillGroups.forEach(group => {
          console.log('Rendering skill group:', group.title);
          const groupContainer = document.createElement("div");
          groupContainer.className = "skill-group";
          
          const groupHeader = document.createElement("h3");
          groupHeader.className = "group-header";
          groupHeader.textContent = group.title;
          groupContainer.appendChild(groupHeader);

          const skillsGrid = document.createElement("div");
          skillsGrid.className = "skills-grid";
          
          // Display only first 4 skills
          const skillsToShow = group.skills.slice(0, 4);
          skillsToShow.forEach(skill => {
            console.log('Adding skill to group:', skill.title);
            const skillCard = this.createSkillCard(skill);
            skillsGrid.appendChild(skillCard);
          });
          
          groupContainer.appendChild(skillsGrid);
          categorySection.appendChild(groupContainer);
        });
      } else if (category.skills) {
        const skillsGrid = document.createElement("div");
        skillsGrid.className = "skills-grid";
        
        // Display only first 4 skills
        const skillsToShow = category.skills.slice(0, 4);
        skillsToShow.forEach(skill => {
          console.log('Adding skill to category:', skill.title);
          const skillCard = this.createSkillCard(skill);
          skillsGrid.appendChild(skillCard);
        });
        
        categorySection.appendChild(skillsGrid);
      }
      
      this.skillList.appendChild(categorySection);
    });
  }

  createSkillCard(skill) {
    const card = document.createElement("div");
    card.className = "skill-card";
    card.innerHTML = `
      <h4 class="skill-title">${skill.title}</h4>
    `;
    
    card.addEventListener("click", () => this.showSkillDetail(skill));
    return card;
  }

  showSkillDetail(skill) {
    // Create and append detail view
    const detailView = document.createElement("div");
    detailView.className = "skill-detail-view slide-in";
    
    detailView.innerHTML = `
      <div class="detail-header">
        <button class="back-button">
          <i class="ph ph-arrow-left"></i>
        </button>
        <h2>${skill.title}</h2>
      </div>
      <div class="detail-content">
        <p class="description">${skill.description}</p>
        ${skill.practices ? `
          <h3>Практики</h3>
          <ul class="practices-list">
            ${skill.practices.map(practice => `<li>${practice}</li>`).join("")}
          </ul>
        ` : ""}
      </div>
    `;
    
    document.body.appendChild(detailView);
    
    // Add animation frame to trigger transition
    requestAnimationFrame(() => {
      detailView.classList.add("active");
    });
    
    // Handle back button
    const backButton = detailView.querySelector(".back-button");
    backButton.addEventListener("click", () => {
      detailView.classList.remove("active");
      setTimeout(() => {
        detailView.remove();
      }, 300); // Match transition duration
    });
  }

  setupPrincipleCard() {
    if (this.principleHeader) {
      this.principleHeader.addEventListener("click", () => {
        this.principleHeader.classList.toggle("expanded");
      });
    }
  }

  showRandomPrinciple() {
    if (
      this.principles &&
      this.principles.principles &&
      this.principles.principles.length > 0
    ) {
      const randomIndex = Math.floor(
        Math.random() * this.principles.principles.length
      );
      const principle = this.principles.principles[randomIndex];

      if (this.principleTitle) {
        this.principleTitle.textContent = principle.title;
      }
      if (this.principleDescription) {
        this.principleDescription.textContent = principle.description;
      }
      if (this.principleImplications) {
        this.principleImplications.innerHTML = principle.implications
          .map((imp) => `<p>• ${imp}</p>`)
          .join("");
      }
      if (this.principleApplication) {
        this.principleApplication.textContent = principle.application;
      }
    }
  }

  renderSettings() {
    const notificationsEnabled =
      localStorage.getItem("notificationsEnabled") === "true";
    const notificationTime =
      localStorage.getItem("notificationTime") || "09:00";

    const nextNotificationTime = notificationsEnabled 
      ? this.formatNextNotificationTime(notificationTime)
      : "";

    this.skillList.innerHTML = `
      <div class="settings-container">
        <div class="settings-section">
          <h2>Настройки</h2>
          <div class="setting-item">
            <label class="switch">
              <input type="checkbox" id="notifications-toggle" ${
                notificationsEnabled ? "checked" : ""
              }>
              <span class="slider round"></span>
            </label>
            <span>Включить ежедневные напоминания о заполнении дневника</span>
          </div>
          <div class="setting-item ${notificationsEnabled ? "" : "disabled"}">
            <label for="notification-time">Время напоминания:</label>
            <input type="time" id="notification-time" value="${notificationTime}" 
              ${notificationsEnabled ? "" : "disabled"}>
          </div>
          ${notificationsEnabled ? `
            <div class="setting-item notification-next-time">
              <i class="ph ph-clock"></i>
              <span>Напоминание о заполнении дневника будет отправлено ${nextNotificationTime}</span>
            </div>
            <div class="notification-description">
              <i class="ph ph-info"></i>
              <span>Каждый день в указанное время вы будете получать напоминание записать наблюдения за день в дневник</span>
            </div>
            <button class="test-notification-btn">
              <i class="ph ph-bell-ringing"></i>
              Проверить уведомление
            </button>
          ` : ''}
        </div>

        <div class="install-section">
          <h2>Установка</h2>
          <p>
            Установите приложение на ваше устройство для быстрого доступа и работы в офлайн режиме
          </p>
        </div>

        <div class="about-section">
          <div class="version-info">
            <i class="ph ph-info"></i>
            <span>Версия ${this.version?.version || '1.0.0'}</span>
          </div>
          ${this.isIOS() ? `
            <div class="device-info">
              <i class="ph ph-device-mobile"></i>
              <span>iOS ${this.getIOSVersion()}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // Add event listeners
    const toggle = this.skillList.querySelector("#notifications-toggle");
    const timeInput = this.skillList.querySelector("#notification-time");
    const testButton = this.skillList.querySelector(".test-notification-btn");

    if (toggle) {
      toggle.addEventListener("change", (e) => {
        const enabled = e.target.checked;
        localStorage.setItem("notificationsEnabled", enabled);

        if (timeInput) {
          timeInput.disabled = !enabled;
          timeInput
            .closest(".setting-item")
            .classList.toggle("disabled", !enabled);
        }

        if (enabled) {
          this.requestNotificationPermission();
        } else {
          this.cancelNotification();
        }
        
        this.renderSettings();
      });
    }

    if (timeInput) {
      timeInput.addEventListener("change", (e) => {
        const time = e.target.value;
        localStorage.setItem("notificationTime", time);
        this.scheduleNotification(time);
        this.updateNextNotificationText();
      });
    }

    if (testButton) {
      testButton.addEventListener("click", () => {
        if (Notification.permission === "granted") {
          this.showNotification();
        } else {
          this.requestNotificationPermission().then(() => {
            if (Notification.permission === "granted") {
              this.showNotification();
            }
          });
        }
      });
    }
  }

  renderDiary() {
    const behaviors = this.behaviors || { categories: [] };
    const entries = JSON.parse(localStorage.getItem("diaryEntries") || "[]");

    this.currentEntry = {}; // Reset current entry

    this.skillList.innerHTML = `
      <div class="diary-container">
        <div class="diary-form">
          <div class="tracking-table">
            <table>
              <tr>
                <td colspan="2" class="category-header">
                  ${behaviors.categories[0].title}
                </td>
              </tr>
              ${behaviors.categories[0].behaviors
                .map(
                  (behavior) => `
                <tr>
                  <td>${behavior.name}</td>
                  <td>
                    ${this.renderMeasurementInput(behavior)}
                  </td>
                </tr>
              `
                )
                .join("")}
              <tr>
                <td colspan="2" class="category-header">
                  ${behaviors.categories[1].title}
                </td>
              </tr>
              ${behaviors.categories[1].behaviors
                .map(
                  (behavior) => `
                <tr>
                  <td>${behavior.name}</td>
                  <td>
                    ${this.renderMeasurementInput(behavior)}
                  </td>
                </tr>
              `
                )
                .join("")}
            </table>
          </div>
          
          <button class="add-behavior-btn">
            + Добавить проблемное поведение
          </button>

          <button class="add-entry-btn">Добавить запись</button>
        </div>

        <div class="entries-section">
          <div class="entries-header">
            <h2>История записей</h2>
            <button class="export-btn" title="Экспорт в CSV">
              <i class="ph ph-download"></i> Экспорт
            </button>
          </div>

          <div class="tracking-table">
            <table>
              <tr>
                <td colspan="${entries.length + 1}" class="category-header">
                  ${behaviors.categories[0].title}
                </td>
              </tr>
              ${behaviors.categories[0].behaviors
                .map(
                  (behavior) => `
                <tr>
                  <td>${behavior.name}</td>
                  ${entries
                    .map(
                      (entry) => `
                    <td>
                      ${this.formatMeasurementValue(
                        entry.measurements[behavior.id],
                        behavior.measurementType
                      )}
                    </td>
                  `
                    )
                    .join("")}
                </tr>
              `
                )
                .join("")}
              <tr>
                <td colspan="${entries.length + 1}" class="category-header">
                  ${behaviors.categories[1].title}
                </td>
              </tr>
              ${behaviors.categories[1].behaviors
                .map(
                  (behavior) => `
                <tr>
                  <td>${behavior.name}</td>
                  ${entries
                    .map(
                      (entry) => `
                    <td>
                      ${this.formatMeasurementValue(
                        entry.measurements[behavior.id],
                        behavior.measurementType
                      )}
                    </td>
                  `
                    )
                    .join("")}
                </tr>
              `
                )
                .join("")}
            </table>
          </div>
        </div>
      </div>
    `;

    this.setupDiaryEventListeners();
  }

  renderMeasurementInput(behavior) {
    switch (behavior.measurementType) {
      case "binary":
        return `
          <div class="binary-input" data-behavior-id="${behavior.id}">
            <select>
              <option value="">Выберите</option>
              <option value="0">нет</option>
              <option value="1">да</option>
            </select>
          </div>
        `;
      case "scale":
        return `
          <div class="scale-input" data-behavior-id="${behavior.id}">
            <select>
              <option value="">Выберите</option>
              ${[0, 1, 2, 3, 4, 5]
                .map(
                  (value) => `
                <option value="${value}">${value}</option>
              `
                )
                .join("")}
            </select>
          </div>
        `;
      case "text":
        return `
          <div class="text-input" data-behavior-id="${behavior.id}">
            <input type="text" placeholder="Введите значение">
          </div>
        `;
    }
  }

  setupDiaryEventListeners() {
    // Scale inputs
    this.skillList.querySelectorAll(".scale-input select").forEach((select) => {
      select.addEventListener("change", () => {
        const behaviorId = select.closest(".scale-input").dataset.behaviorId;
        const value = select.value ? parseInt(select.value) : null;
        this.currentEntry[behaviorId] = value;
      });
    });

    // Binary inputs
    this.skillList
      .querySelectorAll(".binary-input select")
      .forEach((select) => {
        select.addEventListener("change", () => {
          const behaviorId = select.closest(".binary-input").dataset.behaviorId;
          const value = select.value ? parseInt(select.value) : null;
          this.currentEntry[behaviorId] = value;
        });
      });

    // Text inputs
    this.skillList.querySelectorAll(".text-input input").forEach((input) => {
      input.addEventListener("input", () => {
        const behaviorId = input.closest(".text-input").dataset.behaviorId;
        this.currentEntry[behaviorId] = input.value.trim();
      });
    });

    // Add behavior button
    const addBehaviorBtn = this.skillList.querySelector(".add-behavior-btn");
    if (addBehaviorBtn) {
      addBehaviorBtn.addEventListener("click", () => {
        this.showAddBehaviorModal();
      });
    }

    // Add entry button
    const addEntryBtn = this.skillList.querySelector(".add-entry-btn");
    if (addEntryBtn) {
      addEntryBtn.addEventListener("click", () => {
        this.addDiaryEntry();
      });
    }
  }

  showAddBehaviorModal() {
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-content">
        <h3>Добавить проблемное поведение</h3>
        <div class="form-group">
          <label>Название поведения</label>
          <input type="text" id="behavior-name" placeholder="Введите название">
        </div>
        <div class="form-group">
          <label>Тип измерения для действия</label>
          <select id="action-type">
            <option value="binary">Было/не было</option>
            <option value="scale">Шкала (0-5)</option>
            <option value="text">Произвольный текст</option>
          </select>
        </div>
        <div class="modal-buttons">
          <button class="cancel-btn">Отмена</button>
          <button class="confirm-btn">Добавить</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close modal on cancel
    modal.querySelector(".cancel-btn").addEventListener("click", () => {
      document.body.removeChild(modal);
    });

    // Add behavior on confirm
    modal.querySelector(".confirm-btn").addEventListener("click", () => {
      const name = modal.querySelector("#behavior-name").value.trim();
      const actionType = modal.querySelector("#action-type").value;

      if (name) {
        this.addNewBehavior(name, actionType);
        document.body.removeChild(modal);
      }
    });
  }

  addNewBehavior(name, actionType) {
    const id = "behavior_" + Date.now();

    // Add to urges category with fixed scale type
    this.behaviors.categories[0].behaviors.push({
      id: id + "_urge",
      name: name,
      measurementType: "scale",
    });

    // Add to actions category with selected type
    this.behaviors.categories[1].behaviors.push({
      id: id + "_action",
      name: name,
      measurementType: actionType,
    });

    // Save behaviors
    localStorage.setItem("behaviors", JSON.stringify(this.behaviors));

    // Refresh the interface
    this.renderDiary();
  }

  addDiaryEntry() {
    // Get all selected values
    const measurements = this.currentEntry;

    // Check if at least one value is selected
    if (Object.keys(measurements).length === 0) {
      alert("Пожалуйста, выберите хотя бы одно значение");
      return;
    }

    // Create new entry
    const entry = {
      date: new Date().toISOString(),
      measurements: measurements,
    };

    // Get existing entries
    const entries = JSON.parse(localStorage.getItem("diaryEntries") || "[]");
    entries.push(entry);

    // Save entries
    localStorage.setItem("diaryEntries", JSON.stringify(entries));

    // Reset current entry and refresh
    this.currentEntry = {};
    this.renderDiary();
  }

  formatMeasurementValue(value, type) {
    if (!value) return "";
    switch (type) {
      case "binary":
        return value === 1 ? "да" : "нет";
      case "scale":
        return value;
      case "text":
        return value;
      default:
        return value;
    }
  }

  getNextNotificationTime(time) {
    if (!time) return null;

    const [hours, minutes] = time.split(":");
    const now = new Date();
    const notificationTime = new Date(now);
    
    notificationTime.setHours(parseInt(hours, 10));
    notificationTime.setMinutes(parseInt(minutes, 10));
    notificationTime.setSeconds(0);

    if (notificationTime <= now) {
      notificationTime.setDate(notificationTime.getDate() + 1);
    }

    return notificationTime;
  }

  formatNextNotificationTime(time) {
    const nextTime = this.getNextNotificationTime(time);
    if (!nextTime) return "";

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = nextTime.getDate() === today.getDate();
    const date = isToday ? "сегодня" : "завтра";
    const formattedTime = nextTime.toLocaleTimeString("ru", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });

    return `${date} в ${formattedTime}`;
  }

  isIOS() {
    return [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ].includes(navigator.platform)
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
  }

  getIOSVersion() {
    if (!this.isIOS()) return null;
    
    const match = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
    if (match) {
      return parseFloat(match[1] + '.' + match[2]);
    }
    return null;
  }

  isPWAInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone;
  }

  async requestNotificationPermission() {
    try {
      const isIOS = this.isIOS();
      const iOSVersion = this.getIOSVersion();
      const isPWA = this.isPWAInstalled();

      if (isIOS) {
        if (iOSVersion < 16.4) {
          alert("Для работы уведомлений требуется iOS 16.4 или выше");
          return;
        }
        
        if (!isPWA) {
          const installPrompt = confirm(
            "Для работы уведомлений необходимо установить приложение на главный экран. " +
            "Показать инструкцию по установке?"
          );
          
          if (installPrompt) {
            this.showIOSInstallInstructions();
          }
          return;
        }
      }

      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        localStorage.setItem("notificationsEnabled", "true");
        this.scheduleNotification(localStorage.getItem("notificationTime") || "09:00");
        this.renderSettings();
      } else {
        localStorage.setItem("notificationsEnabled", "false");
        const toggle = document.querySelector("#notifications-toggle");
        if (toggle) toggle.checked = false;
        alert("Для работы уведомлений необходимо предоставить разрешение");
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      localStorage.setItem("notificationsEnabled", "false");
      const toggle = document.querySelector("#notifications-toggle");
      if (toggle) toggle.checked = false;
      alert("Произошла ошибка при настройке уведомлений");
    }
  }

  showIOSInstallInstructions() {
    const modal = document.createElement('div');
    modal.className = 'ios-install-modal';
    modal.innerHTML = `
      <div class="ios-install-content">
        <h3>Как установить приложение на iOS:</h3>
        <ol>
          <li>Нажмите кнопку <i class="ph ph-share-network"></i> «Поделиться»</li>
          <li>Прокрутите вниз и выберите «На экран "Домой"»</li>
          <li>Нажмите «Добавить»</li>
        </ol>
        <p>После установки откройте приложение с главного экрана для настройки уведомлений.</p>
        <button class="close-modal">Закрыть</button>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.close-modal').addEventListener('click', () => {
      modal.remove();
    });
  }

  async scheduleNotification(time) {
    // Отменяем предыдущее уведомление если оно было
    this.cancelNotification();
    
    if (!time) return;

    const [hours, minutes] = time.split(":");
    const now = new Date();
    const notificationTime = new Date(now);
    
    // Устанавливаем время уведомления
    notificationTime.setHours(parseInt(hours, 10));
    notificationTime.setMinutes(parseInt(minutes, 10));
    notificationTime.setSeconds(0);

    // Если время уже прошло, переносим на следующий день
    if (notificationTime <= now) {
      notificationTime.setDate(notificationTime.getDate() + 1);
    }

    // Создаем таймер
    this.notificationTimer = setTimeout(() => {
      this.showNotification();
      // Планируем следующее уведомление на завтра
      this.scheduleNotification(time);
    }, notificationTime.getTime() - now.getTime());
  }

  cancelNotification() {
    if (this.notificationTimer) {
      clearTimeout(this.notificationTimer);
      this.notificationTimer = null;
    }
  }

  showNotification() {
    if (Notification.permission === "granted") {
      new Notification("Дневник наблюдений", {
        body: "Пришло время записать наблюдения за сегодняшний день. Не забудьте отметить уровень желаний и действий.",
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
        tag: "diary-reminder",
        requireInteraction: true
      });
    }
  }
}

// Initialize app
let app;
document.addEventListener("DOMContentLoaded", () => {
  console.log('DOM loaded, initializing app...');
  app = new SkillsApp();
});
