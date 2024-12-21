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

  // Специальная обработка для iOS Safari
  if (isIOS && isSafari) {
    pdfMake.createPdf(docDefinition).getBase64((base64) => {
      const url = `data:application/pdf;base64,${base64}`;
      window.location.href = url;
    });
  }
  // Для десктопного Safari
  else if (isSafari) {
    pdfMake.createPdf(docDefinition).open();
  }
  // Для всех остальных браузеров
  else {
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
