// Импортируем Dexie
import { db } from "./db.js";
import { getAllDiaryEntries } from "./behaviors.js";

export async function exportToCSV(entries) {
  // Получаем все уникальные поведения
  const allBehaviors = new Set();
  entries.forEach((entry) => {
    entry.behaviors.forEach((b) => allBehaviors.add(b.name));
  });
  const behaviors = Array.from(allBehaviors);

  // Получаем даты для последних 7 дней
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date);
  }

  // Получаем информацию о периоде
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 6); // 6 дней назад для полных 7 дней с сегодняшним

  // Форматируем даты для заголовка
  const exportDate = today.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const periodStart = startDate.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const periodEnd = today.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Получаем дополнительную статистику
  const totalDays = entries.length;
  const daysWithEntries = entries.filter((e) => e.isFilledToday).length;
  const totalBehaviors = entries.reduce(
    (sum, entry) => sum + entry.behaviors.length,
    0
  );

  // Считаем дополнительную статистику
  const uniqueBehaviorsCount = behaviors.length;

  // Формируем строки CSV с метаинформацией
  const csvRows = [
    ["МЕТАИНФОРМАЦИЯ"],
    [`Дата экспорта: ${exportDate}`],
    [`Период: с ${periodStart} по ${periodEnd}`],
    [`Отслеживается поведений: ${uniqueBehaviorsCount}`],
    [""],
    [""],
    // Заголовки колонок с датами
    [
      "",
      ...dates.map((d) =>
        d.toLocaleDateString("ru", { weekday: "short" }).toUpperCase()
      ),
    ].map(escapeCSV),
    // Секция заполнения дневника (теперь в одной строке)
    [
      "ДНЕВНИК ЗАПОЛНЕН СЕГОДНЯ",
      ...dates.map((date) => {
        const entry = entries.find(
          (e) => new Date(e.date).toDateString() === date.toDateString()
        );
        return escapeCSV(entry?.isFilledToday ? "Да" : "Нет");
      }),
    ],
    // Пустая строка между секциями
    [""],
    // Секция состояний
    ["СОСТОЯНИЕ"],
    [
      "Эмоциональное страдание",
      ...dates.map((date) => {
        const entry = entries.find(
          (e) => new Date(e.date).toDateString() === date.toDateString()
        );
        return escapeCSV(formatValue(entry?.states.emotional));
      }),
    ],
    [
      "Физическое страдание",
      ...dates.map((date) => {
        const entry = entries.find(
          (e) => new Date(e.date).toDateString() === date.toDateString()
        );
        return escapeCSV(formatValue(entry?.states.physical));
      }),
    ],
    [
      "Удовольствие",
      ...dates.map((date) => {
        const entry = entries.find(
          (e) => new Date(e.date).toDateString() === date.toDateString()
        );
        return escapeCSV(formatValue(entry?.states.pleasure));
      }),
    ],
    // Пустая строка между секциями
    [""],
    // Секция желаний
    ["ЖЕЛАНИЯ"],
    ...behaviors.map((name) => [
      escapeCSV(name),
      ...dates.map((date) => {
        const entry = entries.find(
          (e) => new Date(e.date).toDateString() === date.toDateString()
        );
        const behavior = entry?.behaviors.find((b) => b.name === name);
        return escapeCSV(formatValue(behavior?.desire));
      }),
    ]),
    // Пустая строка между секциями
    [""],
    // Секция действий
    ["ДЕЙСТВИЯ"],
    ...behaviors.map((name) => [
      escapeCSV(name),
      ...dates.map((date) => {
        const entry = entries.find(
          (e) => new Date(e.date).toDateString() === date.toDateString()
        );
        const behavior = entry?.behaviors.find((b) => b.name === name);
        return escapeCSV(formatValue(behavior?.action));
      }),
    ]),
    // Пустая строка между секциями
    [""],
    // Секция использования навыков
    ["ИСПОЛЬЗОВАННЫЕ НАВЫКИ"],
    [
      "",
      ...dates.map((date) => {
        const entry = entries.find(
          (e) => new Date(e.date).toDateString() === date.toDateString()
        );
        return escapeCSV(formatValue(entry?.skillUsage));
      }),
    ],
    [""],
    [""],
    // Добавляем легенду использования навыков с экранированием запятых
    [""],
    [""],
    ["СПРАВКА: ШКАЛА ИСПОЛЬЗОВАНИЯ НАВЫКОВ"],
    ...skillOptionsTemplate[getPreferredGender()].map((text, index) => [
      `"${index} – ${text}"`,
    ]),
  ];

  // Преобразуем в строку CSV
  const csvContent = csvRows.map((row) => row.join(",")).join("\n");

  // Создаем и скачиваем файл
  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Дневник.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSV(value) {
  if (value === undefined || value === null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatValue(value) {
  if (value === undefined || value === null) return ""; // Меняем точку на пустую строку
  if (value === true) return "✓";
  if (value === false) return "✕";
  return value;
}

async function renderSkillsTable(dates) {
  // Получаем все практики за указанный период
  const startDate = dates[0].toISOString().split("T")[0];
  const endDate = dates[dates.length - 1].toISOString().split("T")[0];

  // Получаем все практики за период
  const practices = await db.practices
    .where("date")
    .between(startDate, endDate, true, true)
    .toArray();

  // Загружаем структуру навыков из theory.json
  const response = await fetch("/data/theory.json");
  const theory = await response.json();

  return `
    <table class="export-table skills-table">
      <thead>
        <tr>
          <th class="column-name"></th>
          ${dates.map(d => `
            <th>
              <div class="date-header">
                <div class="weekday">${d.toLocaleDateString('ru', { weekday: 'short' }).toUpperCase()}</div>
                <div class="day">${d.getDate()}</div>
              </div>
            </th>
          `).join('')}
        </tr>
      </thead>
      <tbody>
        ${theory.blocks.map(block => `
          <tr class="section-row">
            <td colspan="${dates.length + 1}">${block.title}</td>
          </tr>
          ${block.skills.map(skill => `
            <tr>
              <td>${skill.name}</td>
              ${dates.map(date => {
                const dateStr = date.toISOString().split('T')[0];
                const hasSkill = practices.some(p => 
                  p.date === dateStr && p.skill === skill.name
                );
                return `<td>${hasSkill ? '✓' : ''}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        `).join('')}
      </tbody>
    </table>
  `;
}

async function createExportPage(entries, dates, influenceValues = {}) {
  const container = document.createElement("div");
  container.classList.add("export-page");

  // Получаем информацию о периоде
  const today = new Date();
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  // Форматируем даты для заголовка
  const exportDate = today.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  const formatDate = (date) => {
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
    });
  };

  let periodText = "";
  if (startYear === endYear) {
    periodText = `${formatDate(startDate)} — ${formatDate(
      endDate
    )} ${endYear} г.`;
  } else {
    periodText = `${formatDate(startDate)} ${startYear} г. — ${formatDate(
      endDate
    )} ${endYear} г.`;
  }

  // Формируем текст о количестве дней
  const daysText =
    dates.length === 1
      ? "за один день"
      : dates.length < 5
      ? `за ${dates.length} дня`
      : `за ${dates.length} дней`;

  // Общие стили для заголовков секций
  const sectionHeaderStyle = `
    font-size: 20px;
    color: var(--text-color);
    margin: 16px 0 12px 0;
    text-align: left;
    font-weight: 600;
  `.replace(/\n\s*/g, "");

  // Рендерим основную страницу
  container.innerHTML = `
    <div class="export-content">
      <div class="export-header" style="margin-bottom: 12px; text-align: left;">
        <h1 style="font-size: 28px; margin: 0 0 4px 0;">Дневник наблюдений</h1>
        <div style="color: var(--text-secondary); font-size: 14px;">
          ${periodText} · Наблюдения ${daysText}
        </div>
      </div>

      <div class="diary-data">
        <h2 style="${sectionHeaderStyle}">Поведение</h2>
        <table class="export-table main-table">
          <thead>
            <tr>
              <th class="column-name"></th>
              ${dates
                .map(
                  (d) => `
                <th>
                  <div class="date-header">
                    <div class="weekday">${d
                      .toLocaleDateString("ru", { weekday: "short" })
                      .toUpperCase()}</div>
                    <div class="day">${d.getDate()}</div>
                  </div>
                </th>
              `
                )
                .join("")}
            </tr>
          </thead>
          <tbody>
            <!-- Секция заполнения дневника -->
            <tr class="section-row">
              <td colspan="${dates.length + 1}">Отметка о заполнении дневника</td>
            </tr>
            <tr>
              <td>Дневник заполнен сегодня?</td>
              ${renderDailyValues(
                dates,
                entries,
                (entry) => entry?.isFilledToday ? "✓" : "✕"
              )}
            </tr>

            <!-- Секция состояний -->
            <tr class="section-row">
              <td colspan="${dates.length + 1}">Состояние (0–5)</td>
            </tr>
            ${renderStateRows(dates, entries)}

            <!-- Секция желаний -->
            <tr class="section-row">
              <td colspan="${
                dates.length + 1
              }">Желания, максимальная выраженность в течение дня (0–5)</td>
            </tr>
            ${renderBehaviorRows(dates, entries, "desire")}

            <!-- Секция действий -->
            <tr class="section-row">
              <td colspan="${
                dates.length + 1
              }">Действия</td>
            </tr>
            ${renderBehaviorRows(dates, entries, "action")}

            <!-- Секция навыков -->
            <tr class="section-row">
              <td colspan="${dates.length + 1}">Использованные навыки</td>
            </tr>
            <tr>
              <td>Оценка (0–7)</td>
              ${renderDailyValues(
                dates,
                entries,
                (entry) => entry?.skillUsage ?? "",
                () => false
              )}
            </tr>
          </tbody>
        </table>

        <div style="margin: 16px 0; padding: 12px 16px; background-color: var(--card-background-color); border-radius: 8px; box-shadow: var(--card-shadow); opacity: 0.9;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; line-height: 1;">
            <div style="display: grid; gap: 4px;">
              ${skillOptionsTemplate[getPreferredGender()].slice(0, 4).map((text, index) => `
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="flex: none; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; background: #2196f3; color: white; border-radius: 50%; font-size: 12px;">${index}</div>
                  <span style="color: var(--text-secondary); font-size: 13px;">${text[0].toUpperCase() + text.slice(1)}</span>
                </div>
              `).join("")}
            </div>
            <div style="display: grid; gap: 4px;">
              ${skillOptionsTemplate[getPreferredGender()].slice(4).map((text, index) => `
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="flex: none; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; background: #2196f3; color: white; border-radius: 50%; font-size: 12px;">${index + 4}</div>
                  <span style="color: var(--text-secondary); font-size: 13px;">${text[0].toUpperCase() + text.slice(1)}</span>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

        ${Object.values(influenceValues).some((v) => v !== undefined)
            ? `
          <h2 style="${sectionHeaderStyle}">Способность влиять и управлять</h2>
          <div class="influence-section" style="padding: 12px 16px; background-color: var(--card-background-color); border-radius: 8px; box-shadow: var(--card-shadow);">
            <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; font-size: 14px; color: var(--text-color);">
              ${influenceValues.thoughts !== undefined ? `<div>Мыслями:</div><div>${influenceValues.thoughts}/5</div>` : ""}
              ${influenceValues.emotions !== undefined ? `<div>Эмоциями:</div><div>${influenceValues.emotions}/5</div>` : ""}
              ${influenceValues.actions !== undefined ? `<div>Действиями:</div><div>${influenceValues.actions}/5</div>` : ""}
            </div>
          </div>
        `
            : ""}

        <h2 style="${sectionHeaderStyle}">Практика</h2>
        ${await renderSkillsTable(dates)}
      </div>
    </div>
  `;
  // Добавляем таблицу навыков
  // const skillsTable = await renderSkillsTable(dates);
  // if (skillsTable) {
  //   container.querySelector('.export-content').insertAdjacentHTML('beforeend', `
  //     <h2 style="${sectionHeaderStyle}">Практика навыков</h2>
  //     ${skillsTable}
  //   `);
  // }

  return container;
}

export async function exportScreenshot(entries, dates) {
  // Получаем значения оценок влияния из модального окна
  const influenceValues = {
    thoughts: document.querySelector(
      '.scale-button[data-field="thoughts"].active'
    )?.dataset.value,
    emotions: document.querySelector(
      '.scale-button[data-field="emotions"].active'
    )?.dataset.value,
    actions: document.querySelector(
      '.scale-button[data-field="actions"].active'
    )?.dataset.value,
  };

  const page = await createExportPage(entries, dates, influenceValues);
  document.body.appendChild(page);

  try {
    const canvas = await html2canvas(page, {
      backgroundColor: getComputedStyle(document.body).getPropertyValue(
        "--background-color"
      ),
      scale: 2, // Увеличиваем масштаб для лучшего качества
      useCORS: true,
      logging: false,
      onclone: (clonedDoc) => {
        const clonedPage = clonedDoc.querySelector(".export-page");
        if (clonedPage) {
          // Устанавливаем фиксированную ширину и отступы для лучшей читаемости
          clonedPage.style.width = "800px";
          clonedPage.style.padding = "32px";

          // Адаптируем размеры ячеек в зависимости от количества дней
          const cells = clonedPage.querySelectorAll(
            "td:not(:first-child), th:not(:first-child)"
          );

          // Определяем размеры в зависимости от количества дней
          let cellWidth, cellPadding, fontSize;
          if (dates.length >= 13) {
            cellWidth = "38px";
            cellPadding = "4px 6px";
            fontSize = "11px";
          } else if (dates.length >= 10) {
            cellWidth = "45px";
            cellPadding = "6px 8px";
            fontSize = "12px";
          } else {
            cellWidth = "52px";
            cellPadding = "8px 12px";
            fontSize = "13px";
          }

          // Применяем стили
          cells.forEach((cell) => {
            cell.style.padding = cellPadding;
            cell.style.fontSize = fontSize;
            cell.style.width = cellWidth;
            cell.style.minWidth = cellWidth;
            cell.style.maxWidth = cellWidth;
          });

          // Уменьшаем заголовки дней недели
          const dayHeaders = clonedPage.querySelectorAll("th");
          dayHeaders.forEach((header) => {
            header.style.fontSize = "12px";
          });
        }
      },
    });

    // Форматируем текущую дату для имени файла
    const exportDate = new Date()
      .toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\./g, "-");

    const link = document.createElement("a");
    link.download = `Дневник_${exportDate}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (error) {
    console.error("Ошибка при создании скриншота:", error);
    alert("Не удалось создать скриншот. Попробуйте другой способ экспорта.");
  } finally {
    document.body.removeChild(page);
  }
}

function getLastWeekDates() {
  const dates = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    dates.push(date);
  }
  return dates;
}

function renderDailyValues(
  dates,
  entries,
  valueGetter,
  highlightCondition = () => false // Условие по умолчанию
) {
  return dates
    .map((date) => {
      const entry = entries.find(
        (e) => new Date(e.date).toDateString() === date.toDateString()
      );
      const value = valueGetter(entry);
      const isHighlighted = highlightCondition(value);
      return `<td class="center${
        isHighlighted ? " highlight" : ""
      }">${value}</td>`;
    })
    .join("");
}

function renderStateRows(dates, entries) {
  const states = [
    { id: "emotional", name: "Эмоциональное страдание" },
    { id: "physical", name: "Физическое страдание" },
    { id: "pleasure", name: "Удовольствие" },
  ];

  return states
    .map(
      (state) => `
    <tr>
      <td>${state.name}</td>
      ${renderDailyValues(
        dates,
        entries,
        (entry) => entry?.states[state.id] ?? "",
        (value) => value === 4 || value === 5
      )}
    </tr>
  `
    )
    .join("");
}

function renderBehaviorRows(dates, entries, type) {
  // Собираем все уникальные поведения из всех записей
  const allBehaviors = new Map();
  entries.forEach((entry) => {
    entry.behaviors.forEach((b) => allBehaviors.set(b.behaviorId, b.name));
  });

  // Преобразуем Map в массив и сортируем по id
  const behaviors = Array.from(allBehaviors.entries()).sort(
    (a, b) => a[0] - b[0]
  );

  return behaviors
    .map(
      ([behaviorId, behaviorName]) => `
    <tr>
      <td>${behaviorName}</td>
      ${renderDailyValues(
        dates,
        entries,
        (entry) => {
          const behaviorEntry = entry?.behaviors.find(
            (b) => b.behaviorId === behaviorId
          );
          if (!behaviorEntry) return "";

          const value = behaviorEntry[type];

          // Форматируем значение в зависимости от типа поведения
          if (behaviorEntry.type === "boolean" && type === "action") {
            return value ? "✓" : "✕";
          } else {
            return value ?? "";
          }
        },
        (value) =>
          (type === "desire" || type === "action") &&
          (value === 4 || value === 5)
      )}
    </tr>
  `
    )
    .join("");
}

const skillOptionsTemplate = {
  feminine: [
    "не думала о навыках и не использовала",
    "думала о навыках, не хотела применять, не использовала",
    "думала о навыках, хотела применить, но не использовала",
    "старалась, но не смогла применить навыки",
    "старалась, смогла применить навыки, но они не помогли",
    "старалась, смогла применить навыки, они помогли",
    "использовала навыки, не стараясь (автоматически), они не помогли",
    "использовала навыки, не стараясь (автоматически), они помогли",
  ],
  masculine: [
    "не думал о навыках и не использовал",
    "думал о навыках, не хотел применять, не использовал",
    "думал о навыках, хотел применить, но не использовал",
    "старался, но не смог применить навыки",
    "старался, смог применить навыки, но они не помогли",
    "старался, смог применить навыки, они помогли",
    "использовал навыки, не стараясь (автоматически), они не помогли",
    "использовал навыки, не стараясь (автоматически), они помогли",
  ],
};

function getPreferredGender() {
  return localStorage.getItem("preferredGender") || "feminine";
}

// Получаем даты за указанный период
function getDatesForPeriod(days) {
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date);
  }
  return dates;
}

// Получаем записи за указанный период
async function getEntriesForPeriod(days) {
  const dates = getDatesForPeriod(days);
  const startDate = dates[0].toISOString().split("T")[0];

  const allEntries = await getAllDiaryEntries();
  const filteredEntries = allEntries
    .filter((entry) => entry.date >= startDate)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return { dates, entries: filteredEntries };
}

// Экспортируем дневник за указанное количество дней
export async function exportDiaryToImage(days = 7) {
  const { entries, dates } = await getEntriesForPeriod(days);
  await exportScreenshot(entries, dates);
}

// Инициализация обработчиков для модального окна экспорта
export function initExportHandlers() {
  // Добавляем обработчики для кнопок оценки влияния
  document
    .querySelectorAll(".influence-item .scale-button")
    .forEach((button) => {
      button.addEventListener("click", () => {
        // Находим все кнопки в той же группе
        const field = button.dataset.field;
        const value = button.dataset.value;
        const buttons = button
          .closest(".scale-buttons")
          .querySelectorAll(".scale-button");

        // Убираем active у всех кнопок
        buttons.forEach((btn) => btn.classList.remove("active"));

        // Добавляем active к нажатой кнопке
        button.classList.add("active");
      });
    });

  // Добавляем обработчики для ссылок выбора периода
  document
    .querySelectorAll(".export-days-links .dotted-link")
    .forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const days = link.dataset.days;
        document.getElementById("exportDays").value = days;
      });
    });
}
