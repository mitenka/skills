export function createPDF(title, entries) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [40, 60, 40, 60],
    header: function (currentPage, pageCount) {
      if (currentPage === 1) return null;
      return {
        text: title,
        alignment: "left",
        margin: [40, 20],
        fontSize: 10,
        color: "#666666",
      };
    },
    footer: function (currentPage, pageCount) {
      if (currentPage === 1) return null;
      return {
        text: `${currentPage} из ${pageCount}`,
        alignment: "right",
        margin: [40, 20],
        fontSize: 10,
        color: "#666666",
      };
    },
    content: [
      // Обложка
      {
        stack: [
          { text: title, style: "coverTitle" },
          { text: "Дневник самонаблюдения", style: "coverSubtitle" },
          { text: `Создан ${formatDate(new Date())}`, style: "coverDate" },
        ],
        pageBreak: "after",
      },
      // Записи дневника
      ...entries
        .map((entry, index) => [
          {
            stack: [
              { text: formatDate(entry.date), style: "date" },
              {
                text: `Дневник заполнен: ${entry.isFilledToday ? "Да" : "Нет"}`,
                style: "status",
                color: entry.isFilledToday ? "#4CAF50" : "#F44336",
              },
              {
                layout: "lightHorizontalLines",
                table: {
                  headerRows: 1,
                  widths: ["*", "auto", "auto"],
                  body: [
                    [
                      { text: "Состояние", style: "tableHeader" },
                      { text: "Значение", style: "tableHeader" },
                      { text: "Оценка", style: "tableHeader" },
                    ],
                    [
                      "Эмоциональное состояние",
                      "",
                      formatValue(entry.states.emotional),
                    ],
                    [
                      "Физическое состояние",
                      "",
                      formatValue(entry.states.physical),
                    ],
                    ["Удовольствие", "", formatValue(entry.states.pleasure)],
                  ],
                },
              },
              { text: "Поведения:", style: "behaviorsTitle" },
              {
                layout: "lightHorizontalLines",
                table: {
                  headerRows: 1,
                  widths: ["*", "auto", "auto"],
                  body: [
                    [
                      { text: "Название", style: "tableHeader" },
                      { text: "Желание", style: "tableHeader" },
                      { text: "Действие", style: "tableHeader" },
                    ],
                    ...entry.behaviors.map((b) => [
                      b.name,
                      formatValue(b.desire),
                      formatValue(b.action),
                    ]),
                  ],
                },
              },
            ],
            pageBreak: index < entries.length - 1 ? "after" : undefined,
          },
        ])
        .flat(),
    ],
    styles: {
      coverTitle: {
        fontSize: 28,
        bold: true,
        alignment: "center",
        margin: [0, 200, 0, 20],
        color: "#2196F3",
      },
      coverSubtitle: {
        fontSize: 16,
        alignment: "center",
        margin: [0, 0, 0, 100],
        color: "#666666",
      },
      coverDate: {
        fontSize: 12,
        alignment: "center",
        color: "#666666",
      },
      date: {
        fontSize: 16,
        bold: true,
        margin: [0, 0, 0, 10],
        color: "#2196F3",
      },
      status: {
        fontSize: 12,
        margin: [0, 0, 0, 20],
      },
      behaviorsTitle: {
        fontSize: 14,
        bold: true,
        margin: [0, 20, 0, 10],
        color: "#2196F3",
      },
      tableHeader: {
        bold: true,
        fontSize: 12,
        color: "#666666",
        fillColor: "#F5F5F5",
      },
    },
    defaultStyle: {
      font: "Roboto",
      fontSize: 12,
      lineHeight: 1.4,
    },
  };

  // Для iOS создаем HTML-версию для печати
  if (isIOS) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Пожалуйста, разрешите всплывающие окна для этого сайта");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, sans-serif; padding: 20px; }
            .entry { margin-bottom: 30px; }
            .entry-date { font-size: 18px; font-weight: bold; color: #2196F3; }
            .entry-status { margin: 10px 0; }
            .entry-states { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 8px; }
            .behaviors { margin-top: 20px; }
            .behavior-item { margin: 10px 0; }
            @media print {
              .no-print { display: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <p>Нажмите кнопку "Поделиться" и выберите "Сохранить PDF" или распечатайте эту страницу.</p>
          </div>
          <h1>${title}</h1>
          ${entries
            .map(
              (entry) => `
            <div class="entry">
              <div class="entry-date">${formatDate(entry.date)}</div>
              <div class="entry-status">
                Дневник заполнен: ${entry.isFilledToday ? "Да" : "Нет"}
              </div>
              <div class="entry-states">
                <div>Эмоциональное состояние: ${formatValue(
                  entry.states.emotional
                )}</div>
                <div>Физическое состояние: ${formatValue(
                  entry.states.physical
                )}</div>
                <div>Удовольствие: ${formatValue(entry.states.pleasure)}</div>
              </div>
              <div class="behaviors">
                ${entry.behaviors
                  .map(
                    (b) => `
                  <div class="behavior-item">
                    <strong>${b.name}</strong>
                    <div>Желание: ${formatValue(b.desire)}</div>
                    <div>Действие: ${formatValue(b.action)}</div>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          `
            )
            .join("")}
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  } else if (isSafari) {
    // Для десктопного Safari открываем в новой вкладке
    pdfMake.createPdf(docDefinition).open();
  } else {
    // Для остальных браузеров скачиваем
    pdfMake.createPdf(docDefinition).download(`${title}.pdf`);
  }
}

function formatValue(value) {
  if (value === undefined || value === null) return "?";
  if (typeof value === "boolean") return value ? "✓" : "✕";
  return value;
}

function formatDate(dateString) {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateString).toLocaleDateString("ru-RU", options);
}
