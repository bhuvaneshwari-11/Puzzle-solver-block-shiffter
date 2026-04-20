document.addEventListener("DOMContentLoaded", () => {
    const enterGameBtn = document.getElementById("enter-game-btn");
    const welcomeScreen = document.getElementById("welcome-screen");
    const gameContainer = document.querySelector(".game-container");
    const playerNameInput = document.getElementById("player-name");
    const startBtn = document.getElementById("start-btn");
    const difficultySection = document.getElementById("difficulty-section");
    const gameArea = document.getElementById("game-area");
    const targetImage = document.getElementById("target-image");
    const puzzleContainer = document.getElementById("puzzle-container");
    const movesRemaining = document.getElementById("moves-remaining");
    const submitBtn = document.getElementById("submit-btn");
    const resultMessage = document.getElementById("result-message");
    const scoreboard = document.getElementById("scoreboard");
    const scoreboardList = document.getElementById("scoreboard-list");

    const levels = {
        easy: { size: 300, grid: 3, moves: 8 },
        medium: { size: 400, grid: 4, moves: 12 },
        hard: { size: 500, grid: 5, moves: 20 }
    };

    let playerName = "";
    let remainingMoves = 0;
    let startTime;
    let elapsedTime = 0;
    let timerInterval;
    let scoreboardData = JSON.parse(localStorage.getItem("scoreboardData")) || [];

    // Welcome Screen Transition
    enterGameBtn.addEventListener("click", () => {
        welcomeScreen.style.display = "none";
        gameContainer.style.display = "block";
    });

    // Start Game
    startBtn.addEventListener("click", () => {
        playerName = playerNameInput.value.trim();
        if (!playerName) {
            alert("Please enter your name to start the game.");
            return;
        }
        playerNameInput.parentElement.classList.add("hidden");
        difficultySection.classList.remove("hidden");
    });

    // Difficulty Selection
    document.querySelectorAll(".difficulty-btn").forEach(button => {
        button.addEventListener("click", () => {
            const level = button.getAttribute("data-level");
            const { size, grid, moves } = levels[level];

            remainingMoves = moves;
            movesRemaining.textContent = `Moves remaining: ${remainingMoves}`;
            movesRemaining.classList.remove("hidden");

            const imageUrl = `https://picsum.photos/${size}?random=${Date.now()}`;
            targetImage.src = imageUrl;

            targetImage.onload = () => {
                createPuzzle(imageUrl, grid, size);

                difficultySection.classList.add("hidden");
                gameArea.classList.remove("hidden");
                scoreboard.classList.remove("hidden");

                startTime = Date.now();
                timerInterval = setInterval(updateTime, 1000);
            };
        });
    });

    // Timer
    function updateTime() {
        elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        document.getElementById("game-instructions").textContent = `Time spent: ${elapsedTime}s`;
    }

    // Puzzle Creation
    function createPuzzle(imageUrl, grid, size) {
        puzzleContainer.innerHTML = "";
        puzzleContainer.style.width = `${size}px`;
        puzzleContainer.style.height = `${size}px`;
        puzzleContainer.style.gridTemplateColumns = `repeat(${grid}, 1fr)`;
        puzzleContainer.style.gridTemplateRows = `repeat(${grid}, 1fr)`;

        const pieceSize = size / grid;
        const pieces = [];

        for (let row = 0; row < grid; row++) {
            for (let col = 0; col < grid; col++) {
                const piece = document.createElement("div");
                piece.classList.add("puzzle-piece");
                piece.style.width = `${pieceSize}px`;
                piece.style.height = `${pieceSize}px`;
                piece.style.backgroundImage = `url('${imageUrl}')`;
                piece.style.backgroundPosition = `-${col * pieceSize}px -${row * pieceSize}px`;
                piece.style.backgroundSize = `${size}px ${size}px`;
                piece.dataset.correctIndex = `${row * grid + col}`;
                pieces.push(piece);
            }
        }

        shuffleArray(pieces).forEach((piece, index) => {
            piece.dataset.currentIndex = index;
            puzzleContainer.appendChild(piece);

            piece.setAttribute("draggable", true);
            piece.addEventListener("dragstart", handleDragStart);
            piece.addEventListener("dragover", handleDragOver);
            piece.addEventListener("drop", handleDrop);
        });
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Drag and Drop
    let draggedPiece = null;

    function handleDragStart(event) {
        draggedPiece = event.target;
    }

    function handleDragOver(event) {
        event.preventDefault();
    }

    function handleDrop(event) {
        event.preventDefault();
        const targetPiece = event.target;

        if (!targetPiece.classList.contains("puzzle-piece")) return;

        const draggedIndex = draggedPiece.dataset.currentIndex;
        const targetIndex = targetPiece.dataset.currentIndex;
        draggedPiece.dataset.currentIndex = targetIndex;
        targetPiece.dataset.currentIndex = draggedIndex;

        const draggedParent = draggedPiece.parentElement;
        const draggedNextSibling = draggedPiece.nextSibling === targetPiece ? draggedPiece : draggedPiece.nextSibling;
        draggedParent.insertBefore(draggedPiece, targetPiece);
        draggedParent.insertBefore(targetPiece, draggedNextSibling);

        remainingMoves--;
        movesRemaining.textContent = `Moves remaining: ${remainingMoves}`;

        if (remainingMoves <= 0) {
            endGame(false);
        }
    }

    function endGame(isSuccess) {
        clearInterval(timerInterval);
        disablePuzzleInteraction();

        if (isSuccess) {
            const score = calculateScore(elapsedTime);
            updateScoreboard(playerName, score);
            resultMessage.textContent = `🎉 Success! You solved the puzzle!🥇 Score: ${score}`;
            resultMessage.classList.add("success");
        } else {
            resultMessage.textContent = `❌ No more moves😕, ${playerName}. Game Over!`;
            resultMessage.classList.add("failure");
        }

        resultMessage.classList.remove("hidden");
    }

    function disablePuzzleInteraction() {
        [...puzzleContainer.children].forEach(piece => {
            piece.setAttribute("draggable", false);
        });
    }

    submitBtn.addEventListener("click", () => {
        if (isPuzzleSolved()) {
            endGame(true);
        } else {
            resultMessage.textContent = "❌ The puzzle is not solved!";
            resultMessage.classList.add("failure");
            resultMessage.classList.remove("hidden");
        }
    });

    function isPuzzleSolved() {
        return [...puzzleContainer.children].every(piece => {
            return piece.dataset.currentIndex === piece.dataset.correctIndex;
        });
    }

    // Score Calculation
    function calculateScore(timeTaken) {
        let score = 100;

        if (timeTaken > 20) {
            const timePenalty = Math.floor((timeTaken - 20) / 10);
            score -= timePenalty * 20;
        }

        return Math.max(0, score);
    }

    // Scoreboard
    function updateScoreboard(name, score) {
        scoreboardData.push({ name, score, time: `${elapsedTime}s` });
        scoreboardData.sort((a, b) => b.score - a.score);

        localStorage.setItem("scoreboardData", JSON.stringify(scoreboardData));
        updateScoreboardDisplay();
    }

    function updateScoreboardDisplay() {
        scoreboardList.innerHTML = "";
        scoreboardData.forEach(({ name, score, time }, index) => {
            const li = document.createElement("li");
            li.textContent = `${index + 1}. ${name}: ${score} (Time: ${time})`;
            scoreboardList.appendChild(li);
        });
    }
});
