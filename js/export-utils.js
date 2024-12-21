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

  // Формируем строки CSV
  const csvRows = [
    // Заголовки колонок с датами
    [
      "",
      ...dates.map((d) => d.toLocaleDateString("ru", { weekday: "short" })),
    ].map(escapeCSV),
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
  if (value === undefined || value === null) return "-";
  if (value === true) return "да";
  if (value === false) return "нет";
  return value;
}
