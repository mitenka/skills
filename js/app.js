class SkillsApp {
  constructor() {
    this.skillList = document.querySelector('.skill-list');
    this.bottomNav = document.querySelector('.bottom-nav');
    this.currentView = null;
    
    // Добавляем ссылки на элементы принципа
    this.principleCard = document.querySelector('.principle-card');
    this.principleHeader = document.querySelector('.principle-header');
    this.principleTitle = document.querySelector('.principle-title');
    this.principleDescription = document.querySelector('.principle-description');
    this.principleImplications = document.querySelector('.principle-implications');
    this.principleApplication = document.querySelector('.principle-application');

    this.behaviors = null;
    this.currentEntry = {};

    this.setupEventListeners();
    this.loadData().then(() => {
      this.switchView('theory');
    });
  }

  setupEventListeners() {
    // Навигация
    this.bottomNav.addEventListener('click', (e) => {
      const navItem = e.target.closest('.nav-item');
      if (!navItem) return;

      const view = navItem.dataset.view;
      if (view) {
        this.switchView(view);
      }
    });
  }

  switchView(view) {
    // Remove active class from all nav items
    this.bottomNav.querySelectorAll('.nav-item').forEach((item) => {
      item.classList.remove('active');
    });

    // Add active class to selected nav item
    const activeNav = this.bottomNav.querySelector(`[data-view="${view}"]`);
    if (activeNav) {
      activeNav.classList.add('active');
    }

    // Hide all content first
    this.skillList.style.display = 'none';
    if (this.principleCard) {
      this.principleCard.style.display = 'none';
    }

    // Show selected view content
    switch (view) {
      case 'theory':
        this.skillList.style.display = 'block';
        this.renderSkills();
        break;
      case 'practice':
        if (this.principleCard) {
          this.principleCard.style.display = 'block';
          this.showRandomPrinciple();
        }
        break;
      case 'diary':
        this.skillList.style.display = 'block';
        this.renderDiary();
        break;
      case 'settings':
        this.skillList.style.display = 'block';
        this.renderSettings();
        break;
    }

    this.currentView = view;
  }

  async loadData() {
    try {
      const [skillsResponse, principlesResponse, behaviorsResponse] = await Promise.all([
        fetch('data/skills.json'),
        fetch('data/principles.json'),
        fetch('data/behaviors.json')
      ]);

      this.skills = await skillsResponse.json();
      this.principles = await principlesResponse.json();
      this.behaviors = await behaviorsResponse.json();

      this.renderSkills();
      this.setupPrincipleCard();
      this.showRandomPrinciple();
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  renderSkills() {
    if (!this.skills || !this.skills.categories) return;

    this.skillList.innerHTML = this.skills.categories
      .map(category => `
        <div class="category-section ${category.unlocked ? 'unlocked' : 'locked'}">
          <h2 class="category-title">${category.title}</h2>
          ${category.unlocked
            ? category.skillGroups
              ? this.renderSkillGroups(category.skillGroups)
              : this.renderSkillList(category.skills)
            : this.renderLockedSkillList()
          }
        </div>
      `)
      .join('');
  }

  renderSkillGroups(groups) {
    return groups
      .map(group => `
        <div class="skill-group">
          <h3 class="group-title">${group.title}</h3>
          ${this.renderSkillList(group.skills)}
        </div>
      `)
      .join('');
  }

  renderSkillList(skills) {
    return skills
      .map(skill => `
        <div class="skill-card">
          <div class="skill-header">
            <h5>${skill.title}</h5>
            ${skill.level ? `<span class="skill-level">${skill.level}</span>` : ''}
          </div>
          ${skill.description ? `<p class="skill-description">${skill.description}</p>` : ''}
          ${skill.tasks ? `
            <div class="skill-tasks">
              <h6>Задачи:</h6>
              <ul>
                ${skill.tasks.map(task => `<li>${task}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      `)
      .join('');
  }

  renderLockedSkillList() {
    return `
      <div class="skill-card locked-skill">
        <div class="lock-icon">
          <i class="ph ph-lock"></i>
        </div>
        <p>Этот раздел пока заблокирован</p>
      </div>
    `;
  }

  setupPrincipleCard() {
    if (this.principleHeader) {
      this.principleHeader.addEventListener('click', () => {
        this.principleHeader.classList.toggle('expanded');
      });
    }
  }

  showRandomPrinciple() {
    if (this.principles && this.principles.principles && this.principles.principles.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.principles.principles.length);
      const principle = this.principles.principles[randomIndex];

      if (this.principleTitle) {
        this.principleTitle.textContent = principle.title;
      }
      if (this.principleDescription) {
        this.principleDescription.textContent = principle.description;
      }
      if (this.principleImplications) {
        this.principleImplications.innerHTML = principle.implications
          .map(imp => `<p>• ${imp}</p>`)
          .join('');
      }
      if (this.principleApplication) {
        this.principleApplication.textContent = principle.application;
      }
    }
  }

  renderSettings() {
    const notificationsEnabled = localStorage.getItem('notificationsEnabled') === 'true';
    const notificationTime = localStorage.getItem('notificationTime') || '09:00';
    
    this.skillList.innerHTML = `
      <div class="settings-container">
        <div class="settings-section">
          <h2>Уведомления</h2>
          <div class="setting-item">
            <label class="switch">
              <input type="checkbox" id="notifications-toggle" ${notificationsEnabled ? 'checked' : ''}>
              <span class="slider round"></span>
            </label>
            <span>Включить уведомления</span>
          </div>
          <div class="setting-item ${notificationsEnabled ? '' : 'disabled'}">
            <label for="notification-time">Время уведомления:</label>
            <input type="time" id="notification-time" value="${notificationTime}" 
              ${notificationsEnabled ? '' : 'disabled'}>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    const toggle = this.skillList.querySelector('#notifications-toggle');
    const timeInput = this.skillList.querySelector('#notification-time');

    if (toggle) {
      toggle.addEventListener('change', (e) => {
        const enabled = e.target.checked;
        localStorage.setItem('notificationsEnabled', enabled);
        
        if (timeInput) {
          timeInput.disabled = !enabled;
          timeInput.closest('.setting-item').classList.toggle('disabled', !enabled);
        }

        if (enabled) {
          this.requestNotificationPermission();
        } else {
          this.cancelNotification();
        }
      });
    }

    if (timeInput) {
      timeInput.addEventListener('change', (e) => {
        const time = e.target.value;
        localStorage.setItem('notificationTime', time);
        this.scheduleNotification(time);
      });
    }
  }

  renderDiary() {
    const behaviors = this.behaviors || { categories: [] };
    const entries = JSON.parse(localStorage.getItem('diaryEntries') || '[]');
    
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
              ${behaviors.categories[0].behaviors.map(behavior => `
                <tr>
                  <td>${behavior.name}</td>
                  <td>
                    ${this.renderMeasurementInput(behavior)}
                  </td>
                </tr>
              `).join('')}
              <tr>
                <td colspan="2" class="category-header">
                  ${behaviors.categories[1].title}
                </td>
              </tr>
              ${behaviors.categories[1].behaviors.map(behavior => `
                <tr>
                  <td>${behavior.name}</td>
                  <td>
                    ${this.renderMeasurementInput(behavior)}
                  </td>
                </tr>
              `).join('')}
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
              ${behaviors.categories[0].behaviors.map(behavior => `
                <tr>
                  <td>${behavior.name}</td>
                  ${entries.map(entry => `
                    <td>
                      ${this.formatMeasurementValue(entry.measurements[behavior.id], behavior.measurementType)}
                    </td>
                  `).join('')}
                </tr>
              `).join('')}
              <tr>
                <td colspan="${entries.length + 1}" class="category-header">
                  ${behaviors.categories[1].title}
                </td>
              </tr>
              ${behaviors.categories[1].behaviors.map(behavior => `
                <tr>
                  <td>${behavior.name}</td>
                  ${entries.map(entry => `
                    <td>
                      ${this.formatMeasurementValue(entry.measurements[behavior.id], behavior.measurementType)}
                    </td>
                  `).join('')}
                </tr>
              `).join('')}
            </table>
          </div>
        </div>
      </div>
    `;

    this.setupDiaryEventListeners();
  }

  renderMeasurementInput(behavior) {
    switch (behavior.measurementType) {
      case 'binary':
        return `
          <div class="binary-input" data-behavior-id="${behavior.id}">
            <select>
              <option value="">Выберите</option>
              <option value="0">нет</option>
              <option value="1">да</option>
            </select>
          </div>
        `;
      case 'scale':
        return `
          <div class="scale-input" data-behavior-id="${behavior.id}">
            <select>
              <option value="">Выберите</option>
              ${[0,1,2,3,4,5].map(value => `
                <option value="${value}">${value}</option>
              `).join('')}
            </select>
          </div>
        `;
      case 'text':
        return `
          <div class="text-input" data-behavior-id="${behavior.id}">
            <input type="text" placeholder="Введите значение">
          </div>
        `;
    }
  }

  setupDiaryEventListeners() {
    // Scale inputs
    this.skillList.querySelectorAll('.scale-input select').forEach(select => {
      select.addEventListener('change', () => {
        const behaviorId = select.closest('.scale-input').dataset.behaviorId;
        const value = select.value ? parseInt(select.value) : null;
        this.currentEntry[behaviorId] = value;
      });
    });

    // Binary inputs
    this.skillList.querySelectorAll('.binary-input select').forEach(select => {
      select.addEventListener('change', () => {
        const behaviorId = select.closest('.binary-input').dataset.behaviorId;
        const value = select.value ? parseInt(select.value) : null;
        this.currentEntry[behaviorId] = value;
      });
    });

    // Text inputs
    this.skillList.querySelectorAll('.text-input input').forEach(input => {
      input.addEventListener('input', () => {
        const behaviorId = input.closest('.text-input').dataset.behaviorId;
        this.currentEntry[behaviorId] = input.value.trim();
      });
    });

    // Add behavior button
    const addBehaviorBtn = this.skillList.querySelector('.add-behavior-btn');
    if (addBehaviorBtn) {
      addBehaviorBtn.addEventListener('click', () => {
        this.showAddBehaviorModal();
      });
    }

    // Add entry button
    const addEntryBtn = this.skillList.querySelector('.add-entry-btn');
    if (addEntryBtn) {
      addEntryBtn.addEventListener('click', () => {
        this.addDiaryEntry();
      });
    }
  }

  showAddBehaviorModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
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
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    // Add behavior on confirm
    modal.querySelector('.confirm-btn').addEventListener('click', () => {
      const name = modal.querySelector('#behavior-name').value.trim();
      const actionType = modal.querySelector('#action-type').value;
      
      if (name) {
        this.addNewBehavior(name, actionType);
        document.body.removeChild(modal);
      }
    });
  }

  addNewBehavior(name, actionType) {
    const id = 'behavior_' + Date.now();
    
    // Add to urges category with fixed scale type
    this.behaviors.categories[0].behaviors.push({
      id: id + '_urge',
      name: name,
      measurementType: 'scale'
    });

    // Add to actions category with selected type
    this.behaviors.categories[1].behaviors.push({
      id: id + '_action',
      name: name,
      measurementType: actionType
    });

    // Save behaviors
    localStorage.setItem('behaviors', JSON.stringify(this.behaviors));

    // Refresh the interface
    this.renderDiary();
  }

  addDiaryEntry() {
    // Get all selected values
    const measurements = this.currentEntry;

    // Check if at least one value is selected
    if (Object.keys(measurements).length === 0) {
      alert('Пожалуйста, выберите хотя бы одно значение');
      return;
    }

    // Create new entry
    const entry = {
      date: new Date().toISOString(),
      measurements: measurements
    };

    // Get existing entries
    const entries = JSON.parse(localStorage.getItem('diaryEntries') || '[]');
    entries.push(entry);

    // Save entries
    localStorage.setItem('diaryEntries', JSON.stringify(entries));

    // Reset current entry and refresh
    this.currentEntry = {};
    this.renderDiary();
  }

  formatMeasurementValue(value, type) {
    if (!value) return '';
    switch (type) {
      case 'binary':
        return value === 1 ? 'да' : 'нет';
      case 'scale':
        return value;
      case 'text':
        return value;
      default:
        return value;
    }
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  new SkillsApp();
});
