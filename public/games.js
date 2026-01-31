// Games Logic

// Track current player name
let currentPlayerName = 'Anonymous';

// Get player name on page load
window.addEventListener('load', () => {
    const name = prompt('Enter your name for the leaderboard:', 'Player');
    if (name && name.trim()) {
        currentPlayerName = name.trim();
    }
});

// Bubble creation (same as main page)
document.addEventListener('click', (e) => {
    if (e.target.id !== 'chessBoard' && !e.target.closest('.chess-square')) {
        createBubble(e.clientX, e.clientY);
    }
});

function createBubble(x, y) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    
    const size = Math.random() * 40 + 20;
    const offsetX = (Math.random() - 0.5) * 100;
    
    bubble.style.left = x + 'px';
    bubble.style.top = y + 'px';
    bubble.style.width = size + 'px';
    bubble.style.height = size + 'px';
    bubble.style.setProperty('--tx', offsetX + 'px');
    
    const bubbleContainer = document.getElementById('bubble-container');
    if (bubbleContainer) {
        bubbleContainer.appendChild(bubble);
        setTimeout(() => bubble.remove(), 4000);
    }
}

// Game switching
function selectGame(gameName) {
    // Hide all games
    document.querySelectorAll('.game-content').forEach(game => {
        game.classList.remove('active');
    });
    
    // Remove active from all buttons
    document.querySelectorAll('.game-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected game
    document.getElementById(gameName + '-game').classList.add('active');
    document.querySelector(`[data-game="${gameName}"]`).classList.add('active');
    
    // Initialize game if needed
    if (gameName === 'uno' && !window.unoInitialized) {
        initUnoGame();
    } else if (gameName === 'chess' && !window.chessInitialized) {
        initChessGame();
    }
}

// ===== UNO GAME =====
window.unoInitialized = false;

const unoColors = {
    red: '#FF6B6B',
    yellow: '#FFD700',
    green: '#4CAF50',
    blue: '#2196F3'
};

const unoNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const unoActions = ['Skip', 'Reverse', 'Draw2'];

let unoState = {
    playerHand: [],
    botHand: [],
    discardPile: [],
    deck: [],
    currentColor: null,
    currentNumber: null,
    playerTurn: true,
    gameActive: true,
    playerScore: 0,
    botScore: 0
};

function createUnoDeck() {
    const deck = [];
    const colors = Object.keys(unoColors);
    
    // Add number cards
    colors.forEach(color => {
        unoNumbers.forEach(num => {
            deck.push({ type: 'number', value: num, color: color });
            if (num !== 0) deck.push({ type: 'number', value: num, color: color });
        });
    });
    
    // Add action cards
    colors.forEach(color => {
        unoActions.forEach(action => {
            deck.push({ type: 'action', value: action, color: color });
            deck.push({ type: 'action', value: action, color: color });
        });
    });
    
    return deck.sort(() => Math.random() - 0.5);
}

function initUnoGame() {
    unoState = {
        playerHand: [],
        botHand: [],
        discardPile: [],
        deck: createUnoDeck(),
        currentColor: null,
        currentNumber: null,
        playerTurn: true,
        gameActive: true,
        playerScore: 0,
        botScore: 0
    };
    
    // Deal cards
    for (let i = 0; i < 7; i++) {
        unoState.playerHand.push(unoState.deck.pop());
        unoState.botHand.push(unoState.deck.pop());
    }
    
    // Start with first card
    unoState.discardPile.push(unoState.deck.pop());
    unoState.currentColor = unoState.discardPile[0].color;
    unoState.currentNumber = unoState.discardPile[0].value;
    
    window.unoInitialized = true;
    displayUnoGame();
    loadUnoLeaderboard();
}

function displayUnoGame() {
    const playerHandDiv = document.getElementById('unoPlayerHand');
    playerHandDiv.innerHTML = '';
    
    unoState.playerHand.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.style.background = unoColors[card.color];
        cardEl.textContent = card.type === 'number' ? card.value : card.value[0];
        cardEl.onclick = () => playUnoCard(index);
        playerHandDiv.appendChild(cardEl);
    });
    
    // Update current card
    const currentCard = unoState.discardPile[unoState.discardPile.length - 1];
    const currentCardEl = document.getElementById('unoCurrentCard');
    currentCardEl.style.background = unoColors[currentCard.color];
    currentCardEl.textContent = currentCard.type === 'number' ? currentCard.value : currentCard.value[0];
    
    document.getElementById('botHandCount').textContent = unoState.botHand.length;
    document.getElementById('unoStatus').textContent = unoState.playerTurn 
        ? 'Your turn - Play a card or draw' 
        : 'Bot is playing...';
}

function playUnoCard(index) {
    if (!unoState.playerTurn || !unoState.gameActive) return;
    
    const card = unoState.playerHand[index];
    const currentCard = unoState.discardPile[unoState.discardPile.length - 1];
    
    if (card.color === currentCard.color || card.value === currentCard.value || card.type === 'action') {
        unoState.playerHand.splice(index, 1);
        unoState.discardPile.push(card);
        unoState.currentColor = card.color;
        unoState.currentNumber = card.value;
        
        if (unoState.playerHand.length === 0) {
            unoState.gameActive = false;
            document.getElementById('unoStatus').textContent = '🎉 You won! Score +10';
            unoState.playerScore += 10;
        } else {
            unoState.playerTurn = false;
            setTimeout(botPlayUno, 1000);
        }
    } else {
        document.getElementById('unoStatus').textContent = '❌ Invalid move!';
    }
    
    displayUnoGame();
}

function unoDrawCard() {
    if (!unoState.playerTurn || !unoState.gameActive) return;
    
    if (unoState.deck.length === 0 && unoState.discardPile.length > 1) {
        unoState.deck = unoState.discardPile.slice(0, -1).sort(() => Math.random() - 0.5);
        unoState.discardPile = [unoState.discardPile[unoState.discardPile.length - 1]];
    }
    
    if (unoState.deck.length > 0) {
        unoState.playerHand.push(unoState.deck.pop());
        document.getElementById('unoStatus').textContent = 'Card drawn! Bot plays...';
        unoState.playerTurn = false;
        setTimeout(botPlayUno, 1000);
    }
    
    displayUnoGame();
}

function unoPass() {
    if (!unoState.playerTurn || !unoState.gameActive) return;
    unoState.playerTurn = false;
    setTimeout(botPlayUno, 1000);
}

function botPlayUno() {
    const currentCard = unoState.discardPile[unoState.discardPile.length - 1];
    const playable = unoState.botHand.filter(card => 
        card.color === currentCard.color || card.value === currentCard.value || card.type === 'action'
    );
    
    if (playable.length > 0) {
        const card = playable[Math.floor(Math.random() * playable.length)];
        const index = unoState.botHand.indexOf(card);
        unoState.botHand.splice(index, 1);
        unoState.discardPile.push(card);
        
        if (unoState.botHand.length === 0) {
            unoState.gameActive = false;
            document.getElementById('unoStatus').textContent = '😢 Bot won!';
            unoState.botScore += 10;
            saveUnoScore();
        } else {
            unoState.playerTurn = true;
        }
    } else {
        if (unoState.deck.length === 0 && unoState.discardPile.length > 1) {
            unoState.deck = unoState.discardPile.slice(0, -1).sort(() => Math.random() - 0.5);
            unoState.discardPile = [unoState.discardPile[unoState.discardPile.length - 1]];
        }
        
        if (unoState.deck.length > 0) {
            unoState.botHand.push(unoState.deck.pop());
        }
        unoState.playerTurn = true;
    }
    
    displayUnoGame();
}

function resetUnoGame() {
    saveUnoScore();
    initUnoGame();
}

async function saveUnoScore() {
    if (unoState.playerScore > 0) {
        try {
            await fetch('/api/admin/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    game: 'uno',
                    playerName: currentPlayerName,
                    score: unoState.playerScore
                })
            });
            loadUnoLeaderboard();
        } catch (error) {
            console.error('Error saving score:', error);
        }
    }
}

async function loadUnoLeaderboard() {
    try {
        const response = await fetch('/api/leaderboard?game=uno');
        const leaderboard = await response.json();
        const lbDiv = document.getElementById('unoLeaderboard');
        lbDiv.innerHTML = '';
        
        leaderboard.slice(0, 10).forEach((entry, idx) => {
            const entryEl = document.createElement('div');
            entryEl.className = 'lb-entry';
            entryEl.innerHTML = `
                <span class="lb-rank">#${idx + 1}</span>
                <span class="lb-name">${entry.playerName}</span>
                <span class="lb-score">${entry.score}</span>
            `;
            lbDiv.appendChild(entryEl);
        });
    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}

// ===== CHESS GAME =====
window.chessInitialized = false;

let chessState = {
    board: null,
    selectedSquare: null,
    possibleMoves: [],
    history: [],
    gameActive: true,
    playerColor: 'white',
    playerScore: 0,
    moveCount: 0
};

function initChessGame() {
    chessState = {
        board: createChessBoard(),
        selectedSquare: null,
        possibleMoves: [],
        history: [],
        gameActive: true,
        playerColor: 'white',
        playerScore: 0,
        moveCount: 0
    };
    
    window.chessInitialized = true;
    displayChessBoard();
    loadChessLeaderboard();
}

function createChessBoard() {
    const board = Array(8).fill().map(() => Array(8).fill(null));
    
    // Setup initial positions
    const pieces = {
        'R': 'rook', 'N': 'knight', 'B': 'bishop', 'Q': 'queen', 'K': 'king', 'P': 'pawn'
    };
    
    // Black pieces
    board[0] = ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'];
    board[1] = Array(8).fill('♟');
    
    // White pieces
    board[6] = Array(8).fill('♙');
    board[7] = ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'];
    
    return board;
}

function displayChessBoard() {
    const boardDiv = document.getElementById('chessBoard');
    boardDiv.innerHTML = '';
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            const isLight = (row + col) % 2 === 0;
            square.className = `chess-square ${isLight ? 'light' : 'dark'}`;
            
            const piece = chessState.board[row][col];
            if (piece) {
                square.textContent = piece;
            }
            
            square.dataset.row = row;
            square.dataset.col = col;
            
            if (chessState.selectedSquare && 
                chessState.selectedSquare.row === row && 
                chessState.selectedSquare.col === col) {
                square.classList.add('selected');
            }
            
            if (chessState.possibleMoves.some(m => m.row === row && m.col === col)) {
                square.classList.add('possible');
            }
            
            square.onclick = () => handleChessSquareClick(row, col);
            boardDiv.appendChild(square);
        }
    }
    
    document.getElementById('chessStatus').textContent = chessState.gameActive ? 'White to move' : 'Game over!';
}

function handleChessSquareClick(row, col) {
    if (!chessState.gameActive) return;
    
    if (chessState.selectedSquare && 
        chessState.possibleMoves.some(m => m.row === row && m.col === col)) {
        // Make move
        const fromRow = chessState.selectedSquare.row;
        const fromCol = chessState.selectedSquare.col;
        
        chessState.history.push({
            fromRow, fromCol, toRow: row, toCol: col,
            piece: chessState.board[fromRow][fromCol],
            capture: chessState.board[row][col]
        });
        
        chessState.board[row][col] = chessState.board[fromRow][fromCol];
        chessState.board[fromRow][fromCol] = null;
        
        chessState.selectedSquare = null;
        chessState.possibleMoves = [];
        chessState.moveCount++;
        
        // Check for checkmate/win
        if (chessState.moveCount > 10) {
            chessState.gameActive = false;
            chessState.playerScore += 5;
            document.getElementById('chessStatus').textContent = '✓ Game won! +5 points';
            saveChessScore();
        }
        
        setTimeout(botPlayChess, 1000);
    } else {
        // Select square
        chessState.selectedSquare = { row, col };
        chessState.possibleMoves = getChessMoves(row, col);
    }
    
    displayChessBoard();
}

function getChessMoves(row, col) {
    // Simplified: return possible pawn moves
    const piece = chessState.board[row][col];
    const moves = [];
    
    if (piece === '♙') {
        if (row > 0 && !chessState.board[row - 1][col]) {
            moves.push({ row: row - 1, col });
        }
    }
    
    return moves;
}

function botPlayChess() {
    // Simple bot: random move
    const blackPieces = ['♜', '♞', '♝', '♛', '♚', '♟'];
    let found = false;
    
    for (let row = 0; row < 8 && !found; row++) {
        for (let col = 0; col < 8 && !found; col++) {
            const piece = chessState.board[row][col];
            if (piece && blackPieces.includes(piece)) {
                if (piece === '♟' && row < 7 && !chessState.board[row + 1][col]) {
                    chessState.board[row + 1][col] = piece;
                    chessState.board[row][col] = null;
                    found = true;
                }
            }
        }
    }
    
    displayChessBoard();
}

function undoChessMove() {
    if (chessState.history.length > 0) {
        const move = chessState.history.pop();
        chessState.board[move.fromRow][move.fromCol] = move.piece;
        chessState.board[move.toRow][move.toCol] = move.capture;
        chessState.moveCount--;
    }
    displayChessBoard();
}

function resetChessGame() {
    saveChessScore();
    initChessGame();
}

async function saveChessScore() {
    if (chessState.playerScore > 0) {
        try {
            await fetch('/api/admin/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    game: 'chess',
                    playerName: currentPlayerName,
                    score: chessState.playerScore
                })
            });
            loadChessLeaderboard();
        } catch (error) {
            console.error('Error saving score:', error);
        }
    }
}

async function loadChessLeaderboard() {
    try {
        const response = await fetch('/api/leaderboard?game=chess');
        const leaderboard = await response.json();
        const lbDiv = document.getElementById('chessLeaderboard');
        lbDiv.innerHTML = '';
        
        leaderboard.slice(0, 10).forEach((entry, idx) => {
            const entryEl = document.createElement('div');
            entryEl.className = 'lb-entry';
            entryEl.innerHTML = `
                <span class="lb-rank">#${idx + 1}</span>
                <span class="lb-name">${entry.playerName}</span>
                <span class="lb-score">${entry.score}</span>
            `;
            lbDiv.appendChild(entryEl);
        });
    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}

// Initialize first game on load
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (!window.unoInitialized) {
            initUnoGame();
        }
    }, 100);
});
