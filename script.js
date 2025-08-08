const gameArea = document.getElementById('gameArea');
const star = document.getElementById('star');
const gem = document.getElementById('gem');
const diamond = document.getElementById('diamond');
const scoreDisplay = document.getElementById('scoreValue');
const highScoreDisplay = document.getElementById('highScoreValue');
const gameOverScreen = document.getElementById('gameOver');
const finalScoreDisplay = document.getElementById('finalScore');
const startButton = document.getElementById('startButton');
const logoutButton = document.getElementById('logoutButton');
const resetLeaderboardButton = document.getElementById('resetLeaderboardButton');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('loginError');
const loginStatus = document.getElementById('loginStatus');
const stats = document.querySelector('.stats');
const leaderboardBody = document.getElementById('leaderboardBody');
const scoreSound = document.getElementById('scoreSound');
const gemSound = document.getElementById('gemSound');
const diamondSound = document.getElementById('diamondSound');
const gameOverSound = document.getElementById('gameOverSound');
const buttonSound = document.getElementById('buttonSound');
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let currentUser = null;
let gameActive = false;
let gameLoopInterval = null;
let currentTarget = null;
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
let users = JSON.parse(localStorage.getItem('users')) || {};

highScoreDisplay.textContent = highScore;

function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        hash = ((hash << 5) - hash) + password.charCodeAt(i);
        hash |= 0;
    }
    return hash.toString();
}

function login() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const hashedPassword = hashPassword(password);
    if (!username || !password) {
        loginError.textContent = 'Please enter both username and password';
        loginError.style.display = 'block';
        return;
    }
    if (users[username] && users[username].password === hashedPassword) {
        currentUser = username;
        loginForm.style.display = 'none';
        loginStatus.textContent = `Logged in as: ${username}`;
        startButton.disabled = false;
        logoutButton.style.display = 'block';
        resetLeaderboardButton.style.display = 'block';
        gameArea.style.display = 'block';
        stats.style.display = 'flex';
        loginError.style.display = 'none';
        buttonSound.play().catch(e => console.log("Button sound error:", e));
        updateLeaderboard();
    } else {
        loginError.textContent = 'Invalid username or password';
        loginError.style.display = 'block';
    }
}

function register() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const hashedPassword = hashPassword(password);
    if (!username || !password) {
        loginError.textContent = 'Please enter both username and password';
        loginError.style.display = 'block';
        return;
    }
    if (users[username]) {
        loginError.textContent = 'Username already exists';
        loginError.style.display = 'block';
        return;
    }
    users[username] = { password: hashedPassword };
    localStorage.setItem('users', JSON.stringify(users));
    loginError.textContent = 'Registration successful! Please log in.';
    loginError.style.display = 'block';
    loginError.style.color = 'green';
}

function logout() {
    buttonSound.play().catch(e => console.log("Button sound error:", e));
    currentUser = null;
    loginForm.style.display = 'block';
    loginStatus.textContent = '';
    startButton.disabled = true;
    logoutButton.style.display = 'none';
    resetLeaderboardButton.style.display = 'none';
    gameArea.style.display = 'none';
    stats.style.display = 'none';
    if (gameActive) {
        endGame();
    }
}

function resetLeaderboard() {
    if (!currentUser) return;
    buttonSound.play().catch(e => console.log("Button sound error:", e));
    if (confirm('Are you sure you want to reset the leaderboard? This cannot be undone.')) {
        leaderboard = [];
        localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
        updateLeaderboard();
    }
}

function updateLeaderboard() {
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 5);
    leaderboardBody.innerHTML = '';
    leaderboard.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${entry.name}</td><td>${entry.score}</td>`;
        leaderboardBody.appendChild(row);
    });
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

function moveTarget() {
    if (!gameActive) return;
    // Hide all targets
    star.style.display = 'none';
    gem.style.display = 'none';
    diamond.style.display = 'none';
    // Randomly select a target (85% star, 10% gem, 5% diamond)
    const rand = Math.random();
    let selectedTarget, points, sound;
    if (rand < 0.85) {
        selectedTarget = star;
        points = 1;
        sound = scoreSound;
    } else if (rand < 0.95) {
        selectedTarget = gem;
        points = 5;
        sound = gemSound;
    } else {
        selectedTarget = diamond;
        points = 10;
        sound = diamondSound;
    }
    currentTarget = { element: selectedTarget, points: points, sound: sound };
    const maxX = gameArea.clientWidth - selectedTarget.clientWidth;
    const maxY = gameArea.clientHeight - selectedTarget.clientHeight;
    const newX = Math.random() * maxX;
    const newY = Math.random() * maxY;
    selectedTarget.style.left = newX + 'px';
    selectedTarget.style.top = newY + 'px';
    selectedTarget.style.display = 'block';
}

function startGame() {
    if (!currentUser) return;
    buttonSound.play().catch(e => console.log("Button sound error:", e));
    gameActive = true;
    score = 0;
    scoreDisplay.textContent = score;
    gameOverScreen.style.display = 'none';
    star.style.display = 'none';
    gem.style.display = 'none';
    diamond.style.display = 'none';
    startButton.style.display = 'none';
    moveTarget();
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    gameLoopInterval = setInterval(moveTarget, 800);
}

function endGame() {
    gameOverSound.play().catch(e => console.log("Game over sound error:", e));
    gameActive = false;
    star.style.display = 'none';
    gem.style.display = 'none';
    diamond.style.display = 'none';
    finalScoreDisplay.textContent = score;
    gameOverScreen.style.display = 'block';
    startButton.style.display = 'block';
    if (gameLoopInterval) {
        clearInterval(gameLoopInterval);
        gameLoopInterval = null;
    }
    if (score > 0) {
        const existingEntry = leaderboard.find(entry => entry.name === currentUser);
        if (existingEntry) {
            if (score > existingEntry.score) {
                existingEntry.score = score;
            }
        } else {
            leaderboard.push({ name: currentUser, score: score });
        }
        updateLeaderboard();
    }
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreDisplay.textContent = highScore;
    }
}

function resetGame() {
    buttonSound.play().catch(e => console.log("Button sound error:", e));
    startGame();
}

startButton.addEventListener('click', startGame);

star.addEventListener('click', (e) => {
    e.stopPropagation();
    if (gameActive && currentTarget.element === star) {
        score += currentTarget.points;
        scoreDisplay.textContent = score;
        currentTarget.sound.play().catch(e => console.log("Score sound error:", e));
        moveTarget();
    }
});

gem.addEventListener('click', (e) => {
    e.stopPropagation();
    if (gameActive && currentTarget.element === gem) {
        score += currentTarget.points;
        scoreDisplay.textContent = score;
        currentTarget.sound.play().catch(e => console.log("Gem sound error:", e));
        moveTarget();
    }
});

diamond.addEventListener('click', (e) => {
    e.stopPropagation();
    if (gameActive && currentTarget.element === diamond) {
        score += currentTarget.points;
        scoreDisplay.textContent = score;
        currentTarget.sound.play().catch(e => console.log("Diamond sound error:", e));
        moveTarget();
    }
});

gameArea.addEventListener('click', (e) => {
    if (e.target !== star && e.target !== gem && e.target !== diamond && gameActive) {
        endGame();
    }
});

gameOverScreen.addEventListener('click', (e) => {
    e.stopPropagation();
});

// Show login form on load
loginForm.style.display = 'block';
updateLeaderboard();