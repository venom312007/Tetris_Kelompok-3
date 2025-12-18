document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('grid');
    const scoreDisplay = document.getElementById('score');
    const startButton = document.getElementById('start-button');
    const gameOverMessage = document.getElementById('game-over-message');

    const width = 10;
    const height = 20;
    let squares = [];
    let currentTetromino = null;
    let currentPosition = 4;
    let rotation = 0;
    let score = 0;
    let timerId = null;
    let isGameOver = false;
    let isPaused = true;

    // --- PENGATURAN AUDIO ---
    const bgm = new Audio('music-for-puzzle-game-146738.mp3'); 
    bgm.loop = true;      // Lagu berulang terus
    bgm.volume = 0.5;     // Volume 40%

    const clearSound = new Audio('clear.mp3');
    const gameOverSound = new Audio('game-over-38511.mp3');

    // --- MEMBUAT GRID ---
    function createGrid() {
        for (let i = 0; i < width * height; i++) {
            const square = document.createElement('div');
            square.classList.add('grid-cell');
            grid.appendChild(square);
            squares.push(square);
        }
    }
    createGrid();

    // --- DEFINISI TETROMINO ---
    const lTetromino = [[1, width + 1, width * 2 + 1, 2], [width, width + 1, width + 2, width * 2 + 2], [1, width + 1, width * 2 + 1, width * 2], [width, width * 2, width * 2 + 1, width * 2 + 2]];
    const jTetromino = [[1, width + 1, width * 2 + 1, 0], [width, width + 1, width + 2, 2], [1, width + 1, width * 2 + 1, width * 2 + 2], [width, width + 1, width + 2, width * 2]];
    const iTetromino = [[1, width + 1, width * 2 + 1, width * 3 + 1], [width, width + 1, width + 2, width + 3], [1, width + 1, width * 2 + 1, width * 3 + 1], [width, width + 1, width + 2, width + 3]];
    const oTetromino = [[0, 1, width, width + 1], [0, 1, width, width + 1], [0, 1, width, width + 1], [0, 1, width, width + 1]];
    const sTetromino = [[width + 1, width + 2, width * 2, width * 2 + 1], [0, width, width + 1, width * 2 + 1], [width + 1, width + 2, width * 2, width * 2 + 1], [0, width, width + 1, width * 2 + 1]];
    const zTetromino = [[width, width + 1, width * 2 + 1, width * 2 + 2], [1, width + 1, width, width * 2], [width, width + 1, width * 2 + 1, width * 2 + 2], [1, width + 1, width, width * 2]];
    const tTetromino = [[1, width, width + 1, width + 2], [1, width + 1, width + 2, width * 2 + 1], [width, width + 1, width + 2, width * 2 + 1], [1, width, width + 1, width * 2 + 1]];

    const allTetrominos = [lTetromino, jTetromino, iTetromino, oTetromino, sTetromino, zTetromino, tTetromino];
    const tetrominoClasses = ['tetromino-L', 'tetromino-J', 'tetromino-I', 'tetromino-O', 'tetromino-S', 'tetromino-Z', 'tetromino-T'];

    function getRandomTetromino() {
        const randomIndex = Math.floor(Math.random() * allTetrominos.length);
        return { shape: allTetrominos[randomIndex], className: tetrominoClasses[randomIndex] };
    }

    // --- LOGIKA PERMAINAN ---
    function draw() {
        currentTetromino.shape[rotation].forEach(index => {
            squares[currentPosition + index].classList.add('block', currentTetromino.className);
        });
    }

    function undraw() {
        currentTetromino.shape[rotation].forEach(index => {
            squares[currentPosition + index].classList.remove('block', currentTetromino.className);
        });
    }

    function isValidMove(newPos, newRot) {
        return currentTetromino.shape[newRot].every(index => {
            const targetIndex = newPos + index;
            const x = targetIndex % width;
            return (
                targetIndex >= 0 && targetIndex < width * height && 
                x >= 0 && x < width && 
                !squares[targetIndex].classList.contains('taken')
            );
        });
    }

    function moveDown() {
        if (isPaused || isGameOver) return;
        undraw();
        if (isValidMove(currentPosition + width, rotation)) {
            currentPosition += width;
            draw();
        } else {
            draw();
            freeze();
        }
    }

    function moveLeft() {
        undraw();
        if (isValidMove(currentPosition - 1, rotation)) currentPosition -= 1;
        draw();
    }

    function moveRight() {
        undraw();
        if (isValidMove(currentPosition + 1, rotation)) currentPosition += 1;
        draw();
    }

    function rotate() {
        undraw();
        const nextRotation = (rotation + 1) % currentTetromino.shape.length;
        if (isValidMove(currentPosition, nextRotation)) rotation = nextRotation;
        draw();
    }

    function freeze() {
        currentTetromino.shape[rotation].forEach(index => {
            squares[currentPosition + index].classList.add('taken');
        });
        addScore();
        generateTetromino();
    }

    function generateTetromino() {
        currentTetromino = getRandomTetromino();
        currentPosition = 4;
        rotation = 0;
        if (!isValidMove(currentPosition, rotation)) {
            gameOver();
        } else {
            draw();
        }
    }

    function addScore() {
        for (let i = 0; i < width * height; i += width) {
            const row = Array.from({ length: width }, (_, k) => i + k);
            if (row.every(index => squares[index].classList.contains('taken'))) {
                score += 100;
                scoreDisplay.innerHTML = score;
                
                // MAINkan SUARA CLEAR
                clearSound.play();

                row.forEach(index => {
                    squares[index].className = 'grid-cell'; 
                });
                const removedSquares = squares.splice(i, width);
                squares = removedSquares.concat(squares);
                squares.forEach(cell => grid.appendChild(cell));
            }
        }
    }

    function gameOver() {
        isGameOver = true;
        clearInterval(timerId);
        
        // STOP BGM DAN MAINkan SUARA KALAH
        bgm.pause();
        bgm.currentTime = 0;
        gameOverSound.play();

        gameOverMessage.classList.remove('hidden');
        startButton.textContent = 'Restart';
    }

    // --- KONTROL & EVENT ---
    function control(e) {
        if (isGameOver || isPaused) return;
        if (e.key === 'ArrowLeft') moveLeft();
        else if (e.key === 'ArrowRight') moveRight();
        else if (e.key === 'ArrowUp') rotate();
        else if (e.key === 'ArrowDown') moveDown();
    }

    startButton.addEventListener('click', () => {
        if (isGameOver) {
            location.reload();
        } else if (timerId) {
            // PAUSE GAME & MUSIK
            clearInterval(timerId);
            timerId = null;
            isPaused = true;
            bgm.pause();
            startButton.textContent = 'Resume';
        } else {
            // START GAME & MUSIK
            isPaused = false;
            bgm.play().catch(e => console.log("Musik tertunda sampai interaksi user")); 
            if (!currentTetromino) generateTetromino();
            timerId = setInterval(moveDown, 1000);
            startButton.textContent = 'Pause';
            document.addEventListener('keydown', control);
        }
    });

});
