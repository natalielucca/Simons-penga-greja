const CONFIG_KEY = "simons-penga-greja-supabase-config";
const SELECTED_MONTH_KEY = "simons-penga-greja-selected-month";
const MONTHLY_ALLOWANCE = 1250;
const START_MONTH = "2026-04";

const baseExpenseCategories = [
  { id: "restaurant_fun", label: "Restaurang/Nöje", color: "#ca5b4c", defaultAmount: 400 },
  { id: "snacks", label: "Snacks", color: "#d79b2a", defaultAmount: 150 },
  { id: "clothes", label: "Kläder", color: "#24715f", defaultAmount: 200 },
  { id: "savings", label: "Spara", color: "#4f738f", defaultAmount: 300 },
  { id: "other", label: "Övrigt", color: "#7a8792", defaultAmount: 200 },
];

const systemCategories = [
  { id: "mission", label: "Mammauppdrag", color: "#4d9b6f" },
  { id: "unclear", label: "Oklart", color: "#b67720" },
  { id: "income", label: "Pengar in", color: "#285f8f" },
];

const customCategoryColors = ["#7b5ea8", "#319c89"];
const monthNames = new Intl.DateTimeFormat("sv-SE", { month: "long", year: "numeric" });

const els = {
  setupPanel: document.querySelector("#setupPanel"),
  setupForm: document.querySelector("#setupForm"),
  setupStatus: document.querySelector("#setupStatus"),
  supabaseUrlInput: document.querySelector("#supabaseUrlInput"),
  supabaseAnonInput: document.querySelector("#supabaseAnonInput"),
  authPanel: document.querySelector("#authPanel"),
  authForm: document.querySelector("#authForm"),
  authEmail: document.querySelector("#authEmail"),
  authPassword: document.querySelector("#authPassword"),
  authStatus: document.querySelector("#authStatus"),
  signUpButton: document.querySelector("#signUpButton"),
  changeConnectionButton: document.querySelector("#changeConnectionButton"),
  signOutButton: document.querySelector("#signOutButton"),
  userPill: document.querySelector("#userPill"),
  appContent: document.querySelector("#appContent"),
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

let db = null;
let session = null;
let transactions = [];
let months = [];
let state = {
  selectedMonth: localStorage.getItem(SELECTED_MONTH_KEY) || START_MONTH,
  role: null,
  reflections: {},
  budgets: {},
  customCategories: ["", ""],
};

init();

function init() {
  els.setupForm.addEventListener("submit", handleSetupSave);
  els.authForm.addEventListener("submit", handleSignIn);
  els.signUpButton.addEventListener("click", handleSignUp);
  els.changeConnectionButton.addEventListener("click", handleChangeConnection);
  els.signOutButton.addEventListener("click", handleSignOut);
  els.monthTabs.addEventListener("click", handleMonthClick);
  els.transactionBody.addEventListener("change", handleTransactionChange);
  els.pasteForm.addEventListener("submit", handlePasteSubmit);
  els.budgetControls.addEventListener("input", handleBudgetInput);
  els.customCategoryFields.addEventListener("input", handleCustomCategoryInput);
  els.copyReportButton.addEventListener("click", handleCopyReport);
  els.resetButton.addEventListener("click", () => loadAppData());
  els.printButton.addEventListener("click", () => window.print());

  [els.bestBuyInput, els.skipBuyInput, els.surpriseInput, els.goalInput].forEach((input) => {
    input.addEventListener("input", debounce(saveReflectionFromInputs, 450));
  });

  const config = getSupabaseConfig();
  if (!config) {
    showOnly("setup");
    return;
  }

  if (!window.supabase?.createClient) {
    showOnly("setup");
    setStatus(els.setupStatus, "Supabase-biblioteket kunde inte laddas. Testa att ladda om sidan.", true);
    return;
  }

  db = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  startAuth();
}

async function startAuth() {
  const { data } = await db.auth.getSession();
  session = data.session;

  db.auth.onAuthStateChange((_event, nextSession) => {
    session = nextSession;
    if (session) loadAppData();
    else showOnly("auth");
  });

  if (session) await loadAppData();
  else showOnly("auth");
}

async function handleSetupSave(event) {
  event.preventDefault();
  const supabaseUrl = normalizeSupabaseUrl(els.supabaseUrlInput.value);
  const supabaseAnonKey = els.supabaseAnonInput.value.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    setStatus(els.setupStatus, "Fyll i Project URL och anon/publishable key.", true);
    return;
  }

  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl)) {
    setStatus(els.setupStatus, "URL:en ska se ut så här: https://projekt-id.supabase.co", true);
    return;
  }

  localStorage.setItem(CONFIG_KEY, JSON.stringify({ supabaseUrl, supabaseAnonKey }));
  setStatus(els.setupStatus, "Sparat. Laddar om...");
  window.location.reload();
}

async function handleSignIn(event) {
  event.preventDefault();
  const email = els.authEmail.value.trim();
  const password = els.authPassword.value;
  const { error } = await db.auth.signInWithPassword({ email, password });
  setStatus(els.authStatus, error ? error.message : "Loggar in...", Boolean(error));
}

async function handleSignUp() {
  const email = els.authEmail.value.trim();
  const password = els.authPassword.value;
  const { error } = await db.auth.signUp({ email, password });
  setStatus(
    els.authStatus,
    error ? error.message : "Konto skapat. Lägg användaren i household_members i Supabase innan datan syns.",
    Boolean(error),
  );
}

async function handleChangeConnection() {
  localStorage.removeItem(CONFIG_KEY);
  await db?.auth?.signOut();
  window.location.reload();
}

async function handleSignOut() {
  await db.auth.signOut();
}

async function loadAppData() {
  if (!session) return;
  showOnly("app");
  setStatus(els.readyPill, "Laddar...");
  els.userPill.textContent = session.user.email || "Inloggad";
  els.userPill.classList.remove("is-hidden");
  els.signOutButton.classList.remove("is-hidden");

  const [
    { data: memberRow, error: memberError },
    { data: transactionRows, error: transactionError },
    { data: reflectionRows, error: reflectionError },
    { data: budgetRows, error: budgetError },
    { data: settingsRow, error: settingsError },
  ] = await Promise.all([
    db.from("household_members").select("role").eq("user_id", session.user.id).maybeSingle(),
    db.from("transactions").select("*").order("date", { ascending: false }),
    db.from("reflections").select("*"),
    db.from("budgets").select("*"),
    db.from("app_settings").select("*").eq("id", "main").maybeSingle(),
  ]);

  const error = memberError || transactionError || reflectionError || budgetError || settingsError;
  if (error) {
    setStatus(els.readyPill, "Databasfel", true);
    els.reportOutput.textContent = error.message;
    return;
  }

  if (!memberRow) {
    setStatus(els.readyPill, "Ingen åtkomst ännu", true);
    els.reportOutput.textContent = "Kontot finns, men är inte tillagt i household_members i Supabase ännu.";
    return;
  }

  state.role = memberRow.role;
  transactions = (transactionRows || []).map(normalizeTransaction);
  months = [...new Set(transactions.map((tx) => tx.month))].sort().reverse();
  if (!months.includes(state.selectedMonth)) {
    state.selectedMonth = months.includes(START_MONTH) ? START_MONTH : months[0] || START_MONTH;
  }

  state.reflections = Object.fromEntries((reflectionRows || []).map((row) => [row.month, row]));
  state.budgets = groupBudgetsByMonth(budgetRows || []);
  state.customCategories = [settingsRow?.custom1 || "", settingsRow?.custom2 || ""];
  render();
}

function normalizeTransaction(row) {
  return {
    id: row.id,
    date: row.date,
    text: row.text,
    amount: Number(row.amount),
    category: row.category || (Number(row.amount) > 0 ? "income" : "unclear"),
    suggestedCategory: row.suggested_category || "other",
    note: row.note || "",
    month: row.date.slice(0, 7),
  };
}

function groupBudgetsByMonth(rows) {
  return rows.reduce((acc, row) => {
    acc[row.month] ||= {};
    acc[row.month][row.category] = Number(row.amount);
    return acc;
  }, {});
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
  els.pasteInput.disabled = !canWrite();
  els.pasteForm.querySelector("button[type='submit']").disabled = !canWrite();
}

function renderMonthTabs() {
  const tabMonths = months.length ? months : [state.selectedMonth];
  els.monthTabs.innerHTML = tabMonths
    .map((month) => {
      const active = month === state.selectedMonth ? " is-active" : "";
      return `<button class="tab-button${active}" type="button" data-month="${month}">${formatMonth(month)}</button>`;
    })
    .join("");
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
    if (input) input.disabled = !canWrite();
  });
}

function renderTransactions() {
  const monthTransactions = getMonthTransactions(state.selectedMonth);
  if (!monthTransactions.length) {
    els.transactionBody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">Inga rader ännu. Klistra in bankrader längst ner på sidan.</div>
        </td>
      </tr>
    `;
    return;
  }

  els.transactionBody.innerHTML = monthTransactions
    .map((tx) => {
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
            <select class="row-select" data-id="${tx.id}" data-field="category" ${tx.amount > 0 || !canWrite() ? "disabled" : ""}>
              ${categoryOptions(tx)}
            </select>
          </td>
          <td>
            <input class="note-input" data-id="${tx.id}" data-field="note" value="${escapeAttribute(tx.note)}" placeholder="kort" ${canWrite() ? "" : "disabled"} />
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderSummary() {
  const summary = computeMonth(state.selectedMonth);
  const cards = getExpenseCategories().map((category) => {
    const amount = summary.byCategory[category.id] || 0;
    const count = summary.byCategoryCount[category.id] || 0;
    return {
      label: category.label,
      value: formatMoney(-amount),
      note: `${count} rad${count === 1 ? "" : "er"}`,
    };
  });

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

function renderReflections() {
  const reflection = state.reflections[state.selectedMonth] || {};
  els.bestBuyInput.value = reflection.best_buy || "";
  els.skipBuyInput.value = reflection.skip_buy || "";
  els.surpriseInput.value = reflection.surprise || "";
  els.goalInput.value = reflection.goal || "";
  [els.bestBuyInput, els.skipBuyInput, els.surpriseInput, els.goalInput].forEach((input) => {
    input.disabled = !canWrite();
  });
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
    .map((category) => `
      <label class="budget-row">
        <span class="budget-name">
          <span class="budget-dot" style="--dot: ${getCategoryColor(category.id)}"></span>
          ${category.label}
        </span>
        <input class="budget-input" type="number" min="0" step="10" data-budget-id="${category.id}" value="${budget[category.id] || 0}" ${canWrite() ? "" : "disabled"} />
      </label>
    `)
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
  els.reportOutput.textContent = buildReport(computeMonth(state.selectedMonth));
}

function handleMonthClick(event) {
  const button = event.target.closest("[data-month]");
  if (!button) return;
  state.selectedMonth = button.dataset.month;
  localStorage.setItem(SELECTED_MONTH_KEY, state.selectedMonth);
  render();
}

async function handleTransactionChange(event) {
  if (!canWrite()) {
    setStatus(els.readyPill, "Endast Simon kan ändra.", true);
    render();
    return;
  }

  const target = event.target;
  const id = target.dataset.id;
  if (!id) return;

  const tx = transactions.find((item) => item.id === id);
  if (!tx) return;

  const patch = {};
  if (target.dataset.field === "category") {
    patch.category = target.value;
    tx.category = target.value;
  }
  if (target.dataset.field === "note") {
    patch.note = target.value;
    tx.note = target.value;
  }

  const { error } = await db.from("transactions").update(patch).eq("id", id);
  if (error) {
    setStatus(els.readyPill, "Kunde inte spara", true);
    await loadAppData();
    return;
  }

  render();
}

async function handlePasteSubmit(event) {
  event.preventDefault();
  if (!canWrite()) {
    setStatus(els.pasteStatus, "Endast Simon kan lägga till rader.", true);
    return;
  }

  const parsedRows = els.pasteInput.value
    .split("\n")
    .map((line, index) => parseTransactionLine(line, index))
    .filter(Boolean);

  if (!parsedRows.length) {
    setStatus(els.pasteStatus, "Klistra in minst en bankrad först.", true);
    return;
  }

  const rows = parsedRows.map((tx) => ({
    date: tx.date,
    text: tx.text,
    amount: tx.amount,
    category: tx.amount > 0 ? "income" : "unclear",
    suggested_category: tx.suggestedCategory,
    note: "",
    created_by: session.user.id,
  }));

  const { error } = await db
    .from("transactions")
    .upsert(rows, { onConflict: "date,text,amount", ignoreDuplicates: true });

  if (error) {
    setStatus(els.pasteStatus, error.message, true);
    return;
  }

  const importedMonths = [...new Set(rows.map((row) => row.date.slice(0, 7)))].sort();
  if (importedMonths.length === 1) {
    state.selectedMonth = importedMonths[0];
    localStorage.setItem(SELECTED_MONTH_KEY, state.selectedMonth);
  }

  els.pasteInput.value = "";
  setStatus(els.pasteStatus, `${rows.length} rad${rows.length === 1 ? "" : "er"} skickade till databasen.`);
  await loadAppData();
}

function handleBudgetInput(event) {
  if (!canWrite()) {
    setStatus(els.readyPill, "Endast Simon kan ändra budget.", true);
    renderBudget();
    return;
  }

  const input = event.target.closest("[data-budget-id]");
  if (!input) return;
  const budget = getBudget(state.selectedMonth);
  budget[input.dataset.budgetId] = Number(input.value || 0);
  state.budgets[state.selectedMonth] = budget;
  renderBudget();
  renderReportOnly();
  saveBudgetAmount(input.dataset.budgetId, Number(input.value || 0));
}

function handleCustomCategoryInput(event) {
  if (!canWrite()) {
    setStatus(els.readyPill, "Endast Simon kan ändra kategorier.", true);
    renderCustomCategories();
    return;
  }

  const input = event.target.closest("[data-custom-index]");
  if (!input) return;
  const labels = getCustomCategoryLabels();
  labels[Number(input.dataset.customIndex)] = input.value;
  state.customCategories = labels;
  renderLegend();
  renderTransactions();
  renderSummary();
  renderBudget();
  renderReportOnly();
  saveSettings();
}

async function handleCopyReport() {
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
}

const saveBudgetAmount = debounce(async (category, amount) => {
  await db.from("budgets").upsert({ month: state.selectedMonth, category, amount });
}, 400);

const saveSettings = debounce(async () => {
  const [custom1, custom2] = getCustomCategoryLabels();
  await db.from("app_settings").upsert({ id: "main", custom1, custom2 });
}, 450);

async function saveReflectionFromInputs() {
  if (!canWrite()) {
    setStatus(els.readyPill, "Endast Simon kan ändra.", true);
    renderReflections();
    return;
  }

  const row = {
    month: state.selectedMonth,
    best_buy: els.bestBuyInput.value,
    skip_buy: els.skipBuyInput.value,
    surprise: els.surpriseInput.value,
    goal: els.goalInput.value,
  };
  state.reflections[state.selectedMonth] = row;
  renderReportOnly();
  await db.from("reflections").upsert(row);
}

function parseTransactionLine(line, index) {
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

  return {
    id: `paste-${index}`,
    date,
    text,
    amount,
    month: date.slice(0, 7),
    suggestedCategory: suggestCategory(text),
  };
}

function parseAmount(value) {
  return Number(String(value).replace(/\s/g, "").replace(",", "."));
}

function suggestCategory(textValue) {
  const text = textValue.toLowerCase();
  if (matches(text, ["luxury sushi", "max burgers", "maxigrillen", "mister york", "sannegarden", "sannegardens", "pizzabagerie", "kfc", "east kitchen", "hamburg", "jumpyard", "liseberg", "ruddalens", "bengans"])) {
    return "restaurant_fun";
  }
  if (matches(text, ["coop", "tempo", "ica nara", "ada godis", "selecta", "pressbyran", "mathornan", "samnik", "kk-butiken", "munke"])) {
    return "snacks";
  }
  if (matches(text, ["vinted"])) return "clothes";
  return "other";
}

function matches(text, needles) {
  return needles.some((needle) => text.includes(needle));
}

function getMonthTransactions(month) {
  return transactions.filter((tx) => tx.month === month);
}

function computeMonth(month) {
  const monthTransactions = getMonthTransactions(month);
  const byCategory = {};
  const byCategoryCount = {};
  let ownSpent = 0;
  let missionSpent = 0;
  let missionIncome = 0;
  let ownIncome = 0;
  let ownCount = 0;
  let missionCount = 0;
  let unclearSpent = 0;
  let unclearCount = 0;

  monthTransactions.forEach((tx) => {
    if (tx.amount > 0) {
      ownIncome += tx.amount;
      return;
    }

    const amount = Math.abs(tx.amount);
    if (tx.category === "mission") {
      missionSpent += amount;
      missionCount += 1;
    } else if (tx.category === "unclear") {
      unclearSpent += amount;
      unclearCount += 1;
    } else {
      ownSpent += amount;
      ownCount += 1;
      byCategory[tx.category] = (byCategory[tx.category] || 0) + amount;
      byCategoryCount[tx.category] = (byCategoryCount[tx.category] || 0) + 1;
    }
  });

  const negativeCount = monthTransactions.filter((tx) => tx.amount < 0).length;
  const clarity = negativeCount ? Math.round(((negativeCount - unclearCount) / negativeCount) * 100) : 100;
  const biggestCategory = Object.entries(byCategory)
    .map(([id, amount]) => ({ id, amount, label: getCategoryLabel(id) }))
    .sort((a, b) => b.amount - a.amount)[0];

  return {
    month,
    byCategory,
    byCategoryCount,
    ownSpent,
    ownCount,
    missionSpent,
    missionCount,
    missionIncome,
    ownIncome,
    unclearSpent,
    unclearCount,
    clarity,
    biggestCategory,
    remaining: MONTHLY_ALLOWANCE - ownSpent,
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
  if (tx.category === "mission") return "räknas bort från Simons egna pengar";
  if (tx.category === "unclear") {
    const parts = [];
    if (match) parts.push(`möjlig uppdragsmatch: ${formatMoney(match.amount)} ${formatShortDate(match.date)}`);
    if (tx.suggestedCategory) parts.push(`förslag: ${getCategoryLabel(tx.suggestedCategory)}`);
    return parts.join(" · ") || "behöver förklaras innan utbetalning";
  }
  if (match) return `möjlig match: ${formatMoney(match.amount)} ${formatShortDate(match.date)}`;
  if (tx.amount > 0) return "pengar in";
  return "";
}

function getRowClass(tx) {
  if (tx.amount > 0) return "is-income";
  if (tx.category === "mission") return "is-mission";
  if (tx.category === "unclear") return "is-unclear";
  return "";
}

function categoryOptions(tx) {
  const available = tx.amount > 0
    ? getAllCategories().filter((category) => category.id === "income")
    : getAllCategories().filter((category) => category.id !== "income");

  return available
    .map((category) => `<option value="${category.id}" ${tx.category === category.id ? "selected" : ""}>${category.label}</option>`)
    .join("");
}

function getBudget(month) {
  const saved = state.budgets[month] || {};
  return Object.fromEntries(
    getBudgetCategories().map((category) => [category.id, Number(saved[category.id] ?? category.defaultAmount)]),
  );
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
  return getExpenseCategories();
}

function getAllCategories() {
  return [...getExpenseCategories(), ...systemCategories];
}

function buildReport(summary) {
  const reflection = state.reflections[state.selectedMonth] || {};
  const budget = getBudget(state.selectedMonth);
  const budgetLine = getBudgetCategories().map((category) => `${category.label}: ${formatMoney(budget[category.id] || 0)}`).join(", ");
  const topCategory = summary.biggestCategory ? `${summary.biggestCategory.label} (${formatMoney(-summary.biggestCategory.amount)})` : "ingen";

  return [
    `Simons penga-greja - ${formatMonth(summary.month)}`,
    "",
    `Simonutgifter: ${formatMoney(-summary.ownSpent)} (${summary.ownCount} rader)`,
    `Mammauppdrag: ${formatMoney(-summary.missionSpent)} (${summary.missionCount} rader, borträknas)`,
    `Kvar av 1 250 kr: ${formatMoney(summary.remaining)}`,
    `Störst kategori: ${topCategory}`,
    `Oklara rader: ${summary.unclearCount}`,
    "",
    `Bästa köpet: ${reflection.best_buy || "-"}`,
    `Kunde skippat: ${reflection.skip_buy || "-"}`,
    `Största överraskningen: ${reflection.surprise || "-"}`,
    `Nästa månads mål: ${reflection.goal || "-"}`,
    "",
    `Budget ${formatNextMonth(summary.month)}: ${budgetLine}`,
  ].join("\n");
}

function getSupabaseConfig() {
  const runtime = window.PENGA_CONFIG || {};
  if (runtime.supabaseUrl && runtime.supabaseAnonKey) return runtime;
  try {
    const stored = JSON.parse(localStorage.getItem(CONFIG_KEY));
    if (stored?.supabaseUrl && stored?.supabaseAnonKey) return stored;
  } catch {
    return null;
  }
  return null;
}

function normalizeSupabaseUrl(value) {
  const raw = value.trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    if (url.hostname.endsWith(".supabase.co")) {
      return `${url.protocol}//${url.hostname}`;
    }
    return raw;
  } catch {
    return raw;
  }
}

function showOnly(mode) {
  els.setupPanel.classList.toggle("is-hidden", mode !== "setup");
  els.authPanel.classList.toggle("is-hidden", mode !== "auth");
  els.appContent.classList.toggle("is-hidden", mode !== "app");
  els.userPill.classList.toggle("is-hidden", mode !== "app");
  els.signOutButton.classList.toggle("is-hidden", mode !== "app");
}

function canWrite() {
  return state.role === "child";
}

function setStatus(element, message, isWarning = false) {
  element.textContent = message;
  element.classList.toggle("is-warning", isWarning);
}

function formatMonth(month) {
  const [year, monthIndex] = month.split("-").map(Number);
  return capitalize(monthNames.format(new Date(year, monthIndex - 1, 1)));
}

function formatNextMonth(month) {
  const [year, monthIndex] = month.split("-").map(Number);
  return capitalize(monthNames.format(new Date(year, monthIndex, 1)));
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

function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
}
