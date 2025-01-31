/*************************
 * Model Module
 *************************/
const Model = (() => {
  class State {
    constructor() {
      this.score = 0;
      this.timer = 30;
      this.board = Array.from({ length: 12 }, (_, index) => ({
        id: index,
        hasMole: false,
        hasSnake: false,
        moleTimeout: null,
      }));
      this.timerIntervalId = null;
      this.moleIntervalId = null;
      this.snakeIntervalId = null;
      this.maxMoles = 3;
    }

    // Reset game state
    reset() {
      this.score = 0;
      this.timer = 30;
      this.board = this.board.map((block) => ({
        id: block.id,
        hasMole: false,
        hasSnake: false,
        moleTimeout: null,
      }));
      this.clearGameIntervals();
    }

    // Clear all game loops and timers
    clearGameIntervals() {
      if (this.timerIntervalId) {
        clearInterval(this.timerIntervalId);
        this.timerIntervalId = null;
      }
      if (this.moleIntervalId) {
        clearInterval(this.moleIntervalId);
        this.moleIntervalId = null;
      }
      if (this.snakeIntervalId) {
        clearInterval(this.snakeIntervalId);
        this.snakeIntervalId = null;
      }
      this.board.forEach((block) => clearTimeout(block.moleTimeout));
    }

    // Set a mole at a random position
    setMoleAtRandom() {
      const currentMoles = this.board.filter((block) => block.hasMole).length;

      if (currentMoles < this.maxMoles) {
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * this.board.length);
        } while (
          this.board[randomIndex].hasMole ||
          this.board[randomIndex].hasSnake
        );

        this.board[randomIndex].hasMole = true;

        // Remove the mole after 2 seconds if not clicked
        this.board[randomIndex].moleTimeout = setTimeout(() => {
          this.board[randomIndex].hasMole = false;
          View.createBoard(this.board);
        }, 2000);
      }
    }

    // Set a snake at a random position (only one at a time)
    setSnakeAtRandom() {
      let randomIndex = Math.floor(Math.random() * this.board.length);
      this.board.forEach((block) => (block.hasSnake = false));
      this.board[randomIndex].hasSnake = true;
    }

    // Start the timer
    startTimer(onUpdate, onEnd) {
      this.timerIntervalId = setInterval(() => {
        if (this.timer <= 0) {
          clearInterval(this.timerIntervalId);
          this.timerIntervalId = null;
          onEnd();
        } else {
          this.timer -= 1;
          onUpdate(this.timer);
        }
      }, 1000);
    }

    // Start mole and snake game loops
    startGameLoop(onUpdateBoard) {
      this.moleIntervalId = setInterval(() => {
        this.setMoleAtRandom();
        onUpdateBoard(this.board);
      }, 1000);

      this.snakeIntervalId = setInterval(() => {
        this.setSnakeAtRandom();
        onUpdateBoard(this.board);
      }, 2000);
    }

    increaseScore() {
      this.score += 1;
    }
  }

  return { State };
})();

/*************************
 * View Module
 *************************/
const View = (() => {
  const domSelector = {
    gameBoard: document.querySelector(".game__board"),
    scoreValue: document.querySelector(".game__score-value"),
    timerValue: document.querySelector(".timer__value"),
    startButton: document.querySelector(".game__start-button"),
  };

  // Render the game board
  const createBoard = (board) => {
    const boardHTML = board
      .map((block) => {
        let content = "";
        if (block.hasSnake) {
          content = '<img src="image/mine.jpeg" alt="snake" />';
        } else if (block.hasMole) {
          content = '<img src="image/mole.jpeg" alt="mole" />';
        }
        return `<div class="block" data-id="${block.id}">${content}</div>`;
      })
      .join("");
    domSelector.gameBoard.innerHTML = boardHTML;
  };

  const updateScore = (score) => {
    domSelector.scoreValue.textContent = score;
  };

  const updateTimer = (timer) => {
    domSelector.timerValue.textContent = timer;
  };

  return {
    domSelector,
    createBoard,
    updateScore,
    updateTimer,
  };
})();

/*************************
 * Controller Module
 *************************/
const Controller = ((view, model) => {
  const { domSelector, createBoard, updateScore, updateTimer } = view;
  const { State } = model;
  let state = new State();

  // Ensure board loads on page load (before game starts)
  const initializeGameBoard = () => {
    createBoard(state.board);
  };

  // Start the game
  const startGame = () => {
    state.reset();
    createBoard(state.board);
    updateScore(state.score);
    updateTimer(state.timer);
    domSelector.startButton.disabled = true;

    state.startTimer(
      (newTimer) => updateTimer(newTimer),
      () => {
        state.clearGameIntervals();
        alert("Time is Over!");
        domSelector.startButton.disabled = false;
      }
    );

    state.startGameLoop((newBoard) => createBoard(newBoard));
  };

  // Handle clicking moles and snakes
  const handleBlockClick = (event) => {
    const blockElem = event.target.closest(".block");
    if (!blockElem) return;

    const blockId = parseInt(blockElem.dataset.id);
    const block = state.board[blockId];

    if (block.hasSnake) {
      // Clicking snake ends game immediately
      state.clearGameIntervals(); // Stop all game timers

      // Make every block a snake before alert
      state.board.forEach((b) => (b.hasSnake = true));
      createBoard(state.board); // Update UI first

      // Delay alert so user sees all snakes appear
      setTimeout(() => {
        alert("Game Over! You clicked the snake!");
        domSelector.startButton.disabled = false;
      }, 500); // 0.5s delay for smooth visual update

      return;
    }

    if (block.hasMole) {
      state.increaseScore();
      updateScore(state.score);
      state.board[blockId] = { ...block, hasMole: false };
      clearTimeout(state.board[blockId].moleTimeout);
      createBoard(state.board);
    }
  };

  // Bootstrap event listeners
  const bootstrap = () => {
    initializeGameBoard();
    domSelector.startButton.addEventListener("click", startGame);
    domSelector.gameBoard.addEventListener("click", handleBlockClick);
  };

  return { bootstrap };
})(View, Model);

// Initialize the game
Controller.bootstrap();
