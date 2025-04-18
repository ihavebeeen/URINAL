let gameMode = '';
let currentPlayer = 1;
let urinalCount = 7;
let gameBoard = [];
let cleaningUrinals = [];
let cleaningTimeRemaining = {};
let challengeRound = 1;
let player1Score = 0;

function initGame(mode) {
    gameMode = mode;
    currentPlayer = 1;
    gameBoard = [];
    cleaningUrinals = [];
    cleaningTimeRemaining = {};

    if (mode !== 'challenge' || challengeRound === 1) {
        player1Score = 0;
    }

    if (mode === 'challenge') {
        urinalCount = 7 + (challengeRound - 1) * 2;
        document.querySelector('.challenge-info').style.display = 'block';
        document.getElementById('currentRound').textContent = challengeRound;
        document.getElementById('currentUrinals').textContent = urinalCount;
    } else {
        document.querySelector('.challenge-info').style.display = 'none';
        const urinalSelect = document.getElementById('urinalCount');
        urinalCount = parseInt(urinalSelect.value);
    }

    for (let i = 0; i < urinalCount; i++) {
        gameBoard[i] = 0;
    }

    document.getElementById('gameBoard').style.display = 'block';
    document.getElementById('modeSelect').style.display = 'none';
    document.getElementById('gameOverModal').style.display = 'none';
    
    updateBoard();
    updateStatus();
    updateScoreDisplay();
    
    if (Math.random() < 0.03) {
        startCleaningTime();
    }
}

function startCleaningTime() {
    const numUrinalsToClean = Math.floor(Math.random() * 2) + 1; // 1-2개의 소변기 청소
    const duration = Math.floor(Math.random() * 3) + 2; // 2-4턴 동안 청소

    for (let i = 0; i < numUrinalsToClean; i++) {
        let urinalIndex;
        do {
            urinalIndex = Math.floor(Math.random() * urinalCount);
        } while (gameBoard[urinalIndex] !== 0 || cleaningUrinals.includes(urinalIndex));

        cleaningUrinals.push(urinalIndex);
        cleaningTimeRemaining[urinalIndex] = duration;
    }

    document.querySelector('.cleaning-info').style.display = 'block';
    updateCleaningInfo();
    updateBoard(); // 청소 상태 즉시 반영
}

function updateCleaningInfo() {
    const cleaningInfo = cleaningUrinals.map(i => {
        return `#${i + 1} (${cleaningTimeRemaining[i]}턴 남음)`;
    }).join(', ');
    document.getElementById('cleaningUrinals').textContent = cleaningInfo;
}

function updateCleaningTime() {
    const finishedCleaning = [];
    
    for (let urinal of cleaningUrinals) {
        cleaningTimeRemaining[urinal]--;
        if (cleaningTimeRemaining[urinal] === 0) {
            finishedCleaning.push(urinal);
            delete cleaningTimeRemaining[urinal];
        }
    }

    cleaningUrinals = cleaningUrinals.filter(u => !finishedCleaning.includes(u));

    if (cleaningUrinals.length === 0) {
        document.querySelector('.cleaning-info').style.display = 'none';
        if (Math.random() < 0.02) {
            startCleaningTime();
        }
    } else {
        updateCleaningInfo();
    }
}

function makeMove(index) {
    if (gameBoard[index] !== 0 || cleaningUrinals.includes(index)) return false;
    
    if (!isValidMove(index)) {
        alert('옆자리에는 앉을 수 없습니다!');
        return false;
    }
    
    // 점수 계산 (플레이어 1만)
    if (currentPlayer === 1) {
        let scoreEarned = 1; 
        scoreEarned += calculateConsecutiveBonus(1, index);
        scoreEarned += calculateDistanceBonus(1, index);
        player1Score += scoreEarned;
    }
    
    gameBoard[index] = currentPlayer;
    updateBoard();
    updateScoreDisplay();
    
    if (checkGameOver()) {
        showGameOver();
    } else {
        if (gameMode === 'multiplayer' || gameMode === 'challenge') {
            currentPlayer = currentPlayer === 1 ? 2 : 1;
        } else { 
            currentPlayer = 1;
        }
        
        updateStatus();
        updateCleaningTime();
        
        if (gameMode === 'single' || ((gameMode === 'multiplayer' || gameMode === 'challenge') && currentPlayer === 2)) {
            setTimeout(computerMove, 1000);
        }
    }
    
    return true;
}

function isValidMove(index) {
    return isValidMoveForBoard(gameBoard, index, currentPlayer);
}

function isValidMoveForBoard(board, index, player) {
    if (index > 0 && board[index - 1] !== 0 && board[index - 1] !== player) return false;
    if (index < board.length - 1 && board[index + 1] !== 0 && board[index + 1] !== player) return false;
    return true;
}

function computerMove() {
    const boardCopy = [...gameBoard]; // 현재 게임 보드 복사
    const bestMoveInfo = findBestMove(boardCopy);
    
    if (bestMoveInfo && bestMoveInfo.move !== undefined) {
         // Epsilon-Greedy: 낮은 확률(epsilon)로 무작위 수 선택
        const legalMoves = getLegalMoves(boardCopy, 2);
        const epsilon = 0.05; // 5% 확률
        if (Math.random() < epsilon && legalMoves.length > 0) {
             const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
             console.log(`AI Move (Random Epsilon): ${randomMove + 1}`);
             makeMove(randomMove);
        } else {
            console.log(`AI Move (Minimax): ${bestMoveInfo.move + 1}, Score: ${bestMoveInfo.score}`);
            makeMove(bestMoveInfo.move);
        }
    } else {
        // 둘 곳이 없는 경우 (이론상 checkGameOver에서 처리되지만 안전장치)
        console.log("AI has no valid moves.");
        showGameOver(); 
    }
}

function findBestMove(board) {
    let bestScore = -Infinity;
    let bestMove = null;
    const legalMoves = getLegalMoves(board, 2);

    if (legalMoves.length === 0) return null; // 둘 수 있는 곳이 없음

    // 첫 수로 둘 수 있는 모든 수를 평가
    for (const move of legalMoves) {
        const newBoard = playMove(board, move, 2);
        // 다음은 플레이어 턴(Minimizing)이므로 isMaximizing = false
        const score = minimax(newBoard, 2, -Infinity, Infinity, false); 
        
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    
    // 최선의 수가 없는 극단적인 경우 (예: 첫 수가 바로 패배로 이어짐)
    if (bestMove === null && legalMoves.length > 0) {
        bestMove = legalMoves[0]; // 그냥 첫 번째 가능한 수 선택
    }

    return { move: bestMove, score: bestScore };
}

function minimax(board, depth, alpha, beta, isMaximizingPlayer) {
    const nextPlayer = isMaximizingPlayer ? 2 : 1;
    const terminalState = checkTerminalState(board, nextPlayer);

    if (depth === 0 || terminalState !== 0) {
        return evaluateState(board, terminalState); // 상태 평가
    }

    const legalMoves = getLegalMoves(board, nextPlayer);
    let bestValue = isMaximizingPlayer ? -Infinity : Infinity;

    for (const move of legalMoves) {
        const newBoard = playMove(board, move, nextPlayer);
        const value = minimax(newBoard, depth - 1, alpha, beta, !isMaximizingPlayer);

        if (isMaximizingPlayer) {
            bestValue = Math.max(bestValue, value);
            alpha = Math.max(alpha, bestValue);
        } else {
            bestValue = Math.min(bestValue, value);
            beta = Math.min(beta, bestValue);
        }

        if (beta <= alpha) {
            break; // Alpha-Beta Pruning
        }
    }
    return bestValue;
}

function evaluateState(board, terminalState) {
    // 1. 게임 종료 상태 평가
    if (terminalState === 2) return 10000; // AI 승리 (매우 높은 점수)
    if (terminalState === 1) return -10000; // 플레이어 승리 (매우 낮은 점수)
    
    // 2. 현재 점수 기반 평가 (AI 점수 - 플레이어 점수)
    let score = calculateScoreForBoard(board, 2) - calculateScoreForBoard(board, 1);

    // 3. 추가 휴리스틱
    const n = board.length;
    if (n > 3) { // 최소 4칸 이상일 때 의미 있음
        // 3.1. 끝자리 전(Penultimate) 선호 (더 높은 보너스)
        if (board[1] === 2) score += 25; // 보너스 증가 (15 -> 25)
        if (board[n - 2] === 2) score += 25; // 보너스 증가 (15 -> 25)
        if (board[1] === 1) score -= 25; // 상대 페널티 증가
        if (board[n - 2] === 1) score -= 25; // 상대 페널티 증가
        
        // 3.2. 끝자리(Edge) 회피 (약간의 페널티)
        if (board[0] === 2) score -= 10;
        if (board[n - 1] === 2) score -= 10;
        // 플레이어가 끝자리를 차지하는 것은 막는게 좋으므로 페널티는 없음
    }

    // 3.3. 중앙 제어 선호 (유지)
    const centerIndex = Math.floor(n / 2);
    if (board[centerIndex] === 2) score += 5;
    if (board[centerIndex] === 1) score -= 5;
    
    // 3.4. 기본적인 차단 (유지)
    let blockScore = 0;
    for(let i = 0; i < n; i++) {
        if (board[i] === 2) {
             if (i > 1 && board[i - 2] === 1) blockScore += 5;
             if (i < n - 2 && board[i + 2] === 1) blockScore += 5;
        } else if (board[i] === 1) {
             if (i > 1 && board[i - 2] === 2) blockScore -= 5;
             if (i < n - 2 && board[i + 2] === 2) blockScore -= 5;
        }
    }
    score += blockScore;

    return score;
}

function calculateScoreForBoard(board, player) {
    let totalScore = 0;
    for (let i = 0; i < board.length; i++) {
        if (board[i] === player) {
            totalScore += 1; // 기본 점수
            totalScore += calculateConsecutiveBonusForBoard(board, player, i);
            totalScore += calculateDistanceBonusForBoard(board, player, i);
        }
    }
    return totalScore;
}

function calculateConsecutiveBonusForBoard(board, player, index) {
    let bonus = 0;
    let consecutiveCount = 1;
    let tempIndex = index;
    while (--tempIndex >= 0 && board[tempIndex] === player) consecutiveCount++;
    tempIndex = index;
    while (++tempIndex < board.length && board[tempIndex] === player) consecutiveCount++;
    if (consecutiveCount >= 3) bonus = (consecutiveCount - 2) * 2;
    return bonus;
}

function calculateDistanceBonusForBoard(board, player, index) {
    let bonus = 0;
    let minDistance = board.length;
    const opponent = player === 1 ? 2 : 1;
    for (let i = 0; i < board.length; i++) {
        if (board[i] === opponent) {
            const distance = Math.abs(index - i);
            if (distance < minDistance) minDistance = distance;
        }
    }
    if (minDistance === board.length) return 0;
    if (minDistance > 1) bonus = Math.floor((minDistance - 1) * 0.5);
    return bonus;
}

function getLegalMoves(board, player) {
    const moves = [];
    for (let i = 0; i < board.length; i++) {
        if (board[i] === 0 && !cleaningUrinals.includes(i) && isValidMoveForBoard(board, i, player)) {
            moves.push(i);
        }
    }
    return moves;
}

function playMove(board, move, player) {
    const newBoard = [...board];
    newBoard[move] = player;
    return newBoard;
}

function checkTerminalState(board, nextPlayer) {
    const legalMoves = getLegalMoves(board, nextPlayer);
    if (legalMoves.length === 0) {
        return nextPlayer === 1 ? 2 : 1; // 다음 플레이어가 둘 곳 없으면 상대방 승리
    }
    return 0; // 게임 진행 중
}

function updateBoard() {
    const board = document.querySelector('.urinals');
    board.innerHTML = '';
    
    for (let i = 0; i < urinalCount; i++) {
        const urinal = document.createElement('div');
        urinal.className = 'urinal';
        urinal.dataset.index = i; // 데이터 속성으로 인덱스 저장

        const urinalNumber = document.createElement('span');
        urinalNumber.className = 'urinal-number';
        urinalNumber.textContent = (i + 1).toString();
        urinal.appendChild(urinalNumber);
        
        if (gameBoard[i] === 1) {
            urinal.classList.add('occupied-player');
            urinal.title = '플레이어가 사용 중';
        } else if (gameBoard[i] === 2) {
            urinal.classList.add('occupied-ai');
            urinal.title = 'AI가 사용 중';
        } else if (cleaningUrinals.includes(i)) {
            urinal.classList.add('cleaning');
            urinal.title = `청소 중 (${cleaningTimeRemaining[i]}턴 후 사용 가능)`;
        } else {
            urinal.onclick = () => makeMove(i);
            urinal.title = '클릭하여 선택';
        }
        
        // urinal.textContent = (i + 1).toString(); // span으로 대체
        board.appendChild(urinal);
    }
}

function updateStatus() {
    const status = document.querySelector('.status');
    if (gameMode === 'multiplayer') {
        status.textContent = `플레이어 ${currentPlayer}의 차례입니다`;
    } else if (gameMode === 'challenge') {
        status.textContent = currentPlayer === 1 ? 
            `라운드 ${challengeRound}: 당신의 차례입니다` : 
            '컴퓨터가 생각중...';
    } else {
        status.textContent = currentPlayer === 1 ? '당신의 차례입니다' : '컴퓨터가 생각중...';
    }
}

function checkGameOver() {
    // 현재 플레이어가 둘 수 있는 유효한 수가 있는지 확인
    for (let i = 0; i < urinalCount; i++) {
        if (gameBoard[i] === 0 && !cleaningUrinals.includes(i)) {
            // 현재 플레이어가 해당 위치에 둘 수 있는지 확인
            let canPlace = true;
            if (i > 0 && gameBoard[i - 1] !== 0 && gameBoard[i - 1] !== currentPlayer) canPlace = false;
            if (i < urinalCount - 1 && gameBoard[i + 1] !== 0 && gameBoard[i + 1] !== currentPlayer) canPlace = false;
            
            if (canPlace) return false; // 둘 수 있는 위치가 하나라도 있으면 게임 계속
        }
    }
    return true; // 둘 수 있는 위치가 없으면 게임 종료
}

function showGameOver() {
    const modal = document.getElementById('gameOverModal');
    const outcomeText = document.getElementById('finalOutcome');
    const nextRoundBtn = document.getElementById('nextRoundBtnModal');
    const playAgainBtn = document.getElementById('playAgainBtnModal');

    document.getElementById('finalPlayer1Score').textContent = player1Score;
    modal.style.display = 'flex';
    nextRoundBtn.style.display = 'none'; 
    playAgainBtn.style.display = 'inline-block'; // 기본적으로 다시하기 표시

    if (gameMode === 'challenge') {
        if (currentPlayer === 1) { // 플레이어가 둘 곳이 없음 (AI 승)
            outcomeText.textContent = '컴퓨터가 이겼습니다. 라운드 실패!';
            challengeRound = 1; 
        } else { // AI가 둘 곳이 없음 (플레이어 승)
            const maxRound = 47;
            if (challengeRound < maxRound) {
                outcomeText.textContent = `라운드 ${challengeRound} 클리어! 다음 라운드로 진행합니다.`;
                nextRoundBtn.style.display = 'inline-block';
                playAgainBtn.style.display = 'none'; 
            } else {
                outcomeText.textContent = '축하합니다! 모든 라운드를 클리어했습니다!';
                challengeRound = 1; 
            }
        }
    } else if (gameMode === 'multiplayer') {
        outcomeText.textContent = `플레이어 ${currentPlayer === 1 ? 2 : 1} 승리!`;
    } else { // 싱글 모드
        outcomeText.textContent = currentPlayer === 1 ? '컴퓨터 승리!' : '당신의 승리!';
    }
}

function nextRound() {
    challengeRound++; // 라운드 증가
    document.getElementById('gameOverModal').style.display = 'none';
    initGame('challenge'); // 증가된 라운드로 게임 재시작
}

function resetGame() {
    document.getElementById('gameBoard').style.display = 'none';
    document.getElementById('modeSelect').style.display = 'block';
    document.getElementById('gameOverModal').style.display = 'none';
    document.querySelector('.cleaning-info').style.display = 'none';
    challengeRound = 1;
    player1Score = 0;
}

function calculateConsecutiveBonus(player, index) {
    let bonus = 0;
    let consecutiveCount = 1;
    let tempIndex = index;
    
    // 왼쪽 확인
    while (--tempIndex >= 0 && gameBoard[tempIndex] === player) {
        consecutiveCount++;
    }
    
    tempIndex = index;
    // 오른쪽 확인
    while (++tempIndex < urinalCount && gameBoard[tempIndex] === player) {
        consecutiveCount++;
    }
    
    // 3칸 이상 연속되면 보너스 계산
    if (consecutiveCount >= 3) {
        bonus = (consecutiveCount - 2) * 2; // 연속된 칸 수에 비례하여 보너스 증가 (3칸=2점, 4칸=4점...)
    }
    
    return bonus;
}

function calculateDistanceBonus(player, index) {
    let bonus = 0;
    let minDistance = urinalCount; // 최대 거리로 초기화
    const opponent = player === 1 ? 2 : 1;
    
    for (let i = 0; i < urinalCount; i++) {
        if (gameBoard[i] === opponent) {
            const distance = Math.abs(index - i);
            if (distance < minDistance) {
                minDistance = distance;
            }
        }
    }
    
    // 상대방이 없으면 보너스 없음 (또는 최대 보너스? 여기서는 0으로 처리)
    if (minDistance === urinalCount) return 0; 
    
    // 거리가 멀수록 보너스 증가 (최소 2칸 떨어져야 점수)
    if (minDistance > 1) {
        bonus = Math.floor((minDistance - 1) * 0.5); // 거리에 비례하여 보너스 (소수점 버림)
    }
    
    return bonus;
}

function updateScoreDisplay() {
    document.getElementById('player1Score').textContent = player1Score;
} 