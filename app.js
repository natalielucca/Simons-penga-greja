const STORAGE_KEY = "simons-pengacheck-v1";
const MONTHLY_ALLOWANCE = 1250;
const START_MONTH = "2026-04";
const DEFAULT_MONTHS = new Set(["2026-03", "2026-04"]);

const RAW_TRANSACTIONS = `
2026-04-13	46733308949	625.00
2026-04-13	JOHN KARLSSO/26-04-10	-397.00
2026-04-13	TEMPO GOTEBO/26-04-10	-13.26
2026-04-13	TEMPO GOTEBO/26-04-10	-17.93
2026-04-10	MUNKEBACKS F/26-04-09	-104.90
2026-04-10	46761638511	-138.00
2026-04-10	46720713232	500.00
2026-04-09	ADA GODIS AB/26-04-08	-13.00
2026-04-09	46720713232	110.00
2026-04-08	VOI SE      /26-04-07	-15.00
2026-04-08	LUXURY SUSHI/26-04-07	-110.00
2026-04-08	MATHORNAN   /26-04-07	-12.00
2026-04-07	46720713232	110.00
2026-04-02	46703555368	-19.00
2026-04-02	46703555368	-05.00
2026-04-01	RYDE SWEDEN /26-03-31	-10.90
2026-04-01	RYDE SWEDEN /26-03-31	-08.60
2026-04-01	VOI SE      /26-03-31	-07.50
2026-03-31	46724434787	08.01
2026-03-30	MAX BURGERS /26-03-29	-112.00
2026-03-30	COOP MUNKEBA/26-03-29	-23.50
2026-03-30	STORA COOP B/26-03-28	-22.50
2026-03-30	BENGANS     /26-03-27	-599.00
2026-03-30	VOI SE      /26-03-27	-07.50
2026-03-30	46700368499	-21.00
2026-03-27	VOI SE      /26-03-26	-05.00
2026-03-27	VOI SE      /26-03-26	-10.00
2026-03-27	SANNEGARDENS/26-03-26	-32.00
2026-03-26	LUXURY SUSHI/26-03-25	-110.00
2026-03-26	46724434787	17.00
2026-03-26	46724434787	04.90
2026-03-25	VOI SE      /26-03-24	-05.00
2026-03-25	VOI SE      /26-03-24	-07.50
2026-03-24	NW GOTEBORG /26-03-23	-22.50
2026-03-23	MUNKEBACKS F/26-03-22	-25.00
2026-03-23	HAMBURG     /26-03-19	-32.83
2026-03-23	LUXURY SUSHI/26-03-20	-110.00
2026-03-23	46733308949	625.00
2026-03-20	ICA NARA TRA/26-03-19	-45.40
2026-03-20	COOP MUNKEBA/26-03-19	-158.35
2026-03-20	46720713232	110.00
2026-03-20	46720713232	160.00
2026-03-19	46720713232	-01.00
2026-03-19	46728614439	38.00
2026-03-17	MUNKEBACKS F/26-03-16	-29.95
2026-03-17	MUNKEBACKS F/26-03-16	-25.00
2026-03-16	46724434787	09.99
2026-03-16	46735041894	09.99
2026-03-16	COOP MUNKEBA/26-03-13	-10.00
2026-03-13	ICA NARA TRA/26-03-12	-07.00
2026-03-13	ICA NARA TRA/26-03-12	-48.00
2026-03-13	COOP MUNKEBA/26-03-12	-13.95
2026-03-12	46724444160	20.00
2026-03-10	COOP MUNKEBA/26-03-09	-25.95
2026-03-10	46704008745	-14.00
2026-03-09	RUDDALENS MO/26-03-08	-90.00
2026-03-09	MAX BURGERS /26-03-07	-64.00
2026-03-09	COOP MUNKEBA/26-03-07	-15.00
2026-03-09	VÄSTTRAFIK A	-28.00
2026-03-09	WH GOTEBORG /26-03-06	-35.80
2026-03-09	46720713232	100.00
2026-03-06	LOOMISP UNKE/26-03-05	-130.00
2026-03-06	COOP MUNKEBA/26-03-05	-75.90
2026-03-05	46720713232	50.00
2026-03-05	46720713232	130.00
2026-03-05	PRESSBYRAN O/26-03-04	-15.00
2026-03-05	PRESSBYRAN O/26-03-04	-20.00
2026-03-02	SELECTA     /26-03-01	-30.00
2026-03-02	COOP MUNKEBA/26-02-28	-13.95
2026-03-02	46720713232	425.00
2026-02-27	46720713232	45.00
2026-02-25	COOP MUNKEBA/26-02-24	-24.95
2026-02-25	46737444569	-230.00
2026-02-24	46720713232	45.00
2026-02-23	N W ORGRYTE /26-02-22	-25.00
2026-02-23	MAXIGRILLEN /26-02-21	-25.00
2026-02-23	DRESDEN     /26-02-20	-468.58
2026-02-23	SAMNIK AB   /26-02-20	-27.00
2026-02-23	46733678744	-06.70
2026-02-23	46720713232	110.00
2026-02-20	LUXURY SUSHI/26-02-19	-115.00
2026-02-20	MUNKEBACKS F/26-02-19	-25.00
2026-02-20	46733678744	27.00
2026-02-20	46720713232	110.00
2026-02-05	SELECTA     /26-02-04	-26.00
2026-02-05	46733308949	625.00
2026-02-04	LUXURY SUSHI/26-02-03	-85.00
2026-02-04	LUXURY SUSHI/26-02-03	-110.00
2026-02-04	46720713232	425.00
2026-02-03	46761638511	-05.00
2026-02-03	46761638511	90.00
2026-02-03	46720713232	110.00
2026-02-02	MISTER YORK /26-01-31	-109.00
2026-02-02	ICA NARA TRA/26-01-30	-27.40
2026-02-02	46733308949	120.00
2026-01-30	46728614439	27.00
2026-01-29	LUXURY SUSHI/26-01-28	-110.00
2026-01-29	TEMPO GOTEBO/26-01-28	-06.00
2026-01-28	46761950878	01.00
2026-01-28	46793328732	01.45
2026-01-28	46793328732	-01.00
2026-01-28	46793418396	05.00
2026-01-28	46720713232	115.00
2026-01-26	SAMNIK AB   /26-01-25	-20.00
2026-01-26	46724434787	-22.50
2026-01-26	46724434787	-69.00
2026-01-26	46720713232	115.00
2026-01-26	JUMPYARD GOE/26-01-24	-425.00
2026-01-26	PIZZABAGERIE/26-01-24	-120.00
2026-01-26	46709724646	250.00
2026-01-26	46720713232	220.00
2026-01-26	46720713232	115.00
2026-01-23	VINTED      /26-01-22	-286.89
2026-01-23	46702883405	20.00
2026-01-22	N W ORGRYTE /26-01-21	-69.00
2026-01-22	46720713232	17.00
2026-01-22	46720713232	20.00
2026-01-22	46720713232	100.00
2026-01-20	ICA NARA TRA/26-01-19	-05.80
2026-01-20	46733308949	150.00
2026-01-19	NORDIC WELLN/26-01-18	-349.00
2026-01-19	46733308949	35.00
2026-01-19	COOP MUNKEBA/26-01-17	-12.95
2026-01-19	46720713232	350.00
2026-01-19	LUXURY SUSHI/26-01-16	-110.00
2026-01-16	46720713232	110.00
2026-01-15	N W ORGRYTE /26-01-14	-20.00
2026-01-15	N W ORGRYTE /26-01-14	-40.00
2026-01-14	COOP MUNKEBA/26-01-13	-24.95
2026-01-14	46722101722	40.00
2026-01-13	46720713232	25.00
2026-01-12	LUXURY SUSHI/26-01-11	-110.00
2026-01-12	46720713232	110.00
2026-01-08	KK-BUTIKEN  /26-01-07	-27.00
2026-01-07	ADA GODIS AB/26-01-05	66.00
2026-01-07	ADA GODIS AB/26-01-05	-69.00
2026-01-05	46735041894	22.00
2026-01-05	46735041894	-22.00
2026-01-05	46733308949	30.00
2026-01-05	MAX BURGERS /26-01-03	-100.00
2026-01-05	SANNEGARDEN /26-01-02	-98.00
2026-01-05	46735041894	-31.50
2026-01-02	VINTED      /26-01-01	-309.19
2026-01-02	N W ORGRYTE /26-01-01	-20.00
2026-01-02	46724434787	33.00
2026-01-02	46735041894	33.00
2026-01-02	KFC GÖTEBORG/25-12-30	-239.00
2025-12-30	VINTED      /25-12-29	-83.44
2025-12-30	MAX BURGERS /25-12-29	-103.00
2025-12-30	46724434787	120.00
2025-12-29	EAST KITCHEN/25-12-28	-555.00
2025-12-29	46720713232	150.00
2025-12-29	46720713232	55.00
2025-12-29	POWER TORPAV/25-12-27	-369.00
2025-12-29	LUXURY SUSHI/25-12-27	-110.00
2025-12-29	46720713232	500.00
2025-12-29	46720713232	369.00
2025-12-29	46720713232	110.00
2025-12-29	NONNA IRENE	500.00
2025-10-20	SELECTA     /25-10-19	-33.00
2025-10-20	LISEBERG PF /25-10-17	-99.00
2025-10-20	LISEBERG PF /25-10-17	-58.00
2025-10-20	46720713232	120.00
`;

const baseExpenseCategories = [
  { id: "restaurant_fun", label: "Restaurang/Nöje", color: "#ca5b4c", defaultAmount: 400 },
  { id: "snacks", label: "Snacks", color: "#d79b2a" },
  { id: "clothes", label: "Kläder", color: "#24715f" },
  { id: "savings", label: "Spara", color: "#4f738f" },
  { id: "other", label: "Övrigt", color: "#7a8792" },
];

const systemCategories = [
  { id: "mission", label: "Mammauppdrag", color: "#4d9b6f" },
  { id: "unclear", label: "Oklart", color: "#b67720" },
  { id: "income", label: "Pengar in", color: "#285f8f" },
];

const baseBudgetDefaults = {
  restaurant_fun: 400,
  snacks: 150,
  clothes: 200,
  savings: 300,
  other: 200,
};

const customCategoryColors = ["#7b5ea8", "#319c89"];

const legacyCategoryMap = {
  food: "restaurant_fun",
  fun: "restaurant_fun",
  things: "clothes",
  transport: "other",
  health: "other",
  swish: "other",
};

const monthNames = new Intl.DateTimeFormat("sv-SE", { month: "long", year: "numeric" });

const els = {
  monthTabs: document.querySelector("#monthTabs"),
  readyPill: document.querySelector("#readyPill"),
  summaryGrid: document.querySelector("#summaryGrid"),
  clarityScore: document.querySelector("#clarityScore"),
  categoryLegend: document.querySelector("#categoryLegend"),
  transactionBody: document.querySelector("#transactionBody"),
  pasteForm: document.querySelector("#pasteForm"),
  pasteInput: document.querySelector("#pasteInput"),
  pasteStatus: document.querySelector("#pasteStatus"),
  pasteTitle: document.querySelector("#pasteTitle"),
  budgetControls: document.querySelector("#budgetControls"),
  budgetChart: document.querySelector("#budgetChart"),
  budgetTotal: document.querySelector("#budgetTotal"),
  budgetTitle: document.querySelector("#budgetTitle"),
  customCategoryFields: document.querySelector("#customCategoryFields"),
  reportOutput: document.querySelector("#reportOutput"),
  reportTitle: document.querySelector("#reportTitle"),
  bestBuyInput: document.querySelector("#bestBuyInput"),
  skipBuyInput: document.querySelector("#skipBuyInput"),
  surpriseInput: document.querySelector("#surpriseInput"),
  goalInput: document.querySelector("#goalInput"),
  copyReportButton: document.querySelector("#copyReportButton"),
  resetButton: document.querySelector("#resetButton"),
  printButton: document.querySelector("#printButton"),
  summaryTemplate: document.querySelector("#summaryCardTemplate"),
};

let state = loadState();
let transactions = [];
let months = [];

rebuildTransactions();

if (!months.includes(state.selectedMonth)) {
  state.selectedMonth = getStartMonth();
}

render();

els.monthTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-month]");
  if (!button) return;
  state.selectedMonth = button.dataset.month;
  state.selectedMonthTouched = true;
  saveState();
  render();
});

els.transactionBody.addEventListener("change", (event) => {
  const target = event.target;
  const id = target.dataset.id;
  if (!id) return;

  const tx = transactions.find((item) => item.id === id);
  const current = getDecision(tx);
  const next = { ...current, [target.dataset.field]: target.value };
  if (target.dataset.field === "category" && tx.amount < 0) {
    if (target.value === "unclear") {
      next.bucket = "unclear";
    } else if (target.value === "mission") {
      next.bucket = "mission";
    } else {
      next.bucket = "own";
    }
  }
  setDecision(tx, normalizeDecision(tx, next));
  saveState();
  render();
});

els.pasteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  importPastedRows();
});

els.transactionBody.addEventListener("input", (event) => {
  const target = event.target;
  if (target.dataset.field !== "note") return;
  const tx = transactions.find((item) => item.id === target.dataset.id);
  const current = getDecision(tx);
  setDecision(tx, { ...current, note: target.value });
  saveState();
  renderReportOnly();
});

[els.bestBuyInput, els.skipBuyInput, els.surpriseInput, els.goalInput].forEach((input) => {
  input.addEventListener("input", () => {
    state.reflections[state.selectedMonth] = getReflectionFromInputs();
    saveState();
    renderReportOnly();
  });
});

els.budgetControls.addEventListener("input", (event) => {
  const input = event.target.closest("[data-budget-id]");
  if (!input) return;
  const budget = getBudget(state.selectedMonth);
  budget[input.dataset.budgetId] = Number(input.value || 0);
  state.budgets[state.selectedMonth] = budget;
  saveState();
  renderBudget();
  renderReportOnly();
});

els.customCategoryFields.addEventListener("input", (event) => {
  const input = event.target.closest("[data-custom-index]");
  if (!input) return;
  const customCategories = getCustomCategoryLabels();
  customCategories[Number(input.dataset.customIndex)] = input.value;
  state.customCategories = customCategories;
  saveState();
  renderLegend();
  renderTransactions();
  renderSummary();
  renderBudget();
  renderReportOnly();
});

els.copyReportButton.addEventListener("click", async () => {
  const report = buildReport(computeMonth(state.selectedMonth));
  try {
    await navigator.clipboard.writeText(report);
    els.copyReportButton.textContent = "Kopierad";
    setTimeout(() => {
      els.copyReportButton.textContent = "Kopiera";
    }, 1300);
  } catch {
    window.prompt("Kopiera redovisningen:", report);
  }
});

els.resetButton.addEventListener("click", () => {
  const ok = window.confirm("Återställ Simons kategorier, budget och svar?");
  if (!ok) return;
  localStorage.removeItem(STORAGE_KEY);
  state = loadState();
  rebuildTransactions();
  render();
});

els.printButton.addEventListener("click", () => window.print());

function parseTransactions() {
  return parseTransactionRows(RAW_TRANSACTIONS, "tx").filter((tx) => DEFAULT_MONTHS.has(tx.month));
}

function parseTransactionRows(rawRows, idPrefix) {
  return rawRows
    .trim()
    .split("\n")
    .map((line, index) => parseTransactionLine(line, `${idPrefix}-${index}`))
    .filter(Boolean);
}

function parseTransactionLine(line, id) {
  const cleaned = line.trim();
  if (!cleaned || cleaned.toLowerCase().includes("bokföringsdatum")) return null;

  const tabParts = cleaned.split("\t").map((part) => part.trim()).filter(Boolean);
  let date;
  let text;
  let amount;

  if (tabParts.length >= 3) {
    date = tabParts[0];
    amount = parseAmount(tabParts.at(-1));
    text = tabParts.slice(1, -1).join(" ").replace(/\s+/g, " ");
  } else {
    const match = cleaned.match(/^(\d{4}-\d{2}-\d{2})\s+(.+?)\s+(-?\d+(?:[,.]\d{1,2})?)$/);
    if (!match) return null;
    [, date, text] = match;
    amount = parseAmount(match[3]);
    text = text.trim().replace(/\s+/g, " ");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(amount) || !text) return null;

  const tx = {
    id,
    date,
    text,
    amount,
    month: date.slice(0, 7),
  };
  return { ...tx, defaultDecision: suggestDecision(tx) };
}

function parseAmount(value) {
  return Number(String(value).replace(/\s/g, "").replace(",", "."));
}

function normalizeRowForStorage(tx) {
  return `${tx.date}\t${tx.text}\t${tx.amount.toFixed(2)}`;
}

function rebuildTransactions() {
  const defaultTransactions = parseTransactions();
  const importedTransactions = Object.entries(state.importedRows || {}).flatMap(([month, rows]) =>
    (Array.isArray(rows) ? rows : [])
      .map((row, index) => parseTransactionLine(row, `imported-${month}-${index}`))
      .filter(Boolean),
  );

  transactions = [...defaultTransactions, ...importedTransactions].sort((a, b) => {
    if (a.date === b.date) return a.id.localeCompare(b.id);
    return b.date.localeCompare(a.date);
  });
  months = [...new Set(transactions.map((tx) => tx.month))].sort().reverse();
}

function importPastedRows() {
  const rows = els.pasteInput.value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!rows.length) {
    setPasteStatus("Klistra in minst en rad först.", true);
    return;
  }

  const existingRows = new Set([
    ...parseTransactions().map(normalizeRowForStorage),
    ...Object.values(state.importedRows || {}).flat().filter(Boolean),
  ]);
  const importedRows = { ...(state.importedRows || {}) };
  const addedByMonth = {};
  let skipped = 0;

  rows.forEach((row, index) => {
    if (row.toLowerCase().includes("bokföringsdatum")) return;
    const tx = parseTransactionLine(row, `paste-${index}`);
    if (!tx) {
      skipped += 1;
      return;
    }

    const normalizedRow = normalizeRowForStorage(tx);
    if (existingRows.has(normalizedRow)) {
      skipped += 1;
      return;
    }

    importedRows[tx.month] = [...(importedRows[tx.month] || []), normalizedRow];
    existingRows.add(normalizedRow);
    addedByMonth[tx.month] = (addedByMonth[tx.month] || 0) + 1;
  });

  const added = Object.values(addedByMonth).reduce((sum, count) => sum + count, 0);
  if (!added) {
    setPasteStatus(`Inga nya rader lades till${skipped ? ` (${skipped} ignorerades)` : ""}.`, true);
    return;
  }

  state.importedRows = importedRows;
  const importedMonths = Object.keys(addedByMonth).sort();
  if (importedMonths.length === 1) {
    state.selectedMonth = importedMonths[0];
    state.selectedMonthTouched = true;
  }
  rebuildTransactions();
  saveState();
  els.pasteInput.value = "";
  render();
  setPasteStatus(`${added} rad${added === 1 ? "" : "er"} tillagd${added === 1 ? "" : "a"}${skipped ? `, ${skipped} ignorerades` : ""}.`);
}

function suggestDecision(tx) {
  if (tx.amount > 0) {
    if (tx.text === "46733308949" || tx.amount >= 600) {
      return { bucket: "ownIncome", category: "income", note: "" };
    }
    return { bucket: "missionIncome", category: "income", note: "" };
  }

  const text = tx.text.toLowerCase();
  let category = "other";

  if (matches(text, ["luxury sushi", "max burgers", "maxigrillen", "mister york", "sannegarden", "sannegardens", "pizzabagerie", "kfc", "east kitchen", "hamburg"])) {
    category = "restaurant_fun";
  } else if (matches(text, ["coop", "tempo", "ica nara", "ada godis", "selecta", "pressbyran", "mathornan", "samnik", "kk-butiken", "munke"])) {
    category = "snacks";
  } else if (matches(text, ["jumpyard", "liseberg", "ruddalens", "bengans"])) {
    category = "restaurant_fun";
  } else if (matches(text, ["vinted"])) {
    category = "clothes";
  }

  return { bucket: "unclear", category: "unclear", suggestedCategory: category, note: "" };
}

function matches(text, needles) {
  return needles.some((needle) => text.includes(needle));
}

function loadState() {
  const fallback = {
    selectedMonth: START_MONTH,
    overrides: {},
    reflections: {},
    budgets: {},
    customCategories: ["", ""],
    importedRows: {},
    selectedMonthTouched: false,
  };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const customCategories = Array.isArray(saved?.customCategories) ? saved.customCategories.slice(0, 2) : fallback.customCategories;
    return {
      ...fallback,
      ...saved,
      selectedMonth: saved?.selectedMonthTouched ? saved.selectedMonth : START_MONTH,
      customCategories: [...customCategories, "", ""].slice(0, 2),
      importedRows: saved?.importedRows && typeof saved.importedRows === "object" ? saved.importedRows : {},
    };
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  renderTitles();
  renderMonthTabs();
  renderLegend();
  renderCustomCategories();
  renderReflections();
  renderTransactions();
  renderSummary();
  renderBudget();
  renderReportOnly();
}

function renderTitles() {
  els.reportTitle.textContent = `Visa mamma - ${formatMonth(state.selectedMonth)}`;
  els.budgetTitle.textContent = `Budget för ${formatNextMonth(state.selectedMonth)}`;
  els.pasteTitle.textContent = `Klistra in rader för ${formatMonth(state.selectedMonth)}`;
}

function renderMonthTabs() {
  els.monthTabs.innerHTML = months
    .map((month) => {
      const active = month === state.selectedMonth ? " is-active" : "";
      return `<button class="tab-button${active}" type="button" data-month="${month}">${formatMonth(month)}</button>`;
    })
    .join("");
}

function setPasteStatus(message, isWarning = false) {
  els.pasteStatus.textContent = message;
  els.pasteStatus.classList.toggle("is-warning", isWarning);
}

function getStartMonth() {
  if (months.includes(START_MONTH)) return START_MONTH;
  return months[0] || START_MONTH;
}

function renderLegend() {
  const visible = getAllCategories().filter((category) => !["income", "unclear"].includes(category.id));
  els.categoryLegend.innerHTML = visible
    .map(
      (category) => `
        <span class="legend-chip">
          <span class="legend-dot" style="--dot: ${category.color}"></span>
          ${category.label}
        </span>
      `,
    )
    .join("");
}

function renderCustomCategories() {
  getCustomCategoryLabels().forEach((label, index) => {
    const input = els.customCategoryFields.querySelector(`[data-custom-index="${index}"]`);
    if (input && input.value !== label) input.value = label;
  });
}

function renderTransactions() {
  const monthTransactions = getMonthTransactions(state.selectedMonth);
  els.transactionBody.innerHTML = monthTransactions
    .map((rawTx) => {
      const tx = withDecision(rawTx);
      const match = tx.amount < 0 ? findPossibleMatch(tx, monthTransactions) : null;
      const hint = getRowHint(tx, match);
      const rowClass = getRowClass(tx);
      return `
        <tr class="${rowClass}">
          <td class="date-cell">${formatShortDate(tx.date)}</td>
          <td>
            <div class="merchant">${escapeHtml(tx.text)}</div>
            ${hint ? `<div class="hint">${hint}</div>` : ""}
          </td>
          <td class="amount ${tx.amount >= 0 ? "is-plus" : "is-minus"}">${formatMoney(tx.amount)}</td>
          <td>
            <select class="row-select" data-id="${tx.id}" data-field="category" ${tx.amount > 0 ? "disabled" : ""}>
              ${categoryOptions(tx)}
            </select>
          </td>
          <td>
            <input class="note-input" data-id="${tx.id}" data-field="note" value="${escapeAttribute(tx.note)}" placeholder="kort" />
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderSummary() {
  const summary = computeMonth(state.selectedMonth);
  const cards = getCategorySummaryCards(summary);

  els.summaryGrid.innerHTML = "";
  cards.forEach((card) => {
    const node = els.summaryTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".summary-card__label").textContent = card.label;
    node.querySelector(".summary-card__value").textContent = card.value;
    node.querySelector(".summary-card__note").textContent = card.note;
    els.summaryGrid.appendChild(node);
  });

  els.clarityScore.textContent = `${summary.clarity}% klart`;
  els.readyPill.textContent = summary.unclearCount === 0 ? "Redo för utbetalning" : `${summary.unclearCount} oklara kvar`;
  els.readyPill.classList.toggle("is-warning", summary.unclearCount > 0);
}

function getCategorySummaryCards(summary) {
  return getExpenseCategories().map((category) => {
    const amount = summary.byCategory[category.id] || 0;
    const count = summary.byCategoryCount[category.id] || 0;
    return {
      label: category.label,
      value: formatMoney(-amount),
      note: `${count} rad${count === 1 ? "" : "er"}`,
    };
  });
}

function renderReflections() {
  const reflection = state.reflections[state.selectedMonth] || {};
  els.bestBuyInput.value = reflection.bestBuy || "";
  els.skipBuyInput.value = reflection.skipBuy || "";
  els.surpriseInput.value = reflection.surprise || "";
  els.goalInput.value = reflection.goal || "";
}

function renderBudget() {
  const summary = computeMonth(state.selectedMonth);
  const budget = getBudget(state.selectedMonth);
  const budgetCategories = getBudgetCategories();
  const total = Object.values(budget).reduce((sum, value) => sum + Number(value || 0), 0);
  const diff = MONTHLY_ALLOWANCE - total;
  els.budgetTotal.textContent = diff === 0 ? "1 250 kr prick" : `${formatMoney(diff)} kvar`;
  els.budgetTotal.style.color = diff < 0 ? "var(--coral)" : "var(--blue)";

  els.budgetControls.innerHTML = budgetCategories
    .map((category) => {
      const color = getCategoryColor(category.id);
      return `
        <label class="budget-row">
          <span class="budget-name">
            <span class="budget-dot" style="--dot: ${color}"></span>
            ${category.label}
          </span>
          <input class="budget-input" type="number" min="0" step="10" data-budget-id="${category.id}" value="${budget[category.id] || 0}" />
        </label>
      `;
    })
    .join("");

  els.budgetChart.innerHTML = budgetCategories
    .map((category) => {
      const planned = Number(budget[category.id] || 0);
      const actual =
        category.id === "savings"
          ? Math.max(summary.remaining, 0) + (summary.byCategory.savings || 0)
          : summary.byCategory[category.id] || 0;
      const width = planned > 0 ? Math.min(100, Math.round((actual / planned) * 100)) : 0;
      const isOver = category.id !== "savings" && planned > 0 && actual > planned;
      const note =
        category.id === "savings"
          ? `${formatMoney(actual)} sparat/kvar / mål ${formatMoney(planned)}`
          : `${formatMoney(-actual)} använt / ${formatMoney(planned)}`;
      return `
        <div class="chart-row ${isOver ? "over-budget" : ""}">
          <span class="chart-label">${category.label}</span>
          <span class="bar-track">
            <span class="bar-fill" style="--width: ${width}%; --color: ${getCategoryColor(category.id)}"></span>
          </span>
          <span class="chart-note">${note}</span>
        </div>
      `;
    })
    .join("");
}

function renderReportOnly() {
  const summary = computeMonth(state.selectedMonth);
  els.reportOutput.textContent = buildReport(summary);
}

function getMonthTransactions(month) {
  return transactions.filter((tx) => tx.month === month);
}

function getDecision(tx) {
  return normalizeDecision(tx, { ...tx.defaultDecision, ...(state.overrides[tx.id] || {}) });
}

function setDecision(tx, decision) {
  state.overrides[tx.id] = decision;
}

function withDecision(tx) {
  return { ...tx, ...getDecision(tx) };
}

function normalizeDecision(tx, decision) {
  const next = { ...decision };

  if (tx.amount > 0) {
    if (!["ownIncome", "missionIncome", "otherIncome"].includes(next.bucket)) {
      next.bucket = tx.defaultDecision.bucket;
    }
    next.category = "income";
    return next;
  }

  next.category = normalizeCategoryId(next.category);

  if (next.category === "mission" || next.bucket === "mission") {
    next.bucket = "mission";
    next.category = "mission";
  } else if (next.category === "unclear" || next.bucket === "unclear") {
    const hasChosenExpenseCategory = getExpenseCategories().some((category) => category.id === next.category);
    if (hasChosenExpenseCategory) {
      next.bucket = "own";
    } else {
      next.bucket = "unclear";
      next.category = "unclear";
    }
  }

  if (next.bucket === "unclear") {
    next.category = "unclear";
  } else if (next.bucket !== "mission") {
    next.bucket = "own";
    const ownCategoryIds = getExpenseCategories().map((category) => category.id);
    const suggestedCategory = tx.defaultDecision.suggestedCategory || tx.defaultDecision.category;
    next.category = normalizeCategoryId(next.category);
    if (!ownCategoryIds.includes(next.category)) {
      const normalizedSuggestion = normalizeCategoryId(suggestedCategory);
      next.category = ownCategoryIds.includes(normalizedSuggestion) ? normalizedSuggestion : "other";
    }
  }

  return next;
}

function categoryOptions(tx) {
  let available;
  if (tx.amount > 0) {
    available = getAllCategories().filter((category) => category.id === "income");
  } else {
    available = getAllCategories().filter((category) => category.id !== "income");
  }

  return available
    .map((category) => `<option value="${category.id}" ${tx.category === category.id ? "selected" : ""}>${category.label}</option>`)
    .join("");
}

function computeMonth(month) {
  const monthTransactions = getMonthTransactions(month).map(withDecision);
  const byCategory = {};
  const byCategoryCount = {};
  let ownSpent = 0;
  let missionSpent = 0;
  let unclearSpent = 0;
  let missionIncome = 0;
  let ownIncome = 0;
  let ownCount = 0;
  let missionCount = 0;
  let unclearCount = 0;

  monthTransactions.forEach((tx) => {
    if (tx.amount > 0) {
      if (tx.bucket === "ownIncome") ownIncome += tx.amount;
      if (tx.bucket === "missionIncome") missionIncome += tx.amount;
      return;
    }

    const amount = Math.abs(tx.amount);
    if (tx.bucket === "own") {
      ownSpent += amount;
      ownCount += 1;
      byCategory[tx.category] = (byCategory[tx.category] || 0) + amount;
      byCategoryCount[tx.category] = (byCategoryCount[tx.category] || 0) + 1;
    } else if (tx.bucket === "mission") {
      missionSpent += amount;
      missionCount += 1;
    } else {
      unclearSpent += amount;
      unclearCount += 1;
    }
  });

  const negativeCount = monthTransactions.filter((tx) => tx.amount < 0).length;
  const clarity = negativeCount ? Math.round(((negativeCount - unclearCount) / negativeCount) * 100) : 100;
  const biggestCategory = Object.entries(byCategory)
    .map(([id, amount]) => ({ id, amount, label: getCategoryLabel(id) }))
    .sort((a, b) => b.amount - a.amount)[0];

  return {
    month,
    transactions: monthTransactions,
    ownSpent,
    ownCount,
    missionSpent,
    missionCount,
    missionIncome,
    ownIncome,
    unclearCount,
    clarity,
    byCategory,
    byCategoryCount,
    biggestCategory,
    remaining: MONTHLY_ALLOWANCE - ownSpent,
    unclearSpent,
  };
}

function findPossibleMatch(tx, monthTransactions) {
  const target = Math.abs(tx.amount);
  return monthTransactions
    .filter((item) => item.amount > 0 && Math.abs(item.amount - target) < 0.51 && item.id !== tx.id)
    .map((item) => ({ ...item, distance: Math.abs(daysBetween(tx.date, item.date)) }))
    .filter((item) => item.distance <= 4)
    .sort((a, b) => a.distance - b.distance)[0];
}

function getRowHint(tx, match) {
  if (tx.bucket === "mission") return "räknas bort från Simons egna pengar";
  if (tx.bucket === "unclear") {
    const parts = [];
    if (match) parts.push(`möjlig uppdragsmatch: ${formatMoney(match.amount)} ${formatShortDate(match.date)}`);
    if (tx.suggestedCategory) parts.push(`förslag: ${getCategoryLabel(tx.suggestedCategory)}`);
    return parts.join(" · ") || "behöver förklaras innan utbetalning";
  }
  if (match) return `möjlig match: ${formatMoney(match.amount)} ${formatShortDate(match.date)}`;
  if (tx.amount > 0 && tx.bucket === "missionIncome") return "pengar för Mammauppdrag";
  if (tx.amount > 0 && tx.bucket === "ownIncome") return "räknas som Simons pengar";
  return "";
}

function getRowClass(tx) {
  if (tx.amount > 0) return "is-income";
  if (tx.bucket === "mission") return "is-mission";
  if (tx.bucket === "unclear") return "is-unclear";
  return "";
}

function getBudget(month) {
  const savedBudget = state.budgets[month] || {};
  return Object.fromEntries(
    getBudgetCategories().map((category) => [category.id, Number(savedBudget[category.id] ?? category.defaultAmount)]),
  );
}

function getReflectionFromInputs() {
  return {
    bestBuy: els.bestBuyInput.value,
    skipBuy: els.skipBuyInput.value,
    surprise: els.surpriseInput.value,
    goal: els.goalInput.value,
  };
}

function buildReport(summary) {
  const reflection = state.reflections[state.selectedMonth] || {};
  const budget = getBudget(state.selectedMonth);
  const budgetCategories = getBudgetCategories();
  const budgetLine = budgetCategories.map((category) => `${category.label}: ${formatMoney(budget[category.id] || 0)}`).join(", ");
  const topCategory = summary.biggestCategory ? `${summary.biggestCategory.label} (${formatMoney(-summary.biggestCategory.amount)})` : "ingen";

  return [
    `Simons Pengacheck - ${formatMonth(summary.month)}`,
    "",
    `Simonutgifter: ${formatMoney(-summary.ownSpent)} (${summary.ownCount} rader)`,
    `Mammauppdrag: ${formatMoney(-summary.missionSpent)} (${summary.missionCount} rader, borträknas)`,
    `Kvar av 1 250 kr: ${formatMoney(summary.remaining)}`,
    `Störst kategori: ${topCategory}`,
    `Oklara rader: ${summary.unclearCount}`,
    "",
    `Bästa köpet: ${reflection.bestBuy || "-"}`,
    `Kunde skippat: ${reflection.skipBuy || "-"}`,
    `Största överraskningen: ${reflection.surprise || "-"}`,
    `Nästa månads mål: ${reflection.goal || "-"}`,
    "",
    `Budget ${formatNextMonth(summary.month)}: ${budgetLine}`,
  ].join("\n");
}

function getCustomCategoryLabels() {
  const labels = Array.isArray(state.customCategories) ? state.customCategories : [];
  return [labels[0] || "", labels[1] || ""];
}

function getCustomExpenseCategories() {
  return getCustomCategoryLabels()
    .map((label, index) => ({
      id: `custom${index + 1}`,
      label: label.trim(),
      color: customCategoryColors[index],
      defaultAmount: 0,
    }))
    .filter((category) => category.label);
}

function getExpenseCategories() {
  return [...baseExpenseCategories, ...getCustomExpenseCategories()];
}

function getBudgetCategories() {
  return getExpenseCategories().map((category) => ({
    ...category,
    defaultAmount: baseBudgetDefaults[category.id] ?? category.defaultAmount ?? 0,
  }));
}

function getAllCategories() {
  return [...getExpenseCategories(), ...systemCategories];
}

function normalizeCategoryId(categoryId) {
  const mapped = legacyCategoryMap[categoryId] || categoryId;
  return getAllCategories().some((category) => category.id === mapped) ? mapped : "other";
}

function formatMonth(month) {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 1, 1);
  return capitalize(monthNames.format(date));
}

function formatNextMonth(month) {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex, 1);
  return capitalize(monthNames.format(date));
}

function formatShortDate(date) {
  return date.slice(5);
}

function daysBetween(a, b) {
  return (new Date(a) - new Date(b)) / 86400000;
}

function formatMoney(value) {
  const normalized = Math.abs(value) < 0.005 ? 0 : value;
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: Number.isInteger(normalized) ? 0 : 2,
  }).format(normalized);
}

function getCategoryColor(id) {
  return getAllCategories().find((category) => category.id === id)?.color || "#7a8792";
}

function getCategoryLabel(id) {
  return getAllCategories().find((category) => category.id === id)?.label || id;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return entities[char];
  });
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/\n/g, " ");
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
