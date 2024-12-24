import { formatLocalDate, parseLocalDate, getWeekDates } from './ui.js';
import { db } from './db.js';

// Загрузка данных о навыках
async function loadTheoryData() {
  const response = await fetch('data/theory.json');
  const data = await response.json();
  return data.blocks;
}

// Загрузка практик для конкретной даты
async function loadPracticesForDate(date) {
  const dateStr = formatLocalDate(date);
  return await db.practices.where('date').equals(dateStr).toArray();
}

// Сохранение практики навыка
async function toggleSkillPractice(skillName, date, practiced) {
  const dateStr = formatLocalDate(date);
  
  if (practiced) {
    await db.practices.add({
      date: dateStr,
      skill: skillName,
      timestamp: new Date().toISOString()
    });
  } else {
    await db.practices.where({
      date: dateStr,
      skill: skillName
    }).delete();
  }
}

// Создание блоков навыков
async function createSkillsBlocks(selectedDate) {
  const container = document.querySelector('.skills-blocks');
  if (!container) return;

  // Очищаем контейнер
  container.innerHTML = '';
  
  // Загружаем данные о навыках и практиках
  const [blocks, practices] = await Promise.all([
    loadTheoryData(),
    loadPracticesForDate(selectedDate)
  ]);
  
  // Создаем множество практикуемых навыков для быстрого поиска
  const practicedSkills = new Set(practices.map(p => p.skill));
  
  // Создаем блоки навыков
  blocks.forEach(block => {
    const blockElement = document.createElement('div');
    blockElement.className = 'skills-block';
    
    blockElement.innerHTML = `
      <h2 class="skills-block-title">${block.title}</h2>
      <div class="skills-list">
        ${block.skills.map(skill => `
          <div class="skill-item">
            <span class="skill-name">${skill.name}</span>
            <button class="skill-toggle ${practicedSkills.has(skill.name) ? 'active' : ''}" 
                    data-skill="${skill.name}">
              <i class="ri-check-line"></i>
            </button>
          </div>
        `).join('')}
      </div>
    `;
    
    // Добавляем обработчики для кнопок
    blockElement.querySelectorAll('.skill-toggle').forEach(button => {
      button.addEventListener('click', async () => {
        const skillName = button.dataset.skill;
        const isActive = button.classList.contains('active');
        
        // Переключаем состояние кнопки
        button.classList.toggle('active');
        
        // Сохраняем изменение в базе данных
        await toggleSkillPractice(skillName, selectedDate, !isActive);
      });
    });
    
    container.appendChild(blockElement);
  });
}

// Функция для создания карточки с датами
function createDateButtons() {
  const dateButtons = document.querySelector('#practice .date-buttons');
  if (!dateButtons) return;

  // Очищаем контейнер
  dateButtons.innerHTML = '';
  
  // Получаем даты для текущей недели
  const dates = getWeekDates();
  const today = new Date();
  const todayStr = formatLocalDate(today);
  
  // Создаем кнопки для каждой даты
  dates.forEach(date => {
    const button = document.createElement('button');
    const dateValue = formatLocalDate(date);
    const isToday = dateValue === todayStr;
    
    button.className = `date-btn ${isToday ? 'active' : ''}`;
    button.dataset.date = dateValue;
    
    const weekday = date.toLocaleDateString('ru-RU', { weekday: 'short' });
    const dayNumber = date.getDate();
    
    button.innerHTML = `
      <span class="weekday">${weekday}</span>
      <span class="date">${dayNumber}</span>
    `;
    
    // Добавляем обработчик клика
    button.addEventListener('click', async () => {
      // Убираем активный класс у всех кнопок
      dateButtons.querySelectorAll('.date-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      
      // Добавляем активный класс текущей кнопке
      button.classList.add('active');
      
      // Обновляем список навыков для выбранной даты
      const selectedDate = parseLocalDate(dateValue);
      await createSkillsBlocks(selectedDate);
    });
    
    dateButtons.appendChild(button);
  });
  
  // Загружаем навыки для текущей даты
  createSkillsBlocks(today);
}

// Сброс на сегодняшнюю дату
async function resetToToday() {
  const dateButtons = document.querySelector('#practice .date-buttons');
  if (!dateButtons) return;

  // Убираем активный класс у всех кнопок
  dateButtons.querySelectorAll('.date-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Находим и активируем кнопку с сегодняшней датой
  const today = formatLocalDate(new Date());
  const todayButton = Array.from(dateButtons.querySelectorAll('.date-btn'))
    .find(btn => btn.dataset.date === today);

  if (todayButton) {
    todayButton.classList.add('active');
    await createSkillsBlocks(new Date());
  }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  createDateButtons();

  // Добавляем обработчик для навигации
  const practiceLink = document.querySelector('a[href="#practice"]');
  if (practiceLink) {
    practiceLink.addEventListener('click', () => {
      resetToToday();
    });
  }
});
