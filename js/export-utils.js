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
    ['"0 – не думал о навыках и не использовал"'],
    ['"1 – думал о навыках, не хотел применять, не использовал"'],
    ['"2 – думал о навыках, хотел применить, но не использовал"'],
    ['"3 – старался, но не смог применить навыки"'],
    ['"4 – старался, смог применить навыки, но они не помогли"'],
    ['"5 – старался, смог применить навыки, они помогли"'],
    ['"6 – использовал навыки, не стараясь (автоматически), они не помогли"'],
    ['"7 – использовал навыки, не стараясь (автоматически), они помогли"'],
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

function createExportPage(entries) {
  const container = document.createElement("div");
  container.className = "export-page";

  // Получаем даты
  const dates = getLastWeekDates();

  container.innerHTML = `
    <div class="export-header">
      <h1>Дневник наблюдений</h1>
      <p class="export-period">
        ${dates[0].toLocaleDateString("ru-RU")} — ${dates[
    dates.length - 1
  ].toLocaleDateString("ru-RU")}
      </p>
    </div>
    <div class="export-content">
      <table class="export-table">
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
            <td colspan="8">Отметка о заполнении дневника</td>
          </tr>
          <tr>
            <td>Дневник заполнен сегодня?</td>
            ${renderDailyValues(dates, entries, (entry) =>
              entry?.isFilledToday ? "✓" : "✕"
            )}
          </tr>

          <!-- Секция состояний -->
          <tr class="section-row">
            <td colspan="8">Состояние (0–5)</td>
          </tr>
          ${renderStateRows(dates, entries)}

          <!-- Секция желаний -->
          <tr class="section-row">
            <td colspan="8">Желания, максимальная выраженность в течение дня (0–5)</td>
          </tr>
          ${renderBehaviorRows(dates, entries, "desire")}

          <!-- Секция действий -->
          <tr class="section-row">
            <td colspan="8">Действия</td>
          </tr>
          ${renderBehaviorRows(dates, entries, "action")}

          <!-- Секция навыков -->
          <tr class="section-row">
            <td colspan="8">Использованные навыки</td>
          </tr>
          <tr>
            <td>Оценка (0–7)</td>
            ${renderDailyValues(
              dates,
              entries,
              (entry) => entry?.skillUsage ?? ""
            )}
          </tr>
        </tbody>
      </table>

      <div class="export-legend">
        <h3>Справка по использованию навыков</h3>
        <div class="legend-grid">
          <div class="legend-column">
            <div class="legend-item"><span class="legend-number">0</span> не думал(а) о навыках</div>
            <div class="legend-item"><span class="legend-number">1</span> думал(а), но не хотел(а) применять</div>
            <div class="legend-item"><span class="legend-number">2</span> хотел(а), но не применил(а)</div>
            <div class="legend-item"><span class="legend-number">3</span> пытался(ась), не получилось</div>
          </div>
          <div class="legend-column">
            <div class="legend-item"><span class="legend-number">4</span> применил(а), не помогло</div>
            <div class="legend-item"><span class="legend-number">5</span> применил(а), помогло</div>
            <div class="legend-item"><span class="legend-number">6</span> автоматически, не помогло</div>
            <div class="legend-item"><span class="legend-number">7</span> автоматически, помогло</div>
          </div>
        </div>
      </div>
    </div>
  `;

  return container;
}

// Вспомогательные функции для рендеринга
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

function renderDailyValues(dates, entries, valueGetter) {
  return dates
    .map((date) => {
      const entry = entries.find(
        (e) => new Date(e.date).toDateString() === date.toDateString()
      );
      return `<td class="center">${valueGetter(entry)}</td>`;
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
        (entry) => entry?.states[state.id] ?? ""
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
      ${renderDailyValues(dates, entries, (entry) => {
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
      })}
    </tr>
  `
    )
    .join("");
}

export async function exportScreenshot(entries) {
  const page = createExportPage(entries);
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
          clonedPage.style.margin = "0";

          // Делаем ячейки таблицы более компактными
          const cells = clonedPage.querySelectorAll("td, th");
          cells.forEach((cell) => {
            cell.style.padding = "8px 12px";
          });

          // Уменьшаем отступы между секциями
          const sections = clonedPage.querySelectorAll(".section-row");
          sections.forEach((section) => {
            section.style.paddingTop = "16px";
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
      .replace(/\./g, "-"); // Заменяем точки на тире

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