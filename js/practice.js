import { formatLocalDate, parseLocalDate, getWeekDates } from './ui.js';

// Функция для создания карточки с датами
function createDateButtons() {
  const dateButtons = document.querySelector('#practice .date-buttons');
  if (!dateButtons) return;

  // Очищаем контейнер
  dateButtons.innerHTML = '';
  
  // Получаем даты для текущей недели
  const dates = getWeekDates();
  
  // Создаем кнопки для каждой даты
  dates.forEach(date => {
    const button = document.createElement('button');
    const dateValue = formatLocalDate(date);
    const isToday = dateValue === formatLocalDate(new Date());
    
    button.className = `date-btn ${isToday ? 'active' : ''}`;
    button.dataset.date = dateValue;
    
    const weekday = date.toLocaleDateString('ru-RU', { weekday: 'short' });
    const dayNumber = date.getDate();
    
    button.innerHTML = `
      <span class="weekday">${weekday}</span>
      <span class="date">${dayNumber}</span>
    `;
    
    // Добавляем обработчик клика
    button.addEventListener('click', () => {
      // Убираем активный класс у всех кнопок
      dateButtons.querySelectorAll('.date-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      
      // Добавляем активный класс текущей кнопке
      button.classList.add('active');
      
      // Загружаем практики для выбранной даты
      const selectedDate = parseLocalDate(button.dataset.date);
      loadPracticeForDate(selectedDate);
    });
    
    dateButtons.appendChild(button);
  });
  
  // Загружаем практики для текущей даты
  loadPracticeForDate(new Date());
}

// Функция загрузки практик для выбранной даты
function loadPracticeForDate(date) {
  // Здесь будет логика загрузки практик для выбранной даты
  console.log('Loading practices for date:', formatLocalDate(date));
}

// Сброс на сегодняшнюю дату
function resetToToday() {
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
    loadPracticeForDate(new Date());
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
