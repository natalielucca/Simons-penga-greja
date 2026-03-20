const STORAGE_KEY = "rikedomstrappan-state-v2";
const SNAKE_BEST_SCORE_KEY = "rikedomstrappan-snake-best-score";

const scenarioPresets = {
  pressed: {
    income: 29500,
    fixedCosts: 15200,
    variableCosts: 9200,
    emergencyFund: 3500,
    highInterestDebt: 58000,
    investingMonthly: 0,
    employerMatch: false,
    extraAllocation: 1000,
  },
  level4: {
    income: 71000,
    fixedCosts: 23000,
    variableCosts: 11000,
    emergencyFund: 120000,
    highInterestDebt: 0,
    investingMonthly: 5000,
    employerMatch: true,
    extraAllocation: 3000,
  },
  autopilot: {
    income: 71000,
    fixedCosts: 24000,
    variableCosts: 10000,
    emergencyFund: 135000,
    highInterestDebt: 0,
    investingMonthly: 9000,
    employerMatch: true,
    extraAllocation: 6000,
  },
};

const defaultState = {
  ...scenarioPresets.level4,
};

const fieldIds = [
  "income",
  "fixedCosts",
  "variableCosts",
  "emergencyFund",
  "highInterestDebt",
  "investingMonthly",
  "extraAllocation",
];

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return {
      ...defaultState,
      ...stored,
    };
  } catch (error) {
    return { ...defaultState };
  }
}

const state = loadState();
let snakeState = window.SnakeGame.createInitialState();
let snakeBestScore = loadSnakeBestScore();
let snakeTimerId = null;

function loadSnakeBestScore() {
  const value = Number(localStorage.getItem(SNAKE_BEST_SCORE_KEY));
  return Number.isFinite(value) ? value : 0;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function saveSnakeBestScore() {
  localStorage.setItem(SNAKE_BEST_SCORE_KEY, String(snakeBestScore));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value) {
  return `${Math.round(value)}%`;
}

function clampRatio(value) {
  return Math.max(0, Math.min(1, value));
}

function getMetrics(source = state) {
  const monthlyCosts = source.fixedCosts + source.variableCosts;
  const monthlyMargin = source.income - monthlyCosts;
  const needsBuffer = monthlyCosts * 3;
  const savingsRate = source.income > 0 ? (source.investingMonthly / source.income) * 100 : 0;
  const freeCashAfterInvesting = monthlyMargin - source.investingMonthly;

  return {
    monthlyCosts,
    monthlyMargin,
    needsBuffer,
    savingsRate,
    freeCashAfterInvesting,
  };
}

function getLadderSteps(source = state) {
  const metrics = getMetrics(source);

  return [
    {
      id: "starter-buffer",
      title: "1. Bygg första bufferten",
      target: 10000,
      current: source.emergencyFund,
      complete: source.emergencyFund >= 10000,
      description: "Skapa ett första skydd så små kriser inte blir nya kreditköp.",
      milestoneText: "Målet är att få ihop de första 10 000 kronorna i buffert.",
    },
    {
      id: "match",
      title: "2. Ta arbetsgivarens matchning",
      target: 1,
      current: source.employerMatch ? 1 : 0,
      complete: source.employerMatch,
      description: "Om din arbetsgivare matchar pension är det ofta högsta avkastningen direkt.",
      milestoneText: "Kontrollera tjänstepension, extra insättning eller löneväxling via jobbet.",
    },
    {
      id: "debt",
      title: "3. Bli av med dyr skuld",
      target: 1,
      current: source.highInterestDebt <= 0 ? 1 : 0,
      complete: source.highInterestDebt <= 0,
      description: "Betala ned sådant som äter upp framtida sparande med hög ränta.",
      helper: source.highInterestDebt > 0 ? `${formatCurrency(source.highInterestDebt)} kvar` : "Klar",
      milestoneText:
        source.highInterestDebt > 0
          ? `Få bort de sista ${formatCurrency(source.highInterestDebt)} i dyr skuld.`
          : "Dyr skuld är redan avklarad.",
    },
    {
      id: "full-buffer",
      title: "4. Fyll upp trygghetsbufferten",
      target: metrics.needsBuffer,
      current: source.emergencyFund,
      complete: source.emergencyFund >= metrics.needsBuffer,
      description: "Sikta på ungefär tre månaders kostnader för mer vardagslugn.",
      helper: `Mål ${formatCurrency(metrics.needsBuffer)}`,
      milestoneText: `Trygghetsmålet ligger runt ${formatCurrency(metrics.needsBuffer)} baserat på dina månadskostnader.`,
    },
    {
      id: "automatic-investing",
      title: "5. Automatisera långsiktigt sparande",
      target: Math.max(source.income * 0.1, 1),
      current: source.investingMonthly,
      complete: source.investingMonthly >= source.income * 0.1 && source.investingMonthly > 0,
      description: "När grunden sitter blir nästa steg att låta investeringar gå på autopilot.",
      helper: `Rimlig start ${formatCurrency(source.income * 0.1)}/mån`,
      milestoneText: `Öka det automatiska sparandet till minst ${formatCurrency(source.income * 0.1)} per månad.`,
    },
    {
      id: "optimize",
      title: "6. Optimera och bygg vidare",
      target: 1,
      current:
        source.employerMatch &&
        source.highInterestDebt <= 0 &&
        source.emergencyFund >= metrics.needsBuffer &&
        source.investingMonthly >= source.income * 0.1
          ? 1
          : 0,
      complete:
        source.employerMatch &&
        source.highInterestDebt <= 0 &&
        source.emergencyFund >= metrics.needsBuffer &&
        source.investingMonthly >= source.income * 0.1,
      description: "Här kan du finjustera skatt, risknivå och mål som bostad eller frihetskapital.",
      milestoneText: "Nu handlar det mer om fördelning och skatteoptimering än om grundstruktur.",
    },
  ];
}

function getCurrentStep(steps) {
  return steps.find((step) => !step.complete) || steps.at(-1);
}

function findActiveScenario() {
  return Object.entries(scenarioPresets).find(([, preset]) =>
    Object.entries(preset).every(([key, value]) => state[key] === value)
  )?.[0] || null;
}

function getStatusTone(step, metrics) {
  if (metrics.monthlyMargin <= 0) {
    return "Utgifterna behöver under inkomsten först";
  }

  switch (step.id) {
    case "starter-buffer":
      return "Stabilisera grunden först";
    case "match":
      return "Ta gratis pengar om de finns";
    case "debt":
      return "Få bort dyr friktion i ekonomin";
    case "full-buffer":
      return "Bygg trygghet innan du maxar risk";
    case "automatic-investing":
      return "Du är på nivå 4 och bygger nu autopilot";
    default:
      return "Du är redo att optimera nästa nivå";
  }
}

function getActions(step, metrics) {
  const actions = [];

  if (metrics.monthlyMargin <= 0) {
    actions.push({
      title: "Skapa plus i månaden",
      text: `Du ligger ${formatCurrency(Math.abs(metrics.monthlyMargin))} back. Börja med att kapa rörliga kostnader eller höja inkomsten.`,
    });
  }

  if (step.id === "starter-buffer") {
    actions.push({
      title: "Fyll första kudden",
      text: `Du behöver ungefär ${formatCurrency(Math.max(0, 10000 - state.emergencyFund))} till för att nå första buffertmålet.`,
    });
  }

  if (step.id === "match") {
    actions.push({
      title: "Kolla tjänstepensionen",
      text: "Fråga HR eller lönefunktionen om matchning, extra insättning eller löneväxling redan denna vecka.",
    });
  }

  if (step.id === "debt") {
    const debtPaydownMonths =
      metrics.freeCashAfterInvesting > 0 ? Math.ceil(state.highInterestDebt / metrics.freeCashAfterInvesting) : null;

    actions.push({
      title: "Attackera dyr skuld",
      text: debtPaydownMonths
        ? `Om du lägger ${formatCurrency(metrics.freeCashAfterInvesting)} i månaden efter sparandet är skulden borta på cirka ${debtPaydownMonths} månader.`
        : "Flytta fokus från investeringar till skuld eller skapa större månadsöverskott först.",
    });
  }

  if (step.id === "full-buffer") {
    actions.push({
      title: "Bygg trygghetsnivån",
      text: `Du har ${formatCurrency(state.emergencyFund)} av ${formatCurrency(metrics.needsBuffer)}. Automatisera en överföring dagen efter lön.`,
    });
  }

  if (step.id === "automatic-investing") {
    actions.push({
      title: "Sätt sparandet på räls",
      text: `Du ligger på nivå 4. Öka det långsiktiga sparandet till minst ${formatCurrency(state.income * 0.1)} per månad för att ta steg 5.`,
    });
  }

  if (step.id === "optimize") {
    actions.push({
      title: "Välj nästa mål",
      text: "Nu kan du fördela överskottet mellan indexfonder, bostadssparande eller extra amortering utifrån din tidshorisont.",
    });
  }

  if (metrics.freeCashAfterInvesting > 0) {
    actions.push({
      title: "Rikta överskottet medvetet",
      text: `Efter kostnader och nuvarande sparande har du ungefär ${formatCurrency(metrics.freeCashAfterInvesting)} kvar att ge ett tydligt jobb varje månad.`,
    });
  }

  actions.push({
    title: "Skydda det som fungerar",
    text: "Behåll en enkel rutin: lönedag, automatisk överföring, snabb avstämning en gång i veckan.",
  });

  return actions.slice(0, 3);
}

function getSimulation(currentStep, metrics) {
  const extra = state.extraAllocation;
  const projectedMargin = metrics.monthlyMargin + extra;
  const projectedInvesting = state.investingMonthly + extra;
  let headline = `Om du styr om ${formatCurrency(extra)} extra i månaden så händer inget direkt just nu.`;
  let eta = "Ingen beräkning än";
  let targetDelta = 0;

  if (currentStep.id === "starter-buffer") {
    targetDelta = Math.max(0, 10000 - state.emergencyFund);
    const months = extra > 0 ? Math.ceil(targetDelta / extra) : null;
    headline = months
      ? `Första bufferten är på plats om cirka ${months} månader.`
      : "Öka månadens överskott för att nå första bufferten snabbare.";
    eta = months ? `${months} mån` : "Behöver överskott";
  } else if (currentStep.id === "match") {
    headline = extra > 0
      ? "Pengarna gör mest nytta först när pensionsmatchningen är aktiverad."
      : "Börja med att säkra matchning via jobbet innan du justerar belopp.";
    eta = "Manuell åtgärd";
  } else if (currentStep.id === "debt") {
    targetDelta = state.highInterestDebt;
    const months = extra > 0 ? Math.ceil(targetDelta / extra) : null;
    headline = months
      ? `Dyr skuld kan vara borta om cirka ${months} månader med det extra utrymmet.`
      : "Mer riktat överskott kortar tiden till skuldfrihet.";
    eta = months ? `${months} mån` : "Behöver överskott";
  } else if (currentStep.id === "full-buffer") {
    targetDelta = Math.max(0, metrics.needsBuffer - state.emergencyFund);
    const months = extra > 0 ? Math.ceil(targetDelta / extra) : null;
    headline = months
      ? `Trygghetsbufferten når nivå 4 på cirka ${months} månader.`
      : "Utan extra överföring står bufferten still.";
    eta = months ? `${months} mån` : "Behöver överskott";
  } else if (currentStep.id === "automatic-investing") {
    targetDelta = Math.max(0, state.income * 0.1 - state.investingMonthly);
    const months = extra > 0 ? Math.ceil(targetDelta / extra) : null;
    headline = projectedInvesting >= state.income * 0.1
      ? `Med den här ökningen når du steg 5 direkt och landar på ${formatCurrency(projectedInvesting)} i månadssparande.`
      : months
        ? `Fortsätter du så här når du steg 5 om cirka ${months} månader.`
        : "Höj ditt automatiska sparande för att kliva från nivå 4 till nivå 5.";
    eta = projectedInvesting >= state.income * 0.1 ? "Direkt" : months ? `${months} mån` : "Behöver ökning";
  } else {
    headline = `Med ${formatCurrency(extra)} extra per månad kan du fördela mer mot investeringar, amortering eller frihetsmål.`;
    eta = "Flexibelt";
  }

  return {
    projectedMargin,
    projectedInvesting,
    eta,
    headline,
    targetDelta,
  };
}

function renderSummary(step, metrics) {
  const items = [
    {
      label: "Kvar efter kostnader",
      value: formatCurrency(metrics.monthlyMargin),
      tone: metrics.monthlyMargin >= 0 ? "good" : "bad",
    },
    {
      label: "Buffertstatus",
      value: `${formatCurrency(state.emergencyFund)} / ${formatCurrency(metrics.needsBuffer)}`,
      tone: state.emergencyFund >= metrics.needsBuffer ? "good" : "neutral",
    },
    {
      label: "Dyr skuld",
      value: formatCurrency(state.highInterestDebt),
      tone: state.highInterestDebt <= 0 ? "good" : "bad",
    },
    {
      label: "Aktuellt steg",
      value: step.title.replace(/^\d+\.\s*/, ""),
      tone: "accent",
    },
  ];

  document.getElementById("summaryGrid").innerHTML = items
    .map(
      (item) => `
        <article class="summary-card summary-card--${item.tone}">
          <span>${item.label}</span>
          <strong>${item.value}</strong>
        </article>
      `
    )
    .join("");
}

function renderLadder(steps, currentStep) {
  document.getElementById("ladderList").innerHTML = steps
    .map((step) => {
      const ratio = clampRatio(step.current / step.target);
      const stateClass = step.complete ? "is-complete" : step.id === currentStep.id ? "is-active" : "";

      return `
        <article class="ladder-card ${stateClass}">
          <div class="ladder-card__top">
            <div>
              <strong>${step.title}</strong>
              <p>${step.description}</p>
            </div>
            <span class="ladder-badge">${step.complete ? "Klar" : step.id === currentStep.id ? "Nu" : "Sen"}</span>
          </div>
          <div class="progress-row">
            <div class="progress-bar">
              <span style="width: ${ratio * 100}%"></span>
            </div>
            <small>${step.helper || formatPercent(ratio * 100)}</small>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderActions(actions) {
  document.getElementById("actionList").innerHTML = actions
    .map(
      (action) => `
        <article class="action-card">
          <strong>${action.title}</strong>
          <p>${action.text}</p>
        </article>
      `
    )
    .join("");
}

function renderScenarios() {
  const activeScenario = findActiveScenario();
  const labels = {
    pressed: "Pressad",
    level4: "Nivå 4-demo",
    autopilot: "Autopilot",
  };

  document.getElementById("scenarioButtons").innerHTML = Object.keys(scenarioPresets)
    .map(
      (scenarioId) => `
        <button
          class="scenario-button ${activeScenario === scenarioId ? "is-active" : ""}"
          type="button"
          data-scenario="${scenarioId}"
        >
          ${labels[scenarioId]}
        </button>
      `
    )
    .join("");
}

function renderBudget(metrics) {
  const parts = [
    {
      label: "Fasta kostnader",
      value: state.fixedCosts,
      className: "budget-bar__fill--fixed",
    },
    {
      label: "Rörliga kostnader",
      value: state.variableCosts,
      className: "budget-bar__fill--variable",
    },
    {
      label: "Långsiktigt sparande",
      value: state.investingMonthly,
      className: "budget-bar__fill--investing",
    },
    {
      label: "Kvar att styra",
      value: Math.max(metrics.monthlyMargin - state.investingMonthly, 0),
      className: "budget-bar__fill--free",
    },
  ].filter((part) => part.value > 0);

  document.getElementById("budgetStack").innerHTML = parts
    .map((part) => {
      const ratio = state.income > 0 ? clampRatio(part.value / state.income) : 0;

      return `
        <article class="budget-bar">
          <div class="budget-bar__meta">
            <span>${part.label}</span>
            <strong>${formatCurrency(part.value)}</strong>
          </div>
          <div class="budget-bar__track">
            <span class="budget-bar__fill ${part.className}" style="width: ${ratio * 100}%"></span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderSimulation(currentStep, metrics) {
  const simulation = getSimulation(currentStep, metrics);

  document.getElementById("extraAllocationValue").textContent = formatCurrency(state.extraAllocation);

  document.getElementById("simulationGrid").innerHTML = [
    {
      label: "Extra i spel",
      value: formatCurrency(state.extraAllocation),
    },
    {
      label: "Ny sparnivå",
      value: formatCurrency(simulation.projectedInvesting),
    },
    {
      label: "Ny marginal",
      value: formatCurrency(simulation.projectedMargin),
    },
    {
      label: "Tid till nästa steg",
      value: simulation.eta,
    },
  ]
    .map(
      (item) => `
        <article class="metric-card metric-card--compact">
          <span>${item.label}</span>
          <strong>${item.value}</strong>
        </article>
      `
    )
    .join("");

  document.getElementById("simulationInsight").innerHTML = `
    <strong>Simulering</strong>
    <p>${simulation.headline}</p>
  `;
}

function renderHeader(step, metrics) {
  const ratio = clampRatio(step.current / step.target);
  const progressRing = document.getElementById("heroProgressRing");

  progressRing.style.background = `
    radial-gradient(circle, rgba(255, 249, 240, 1) 58%, transparent 59%),
    conic-gradient(var(--olive) 0 ${ratio * 360}deg, rgba(28, 34, 27, 0.08) ${ratio * 360}deg 360deg)
  `;

  document.getElementById("headlineStep").textContent = step.title.replace(/^\d+\.\s*/, "");
  document.getElementById("monthlyMargin").textContent = formatCurrency(metrics.monthlyMargin);
  document.getElementById("savingsRate").textContent = formatPercent(metrics.savingsRate);
  document.getElementById("statusTone").textContent = getStatusTone(step, metrics);
  document.getElementById("heroProgressValue").textContent = formatPercent(ratio * 100);
  document.getElementById("heroMilestone").textContent = step.title.replace(/^\d+\.\s*/, "");
  document.getElementById("heroMilestoneText").textContent = step.milestoneText;
}

function getSnakeStatusText() {
  switch (snakeState.status) {
    case "running":
      return "Spelet rullar";
    case "paused":
      return "Pausat";
    case "game-over":
      return "Game over, starta om för en ny runda";
    default:
      return "Tryck start för att spela";
  }
}

function stopSnakeLoop() {
  if (snakeTimerId) {
    window.clearInterval(snakeTimerId);
    snakeTimerId = null;
  }
}

function syncSnakeBestScore() {
  if (snakeState.score > snakeBestScore) {
    snakeBestScore = snakeState.score;
    saveSnakeBestScore();
  }
}

function renderSnakeGame() {
  const board = document.getElementById("snakeBoard");
  const snakeCells = new Map(snakeState.snake.map((segment, index) => [`${segment.x},${segment.y}`, index]));

  board.innerHTML = Array.from({ length: snakeState.gridSize * snakeState.gridSize }, (_, index) => {
    const x = index % snakeState.gridSize;
    const y = Math.floor(index / snakeState.gridSize);
    const key = `${x},${y}`;
    const snakeIndex = snakeCells.get(key);
    const classes = ["snake-cell"];

    if (snakeIndex === 0) {
      classes.push("snake-cell--head");
    } else if (snakeIndex !== undefined) {
      classes.push("snake-cell--snake");
    } else if (snakeState.food && snakeState.food.x === x && snakeState.food.y === y) {
      classes.push("snake-cell--food");
    }

    if (snakeState.crashPoint && snakeState.crashPoint.x === x && snakeState.crashPoint.y === y) {
      classes.push("snake-cell--crash");
    }

    return `<div class="${classes.join(" ")}" role="presentation"></div>`;
  }).join("");

  document.getElementById("snakeScore").textContent = String(snakeState.score);
  document.getElementById("snakeBestScore").textContent = String(snakeBestScore);
  document.getElementById("snakeStatus").textContent = getSnakeStatusText();
  document.getElementById("snakeStartButton").textContent =
    snakeState.status === "paused" ? "Fortsätt" : snakeState.status === "running" ? "Spelar" : "Starta";
  document.getElementById("snakePauseButton").disabled = snakeState.status !== "running";
}

function tickSnakeGame() {
  snakeState = window.SnakeGame.advanceGame(snakeState);
  syncSnakeBestScore();
  renderSnakeGame();

  if (snakeState.status === "game-over") {
    stopSnakeLoop();
  }
}

function startSnakeGame() {
  if (snakeState.status === "game-over") {
    snakeState = window.SnakeGame.createInitialState(snakeState.lastFoodSeed + 1);
  }

  snakeState = window.SnakeGame.startGame(snakeState);
  renderSnakeGame();
  stopSnakeLoop();
  snakeTimerId = window.setInterval(tickSnakeGame, 180);
  document.getElementById("snakeBoard").focus();
}

function pauseSnakeGame() {
  snakeState = window.SnakeGame.pauseGame(snakeState);
  stopSnakeLoop();
  renderSnakeGame();
}

function restartSnakeGame() {
  stopSnakeLoop();
  snakeState = window.SnakeGame.createInitialState(snakeState.lastFoodSeed + 1);
  renderSnakeGame();
  startSnakeGame();
}

function handleSnakeDirection(direction) {
  snakeState = window.SnakeGame.setDirection(snakeState, direction);

  if (snakeState.status === "idle") {
    startSnakeGame();
    return;
  }

  renderSnakeGame();
}

function handleSnakeKeydown(event) {
  const target = event.target;
  const isFormField =
    target instanceof HTMLElement &&
    (target.matches("input, textarea, select") || target.isContentEditable) &&
    !target.closest(".snake-card");

  if (isFormField) {
    return;
  }

  const directionMap = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    W: "up",
    s: "down",
    S: "down",
    a: "left",
    A: "left",
    d: "right",
    D: "right",
  };

  if (event.key === " ") {
    event.preventDefault();

    if (snakeState.status === "running") {
      pauseSnakeGame();
    } else if (snakeState.status === "paused" || snakeState.status === "idle") {
      startSnakeGame();
    }

    return;
  }

  if (event.key === "Enter" && snakeState.status === "game-over") {
    event.preventDefault();
    restartSnakeGame();
    return;
  }

  const direction = directionMap[event.key];

  if (!direction) {
    return;
  }

  event.preventDefault();
  handleSnakeDirection(direction);
}

function handleSnakeControlClick(event) {
  const button = event.target.closest("[data-snake-control]");

  if (!button) {
    return;
  }

  handleSnakeDirection(button.dataset.snakeControl);
}

function initSnakeGame() {
  document.addEventListener("keydown", handleSnakeKeydown);
  document.getElementById("snakeStartButton").addEventListener("click", startSnakeGame);
  document.getElementById("snakePauseButton").addEventListener("click", pauseSnakeGame);
  document.getElementById("snakeRestartButton").addEventListener("click", restartSnakeGame);
  document.querySelector(".snake-controls").addEventListener("click", handleSnakeControlClick);
  renderSnakeGame();
}

function syncForm() {
  fieldIds.forEach((fieldId) => {
    document.getElementById(fieldId).value = state[fieldId];
  });

  document.getElementById("employerMatch").checked = state.employerMatch;
}

function renderApp() {
  const steps = getLadderSteps();
  const currentStep = getCurrentStep(steps);
  const metrics = getMetrics();
  const actions = getActions(currentStep, metrics);

  syncForm();
  renderHeader(currentStep, metrics);
  renderSummary(currentStep, metrics);
  renderLadder(steps, currentStep);
  renderActions(actions);
  renderScenarios();
  renderSimulation(currentStep, metrics);
  renderBudget(metrics);
}

function applyScenario(scenarioId) {
  Object.assign(state, scenarioPresets[scenarioId]);
  saveState();
  renderApp();
}

function handleFieldInput(event) {
  const { id, type, value, checked } = event.target;

  state[id] = type === "checkbox" ? checked : Number(value);
  saveState();
  renderApp();
}

function handleScenarioClick(event) {
  const button = event.target.closest("[data-scenario]");

  if (!button) {
    return;
  }

  applyScenario(button.dataset.scenario);
}

function resetState() {
  Object.assign(state, defaultState);
  saveState();
  renderApp();
}

function init() {
  document.getElementById("financeForm").addEventListener("input", handleFieldInput);
  document.getElementById("resetButton").addEventListener("click", resetState);
  document.getElementById("scenarioButtons").addEventListener("click", handleScenarioClick);
  document.getElementById("extraAllocation").addEventListener("input", handleFieldInput);
  renderApp();
  initSnakeGame();
}

init();
