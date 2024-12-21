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
  if (value === undefined || value === null) return "·";
  if (value === true) return "Да";
  if (value === false) return "Нет";
  return value;
}
