import { getAllDiaryEntries } from "./behaviors.js";
import { formatDate } from "./app.js";

// Функция для форматирования значения
function formatValue(value) {
  if (value === undefined || value === null) return "?";
  if (typeof value === "boolean") return value ? "✓" : "✕";
  return value;
}

// Функция для обновления истории дневника
export async function updateDiaryHistory() {
  const diaryPage = document.getElementById("diary");
  const diaryHistoryContainer = diaryPage.querySelector(".diary-history");
  if (!diaryHistoryContainer) return;

  // Очищаем текущую историю
  diaryHistoryContainer.innerHTML = "";

  const diaryEntries = await getAllDiaryEntries();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  diaryEntries
    .filter((entry) => new Date(entry.date) >= oneWeekAgo)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach((entry) => {
      const entryElement = document.createElement("div");
      entryElement.classList.add("diary-entry");

      const dateElement = document.createElement("h2");
      dateElement.textContent = formatDate(entry.date);
      entryElement.appendChild(dateElement);

      const filledTodayElement = document.createElement("div");
      filledTodayElement.classList.add("entry-filled-today");
      filledTodayElement.textContent = entry.isFilledToday
        ? "Дневник заполнен сегодня? ✓"
        : "Дневник заполнен сегодня? ✕";
      entryElement.appendChild(filledTodayElement);

      const statesElement = document.createElement("div");
      statesElement.classList.add("entry-states");
      statesElement.innerHTML = `
        <div class="entry-state">
          Эмоциональное состояние: ${formatValue(entry.states.emotional)}
        </div>
        <div class="entry-state">
          Физическое состояние: ${formatValue(entry.states.physical)}
        </div>
        <div class="entry-state">
          Удовольствие: ${formatValue(entry.states.pleasure)}
        </div>
      `;
      entryElement.appendChild(statesElement);

      entry.behaviors.forEach((behavior) => {
        const behaviorElement = document.createElement("div");
        behaviorElement.classList.add("behavior-entry");
        behaviorElement.innerHTML = `
          <h3>${behavior.name}</h3>
          <p>Желание: ${formatValue(behavior.desire)}</p>
          <p>Действие: ${formatValue(behavior.action)}</p>
        `;
        entryElement.appendChild(behaviorElement);
      });

      diaryHistoryContainer.appendChild(entryElement);
    });
}
