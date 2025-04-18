class UrinalGame {
    constructor() {
        this.gameMode = null; // 'single', 'multi', 'score'
        this.urinalCount = 0;
        this.currentPlayer = 1;
        this.gameBoard = [];
        this.isGameOver = false;

        // 점수 게임 관련 변수
        this.scores = [0, 0];
        this.remainingTurns = 20;
        this.occupiedTurns = new Array(7).fill(0); // 각 소변기별 남은 턴 수
        this.occupiedBy = new Array(7).fill(0); // 각 소변기를 점유한 플레이어

        // DOM 요소들
        this.singlePlayerBtn = document.getElementById('singlePlayerBtn');
        this.multiPlayerBtn = document.getElementById('multiPlayerBtn');
        this.scoreGameBtn = document.getElementById('scoreGameBtn');
        this.gameSettings = document.querySelector('.game-settings');
        this.gameModeSelection = document.querySelector('.game-mode-selection');
        this.gameBoard = document.querySelector('.game-board');
        this.scoreGameBoard = document.querySelector('.score-game-board');
        this.urinalsContainer = document.getElementById('urinals');
        this.startGameBtn = document.getElementById('startGameBtn');
        this.urinalCountSelect = document.getElementById('urinalCount');
        this.currentPlayerSpan = document.getElementById('currentPlayer');
        this.gameOverDiv = document.querySelector('.game-over');
        this.winnerP = document.getElementById('winner');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        
        // 점수 게임 관련 DOM 요소들
        this.player1ScoreSpan = document.getElementById('player1Score');
        this.player2ScoreSpan = document.getElementById('player2Score');
        this.remainingTurnsSpan = document.getElementById('remainingTurns');
        this.lastMoveInfo = document.getElementById('lastMoveInfo');
        this.bonusInfo = document.getElementById('bonusInfo');
        this.finalScoresDiv = document.getElementById('finalScores');
        this.finalScore1Span = document.getElementById('finalScore1');
        this.finalScore2Span = document.getElementById('finalScore2');

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.singlePlayerBtn.addEventListener('click', () => this.selectGameMode('single'));
        this.multiPlayerBtn.addEventListener('click', () => this.selectGameMode('multi'));
        this.scoreGameBtn.addEventListener('click', () => this.selectGameMode('score'));
        this.startGameBtn.addEventListener('click', () => this.startGame());
        this.playAgainBtn.addEventListener('click', () => this.resetGame());
    }

    selectGameMode(mode) {
        this.gameMode = mode;
        this.gameModeSelection.style.display = 'none';
        
        if (mode === 'score') {
            this.urinalCount = 7; // 점수 게임은 항상 7개
            this.startGame();
        } else {
            this.gameSettings.style.display = 'block';
        }
    }

    startGame() {
        if (this.gameMode === 'score') {
            this.scoreGameBoard.style.display = 'block';
            this.urinalCount = 7;
            this.remainingTurns = 20;
            this.scores = [0, 0];
            this.occupiedTurns = new Array(7).fill(0);
            this.occupiedBy = new Array(7).fill(0);
            this.updateScoreDisplay();
        } else {
            this.gameBoard.style.display = 'block';
            this.urinalCount = parseInt(this.urinalCountSelect.value);
        }

        this.gameSettings.style.display = 'none';
        this.currentPlayer = 1;
        this.isGameOver = false;
        this.positions = new Array(this.urinalCount).fill(0);
        this.renderUrinals();
        this.updatePlayerDisplay();
    }

    updateScoreDisplay() {
        if (this.gameMode === 'score') {
            this.player1ScoreSpan.textContent = this.scores[0].toFixed(1);
            this.player2ScoreSpan.textContent = this.scores[1].toFixed(1);
            this.remainingTurnsSpan.textContent = this.remainingTurns;
        }
    }

    updatePlayerDisplay() {
        if (this.gameMode === 'score') {
            this.currentPlayerSpan.textContent = `플레이어 ${this.currentPlayer}`;
        } else if (this.gameMode === 'single') {
            this.currentPlayerSpan.textContent = this.currentPlayer === 1 ? '플레이어 차례' : 'AI 차례';
        } else {
            this.currentPlayerSpan.textContent = `플레이어 ${this.currentPlayer} 차례`;
        }
    }

    renderUrinals() {
        this.urinalsContainer.innerHTML = '';
        this.positions.forEach((position, index) => {
            const urinal = document.createElement('div');
            urinal.className = 'urinal';
            if (position === 1) urinal.classList.add('occupied-p1');
            if (position === 2) urinal.classList.add('occupied-p2');
            
            // 점수 게임에서 남은 턴 표시
            if (this.gameMode === 'score' && this.occupiedTurns[index] > 0) {
                const turnsLeft = document.createElement('div');
                turnsLeft.className = 'turns-left';
                turnsLeft.textContent = this.occupiedTurns[index];
                urinal.appendChild(turnsLeft);
            }
            
            urinal.addEventListener('click', () => this.makeMove(index));
            this.urinalsContainer.appendChild(urinal);
        });
        this.updatePlayerDisplay();
    }

    isValidMove(position) {
        if (this.positions[position] !== 0) return false;
        
        if (this.gameMode === 'score') {
            return true; // 점수 게임에서는 모든 위치에 둘 수 있음
        }
        
        // 인접한 위치 확인 - 다른 플레이어의 소변기만 체크
        if (position > 0 && 
            this.positions[position - 1] !== 0 && 
            this.positions[position - 1] !== this.currentPlayer) return false;
            
        if (position < this.positions.length - 1 && 
            this.positions[position + 1] !== 0 && 
            this.positions[position + 1] !== this.currentPlayer) return false;
        
        return true;
    }

    calculateScoreForMove(position) {
        let score = 1.0; // 기본 점수
        let message = '기본 점수: +1.0<br>';
        
        // 옆자리 패널티 체크
        let hasPenalty = false;
        if (position > 0 && this.occupiedTurns[position - 1] > 0) hasPenalty = true;
        if (position < 6 && this.occupiedTurns[position + 1] > 0) hasPenalty = true;
        
        if (hasPenalty) {
            score -= 5.0;
            message += '옆자리 패널티: -5.0<br>';
            return { score, message };
        }

        // 멀리 떨어진 자리 보너스
        let minDistance = 7;
        for (let i = 0; i < 7; i++) {
            if (this.occupiedBy[i] === (3 - this.currentPlayer) && this.occupiedTurns[i] > 0) {
                minDistance = Math.min(minDistance, Math.abs(position - i));
            }
        }
        if (minDistance < 7) {
            const distanceBonus = minDistance * 0.2;
            score += distanceBonus;
            message += `거리 보너스 (${minDistance}칸): +${distanceBonus.toFixed(1)}<br>`;
        }

        // 연속 점유 보너스
        let consecutiveCount = 1;
        let maxConsecutive = 1;
        for (let i = 0; i < 7; i++) {
            if (this.occupiedBy[i] === this.currentPlayer && this.occupiedTurns[i] > 0) {
                consecutiveCount++;
                maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
            } else {
                consecutiveCount = 0;
            }
        }
        if (maxConsecutive >= 3) {
            const consecutiveBonus = (maxConsecutive - 2) * 0.5;
            score += consecutiveBonus;
            message += `연속 점유 보너스 (${maxConsecutive}칸): +${consecutiveBonus.toFixed(1)}<br>`;
        }

        return { score, message };
    }

    makeMove(position) {
        if (this.isGameOver) return;
        
        if (this.gameMode === 'score') {
            // 점수 게임 로직
            const { score, message } = this.calculateScoreForMove(position);
            
            // 점수 적용 및 표시
            this.scores[this.currentPlayer - 1] += score;
            this.positions[position] = this.currentPlayer;
            this.occupiedTurns[position] = 3;
            this.occupiedBy[position] = this.currentPlayer;
            
            // 정보 표시
            this.lastMoveInfo.innerHTML = message;
            
            // 빈 칸 보너스 계산
            let emptySpaces = this.positions.filter(p => p === 0).length;
            let spaceBonus = emptySpaces * 0.1;
            this.scores[this.currentPlayer - 1] += spaceBonus;
            this.bonusInfo.innerHTML = `빈 칸 보너스 (${emptySpaces}칸): +${spaceBonus.toFixed(1)}`;
            
            // 턴 감소
            this.remainingTurns--;
            
            // 모든 소변기의 턴 수 감소
            for (let i = 0; i < 7; i++) {
                if (this.occupiedTurns[i] > 0) {
                    this.occupiedTurns[i]--;
                    if (this.occupiedTurns[i] === 0) {
                        this.positions[i] = 0;
                        this.occupiedBy[i] = 0;
                    }
                }
            }
            
            this.renderUrinals();
            this.updateScoreDisplay();
            
            // 게임 종료 조건 체크
            if (this.remainingTurns === 0 || Math.abs(this.scores[0] - this.scores[1]) >= 10) {
                this.endGame();
                return;
            }
            
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
            this.updatePlayerDisplay();
            return;
        }
        
        // 기존 게임 로직
        if (!this.isValidMove(position)) return;

        this.positions[position] = this.currentPlayer;
        this.renderUrinals();

        if (this.checkGameOver()) {
            this.endGame();
            return;
        }

        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updatePlayerDisplay();
        
        if (this.gameMode === 'single' && this.currentPlayer === 2) {
            setTimeout(() => this.makeAIMove(), 500);
        }
    }

    evaluatePosition() {
        // 각 위치의 점수를 계산
        const scores = new Array(this.urinalCount).fill(0);
        
        for (let i = 0; i < this.urinalCount; i++) {
            if (!this.isValidMove(i)) {
                scores[i] = -1;
                continue;
            }

            // 기본 점수
            scores[i] = 1;

            // 중앙에 가까울수록 높은 점수
            const distanceFromCenter = Math.abs(i - Math.floor(this.urinalCount / 2));
            scores[i] += (this.urinalCount - distanceFromCenter) / this.urinalCount;

            // 상대방 옆에 두면 낮은 점수
            if (i > 0 && this.positions[i - 1] === 1) scores[i] -= 0.5;
            if (i < this.urinalCount - 1 && this.positions[i + 1] === 1) scores[i] -= 0.5;

            // 같은 플레이어 옆에 두면 보너스 점수
            if (i > 0 && this.positions[i - 1] === 2) scores[i] += 0.3;
            if (i < this.urinalCount - 1 && this.positions[i + 1] === 2) scores[i] += 0.3;

            // 벽에 붙어있으면 약간의 보너스
            if (i === 0 || i === this.urinalCount - 1) scores[i] += 0.2;
        }

        return scores;
    }

    makeAIMove() {
        const scores = this.evaluatePosition();
        const validMoves = scores
            .map((score, index) => ({ score, index }))
            .filter(move => move.score > 0)
            .sort((a, b) => b.score - a.score);

        if (validMoves.length > 0) {
            // 최고 점수와 비슷한 점수를 가진 움직임들 중에서 랜덤 선택
            const bestScore = validMoves[0].score;
            const goodMoves = validMoves.filter(move => move.score >= bestScore - 0.3);
            const selectedMove = goodMoves[Math.floor(Math.random() * goodMoves.length)];
            
            this.makeMove(selectedMove.index);
        }
    }

    checkGameOver() {
        if (this.gameMode === 'score') {
            return this.remainingTurns === 0 || Math.abs(this.scores[0] - this.scores[1]) >= 10;
        }
        const validMovesExist = this.positions.some((pos, index) => this.isValidMove(index));
        return !validMovesExist;
    }

    endGame() {
        this.isGameOver = true;
        this.gameOverDiv.style.display = 'block';
        
        if (this.gameMode === 'score') {
            this.finalScoresDiv.style.display = 'block';
            this.finalScore1Span.textContent = this.scores[0].toFixed(1);
            this.finalScore2Span.textContent = this.scores[1].toFixed(1);
            const winner = this.scores[0] > this.scores[1] ? 1 : 2;
            this.winnerP.textContent = `플레이어 ${winner}의 승리!`;
        } else {
            this.finalScoresDiv.style.display = 'none';
            const winner = this.currentPlayer === 1 ? 2 : 1;
            if (this.gameMode === 'single') {
                this.winnerP.textContent = winner === 1 ? '플레이어의 승리!' : 'AI의 승리!';
            } else {
                this.winnerP.textContent = `플레이어 ${winner}의 승리!`;
            }
        }
        this.playAgainBtn.style.display = 'block';
    }

    resetGame() {
        this.gameOverDiv.style.display = 'none';
        this.gameBoard.style.display = 'none';
        this.scoreGameBoard.style.display = 'none';
        this.gameModeSelection.style.display = 'block';
        this.positions = [];
        this.currentPlayer = 1;
        this.isGameOver = false;
        this.scores = [0, 0];
        this.remainingTurns = 20;
        this.occupiedTurns = new Array(7).fill(0);
        this.occupiedBy = new Array(7).fill(0);
        
        if (this.lastMoveInfo) this.lastMoveInfo.innerHTML = '';
        if (this.bonusInfo) this.bonusInfo.innerHTML = '';
        this.playAgainBtn.style.display = 'none';
    }
}

// 게임 인스턴스 생성
window.addEventListener('DOMContentLoaded', () => {
    new UrinalGame();
}); 