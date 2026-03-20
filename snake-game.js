(function attachSnakeGame(global) {
  const GRID_SIZE = 12;
  const START_DIRECTION = "right";
  const DIRECTION_VECTORS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const OPPOSITE_DIRECTION = {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
  };

  function createInitialSnake() {
    return [
      { x: 5, y: 6 },
      { x: 4, y: 6 },
      { x: 3, y: 6 },
    ];
  }

  function serializeCell(cell) {
    return `${cell.x},${cell.y}`;
  }

  function listOpenCells(snake) {
    const occupied = new Set(snake.map(serializeCell));
    const cells = [];

    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        if (!occupied.has(`${x},${y}`)) {
          cells.push({ x, y });
        }
      }
    }

    return cells;
  }

  function createFood(snake, seed = 0) {
    const openCells = listOpenCells(snake);

    if (openCells.length === 0) {
      return null;
    }

    return openCells[seed % openCells.length];
  }

  function createInitialState(seed = 0) {
    const snake = createInitialSnake();

    return {
      gridSize: GRID_SIZE,
      snake,
      direction: START_DIRECTION,
      queuedDirection: START_DIRECTION,
      food: createFood(snake, seed),
      score: 0,
      status: "idle",
      crashPoint: null,
      lastFoodSeed: seed,
    };
  }

  function setDirection(state, nextDirection) {
    if (!DIRECTION_VECTORS[nextDirection] || state.status === "game-over") {
      return state;
    }

    const activeDirection = state.queuedDirection || state.direction;
    if (OPPOSITE_DIRECTION[activeDirection] === nextDirection) {
      return state;
    }

    return {
      ...state,
      queuedDirection: nextDirection,
    };
  }

  function isOutOfBounds(cell) {
    return cell.x < 0 || cell.y < 0 || cell.x >= GRID_SIZE || cell.y >= GRID_SIZE;
  }

  function advanceGame(state) {
    if (state.status !== "running") {
      return state;
    }

    const nextDirection = state.queuedDirection || state.direction;
    const vector = DIRECTION_VECTORS[nextDirection];
    const nextHead = {
      x: state.snake[0].x + vector.x,
      y: state.snake[0].y + vector.y,
    };
    const willEat = state.food && nextHead.x === state.food.x && nextHead.y === state.food.y;
    const bodyToCheck = willEat ? state.snake : state.snake.slice(0, -1);
    const hitSelf = bodyToCheck.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);

    if (isOutOfBounds(nextHead) || hitSelf) {
      return {
        ...state,
        direction: nextDirection,
        queuedDirection: nextDirection,
        status: "game-over",
        crashPoint: nextHead,
      };
    }

    const snake = [nextHead, ...state.snake];
    if (!willEat) {
      snake.pop();
    }

    const nextSeed = state.lastFoodSeed + 1;
    const food = willEat ? createFood(snake, nextSeed) : state.food;
    const score = willEat ? state.score + 1 : state.score;
    const status = willEat && !food ? "game-over" : state.status;

    return {
      ...state,
      snake,
      direction: nextDirection,
      queuedDirection: nextDirection,
      food,
      score,
      status,
      crashPoint: willEat && !food ? nextHead : null,
      lastFoodSeed: willEat ? nextSeed : state.lastFoodSeed,
    };
  }

  function startGame(state) {
    return {
      ...state,
      status: "running",
      crashPoint: null,
    };
  }

  function pauseGame(state) {
    if (state.status !== "running") {
      return state;
    }

    return {
      ...state,
      status: "paused",
    };
  }

  global.SnakeGame = {
    GRID_SIZE,
    createInitialState,
    setDirection,
    advanceGame,
    startGame,
    pauseGame,
    createFood,
  };
})(window);
