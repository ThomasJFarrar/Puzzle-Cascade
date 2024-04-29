// Define constant arrays and variables.
var candyList = ["Blue", "Orange", "Green", "Yellow", "Red", "Purple"];
var board = [];
var rows = 9;
var columns = 9;
var score = 0;
var moveCounter = 0;
var levelEnded = false;
var botRunning = false;
var candy1;
var candy2;
var candy3;
var candy4;
var candy5;
var obstacleChance = 0;
var bonusChance = 0;

var levelParams;

var levelNumber = 1;
var maxMoves;
var shufflePenalty = 1;
var maxCandies = 6;
var targetScore;
var adaptive = true;

var currTile;
var otherTile;
var firstMoveMade = false;

// Player tracking
var totalLevelTime;
var start;
var timesShuffled;
var fives;
var fours;
var threes;

var timeBetweenMoves = [];
var startTimeMove;

var scoreDifference;

var statsSent = false;

// When the window loads, start the game and set intervals for game actions.
window.onload = function() {
    // Send an AJAX request to notify the server.
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/load', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({}));
}

function switchToAdaptive() {
    document.getElementById("adaptive").style.display = "none";
    document.getElementById("random").style.display = "block";
    adaptive = true;
}

function switchToRandom() {
    document.getElementById("adaptive").style.display = "block";
    document.getElementById("random").style.display = "none";
    adaptive = false;
}

function fetchLevelParameters() {
    fetch('/get_level_params', {
        method: 'GET',
    })
    .then(response => response.json())
    .then(data => {
        maxMoves = data[0];
        targetScore = data[1];
        obstacleChance = data[2]
        bonusChance = data[3]
        document.getElementById("target").innerText = targetScore;
        console.log(data)})
    .catch(error => console.error('Error:', error));
}

// Add listener for if player unloads.
window.addEventListener('beforeunload', function (e) {
    // Send an AJAX request to notify the server.
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/unload', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({}));
});

// Generate a random candy from the candy list.
function randomCandy() {
    let randomNumber = Math.floor(Math.random() * bonusChance);
    if (randomNumber === 0) {
        return "Bonus"
    }
    randomNumber = Math.floor(Math.random() * obstacleChance);
    if (randomNumber === 0) {
        return "Obstacle"
    }
    return candyList[Math.floor(Math.random() * maxCandies)];
}

function runStupidBot() {
    botRunning = true;
    startLevel();
    var stupidBot = setInterval(function() {
        for (let r = rows - 1; r >= 0; r--) {
            for (let c = 0; c < columns; c++) {
                // Stop if the level has ended.
                if (levelEnded) {
                    clearInterval(stupidBot);
                    return;
                }
                if (c > 0) { // Check left.
                    currTile = board[r][c];
                    otherTile = board[r][c - 1];
                    if (dragEnd()) {
                        return;
                    }
                }
                if (c < columns - 1) { // Check right.
                    currTile = board[r][c];
                    otherTile = board[r][c + 1];
                    if (dragEnd()) {
                        return;
                    }
                }
                if (r > 0) { // Check up.
                    currTile = board[r][c];
                    otherTile = board[r - 1][c];
                    if (dragEnd()) {
                        return;
                    }
                }
                if (r < rows - 1) { // Check down.
                    currTile = board[r][c];
                    otherTile = board[r + 1][c];
                    if (dragEnd()) {
                        return;
                    }
                }
            }
        }
        shuffle();
        return;
    }, 200);
}

function runCleverBot() {
    botRunning = true;
    startLevel();
    var cleverBot = setInterval(function() {
        for (let i = 0; i < 4; i++) {
            for (let r = rows - 1; r >= 0; r--) {
                for (let c = 0; c < columns; c++) {
                    if (levelEnded) {
                        clearInterval(cleverBot);
                        return;
                    }
                    // Check left
                    if (c > 0) {
                        currTile = board[r][c]
                        otherTile = board[r][c - 1]
                        if (botCheckAndSwap(currTile, otherTile, i)) {
                            dragEnd();
                            return;
                        }
                    }
                    // Check right
                    if (c < columns - 1) {
                        currTile = board[r][c]
                        otherTile = board[r][c + 1]
                        if (botCheckAndSwap(currTile, otherTile, i)) {
                            dragEnd();
                            return;
                        }
                    }
                    // Check up
                    if (r > 0) {
                        currTile = board[r][c]
                        otherTile = board[r - 1][c]
                        if (botCheckAndSwap(currTile, otherTile, i)) {
                            dragEnd();
                            return;
                        }
                    }
                    // Check down
                    if (r < rows - 1) {
                        currTile = board[r][c]
                        otherTile = board[r + 1][c]
                        if (botCheckAndSwap(currTile, otherTile, i)) {
                            dragEnd();
                            return;
                        }
                    }
                }
            }
        }
        shuffle()
        return;
    }, 200);
}

function botCheckAndSwap(currTile, otherTile, iteration) {
    const currImg = otherTile.src;
    const otherImg = currTile.src;
    currTile.src = otherImg;
    otherTile.src = currImg;
    let success = false;
    if (iteration === 0 && currTile.src.includes("Bonus") || otherTile.src.includes("Bonus") && !(currTile.src.includes("Obstacle") || otherTile.src.includes("Obstacle"))) {
        success = true;
    }
    else if (iteration === 1 && checkFive()) {
        success = true;
    } else if (iteration === 2 && checkFour()) {
        success = true;
    } else if (iteration === 3 && checkThree()) {
        success = true;
    }
    currTile.src = currImg;
    otherTile.src = otherImg;
    if (success) {
        return true;
    }
    return false;
}

// Initialize the game state.
function startLevel() {
    if (adaptive) {
        fetchLevelParameters();
    } else {
        maxMoves = Math.floor(Math.random() * (20 - 10) + 10);
        targetScore = Math.floor(Math.random() * (800 - 200) + 200);
        obstacleChance = Math.floor(Math.random() * (75 - 25) + 25);
        bonusChance = Math.floor(Math.random() * (200 - 50) + 50);
        document.getElementById("target").innerText = targetScore;
    }
    levelEnded = false;
    statsSent = false;
    firstMoveMade = false;
    timesShuffled = 0;
    moveCounter = 0;
    score = 0;
    timeBetweenMoves = [];
    start = Date.now();
    scoreDifference = 0;
    totalLevelTime = 0;
    fives = 0;
    fours = 0;
    threes = 0;
    setInterval(function(){
        crushCandy();
    }, 50);
    // Hide play again button and update the level number.
    document.getElementById("levelElements").style.display = "block";
    document.getElementById("startScreen").style.display = "none"
    document.getElementById("gameOver").style.display = "none";
    document.getElementById("nextLvlBtn").style.display = "none";
    document.getElementById("level").textContent = levelNumber;
    // Display shuffle button with shuffle penalty.
    document.getElementById("shuffle").style.display = "block";
    document.getElementById("shuffle").textContent = `Shuffle (${shufflePenalty} move)`;
    clearBoard();
    generateGrid();
}

// Clear the game board.
function clearBoard() {
    board = [];
    document.getElementById("board").innerHTML = "";
}

// Generate the game grid with candies.
function generateGrid() {
    // Loop through rows and columns to create tiles with candies.
    for (let r = 0; r < rows; r++) {
        let row = [];
        for (let c = 0; c < columns; c++) {
            let tile = document.createElement("img");
            tile.id = `${r}-${c}`;
            tile.src = `static/images/${randomCandy()}.png`;
            startTimeMove = Date.now()
            // Add event listeners for drag and drop functionality.
            tile.addEventListener("dragstart", dragStart); // Click on a candy, initialize drag process.
            tile.addEventListener("dragover", dragOver);  // Clicking on candy, moving mouse to drag the candy.
            tile.addEventListener("dragenter", dragEnter); // Dragging candy onto another candy.
            tile.addEventListener("dragleave", dragLeave); // Leave candy over another candy.
            tile.addEventListener("drop", dragDrop); // Dropping a candy over another candy.
            tile.addEventListener("dragend", dragEnd); // After drag process completed, swap candies.

            document.getElementById("board").append(tile);
            row.push(tile);
        }
        board.push(row);
    }
}

// Event handler for drag start.
function dragStart() {
    // Tile that was clicked on for dragging.
    currTile = this;
}

// Event handler for drag over.
function dragOver(e) {
    e.preventDefault();
}

// Event handler for drag enter.
function dragEnter(e) {
    e.preventDefault();
}

// Event handler for drag leave
function dragLeave() {
}

// Event handler for drag drop.
function dragDrop() {
    // The target tile that was dropped on.
    otherTile = this;
}

// Event handler for drag end.
function dragEnd() {
    // Check if the dragged tiles are not blank
    if (currTile.src.includes("blank") || otherTile.src.includes("blank")) {
        return false;; // If either tile is blank, exit the function since the move is not valid.
    }
    // Check if the dragged tiles are not obstacles.
    if (currTile.src.includes("Obstacle") || otherTile.src.includes("Obstacle")) {
        return false;; // If either tile is obstacles, exit the function since the move is not valid.
    }

    // Extract row and column indices of the current and other tiles.
    const [r, c] = currTile.id.split("-").map(Number);
    const [r2, c2] = otherTile.id.split("-").map(Number);

    // Determine if the move is adjacent in any of the four directions.
    const moveLeft = c2 === c - 1 && r === r2;
    const moveRight = c2 === c + 1 && r === r2;
    const moveUp = r2 === r - 1 && c === c2;
    const moveDown = r2 === r + 1 && c === c2;
    const isAdjacent = moveLeft || moveRight || moveUp || moveDown;

    // If move is adjacent, swap tiles and check validity.
    if (isAdjacent) {
        const currImg = currTile.src;
        const otherImg = otherTile.src;
        currTile.src = otherImg;
        otherTile.src = currImg;
        const validMove = checkThree(); // Check if the move creates a valid combination.
        // Increment move counter if move is valid.
        if (moveCounter < maxMoves) {
            if (validMove) {
                firstMoveMade = true;
                moveCounter++;
                let delta = Date.now() - startTimeMove;
                timeBetweenMoves.push(Math.floor(delta / 1000));
                startTimeMove = Date.now();
                return true;
            // Check if the dragged tiles are bonuses
            } else if (currTile.src.includes("Bonus") || otherTile.src.includes("Bonus")){
                firstMoveMade = true;
                moveCounter++;
                let delta = Date.now() - startTimeMove;
                timeBetweenMoves.push(Math.floor(delta / 1000));
                startTimeMove = Date.now();
                currTile.src = "static/images/blank.png";
                otherTile.src = "static/images/blank.png";
                score += 100;
                return true;
            } else {
                // If move is not valid, revert the swap.
                let currImg = currTile.src;
                let otherImg = otherTile.src;
                currTile.src = otherImg;
                otherTile.src = currImg;
                return false;
            }
        } else {
            // Revert the swap if ran out of moves.
            let currImg = currTile.src;
            let otherImg = otherTile.src;
            currTile.src = otherImg;
            otherTile.src = currImg;
        }
    }
    return false;
}

// Check for and eliminate candy combinations of three or more in a row or column.
function crushCandy() {
    // Clear the combinations of tiles and add to the score.
    if (checkFive()) {
        candy1.src = candy2.src = candy3.src = candy4.src = candy5.src = "static/images/blank.png";
        if (firstMoveMade) {
            score += 50;
            fives += 1;
        }
    }
    if (checkFour()) {
        candy1.src = candy2.src = candy3.src = candy4.src = "static/images/blank.png";
        if (firstMoveMade) {
            score += 40;
            fours += 1;
        }
    }
    if (checkThree()) {
        candy1.src = candy2.src = candy3.src = "static/images/blank.png";
        if (firstMoveMade) {
            score += 30;
            threes += 1;
        }
    }
    document.getElementById("moves").innerText = maxMoves - moveCounter;
    document.getElementById("score").innerText = score;
    slideCandy();
    generateCandy();
}

// Handle shuffling the candies on the board.
function shuffle() {
    // Add shuffle penalty to the move counter.
    moveCounter += shufflePenalty;
    timesShuffled++;
    let delta = Date.now() - startTimeMove;
    timeBetweenMoves.push(Math.floor(delta / 1000));
    startTimeMove = Date.now();
    clearBoard();
    firstMoveMade = false;
    generateGrid();
    crushCandy();
}

function gameOver() {
    // Display game over screen.
    document.getElementById("levelElements").style.display = "none";
    document.getElementById("gameOver").style.display = "block";
    if (botRunning) {
        playAgain()
    }
}

function nextLevel() {
    levelNumber++;
    startLevel();
}

function playAgain() {
    levelNumber = 1;
    startLevel();
}

// Handle the end of the game.
function endLevel() {
    levelEnded = true;
    // Calculate time spent in level.
    let delta = Date.now() - start;
    totalLevelTime = Math.floor(delta / 1000); // To Seconds.
    // Calculate the score difference
    scoreDifference = score - targetScore;
    document.getElementById("shuffle").style.display = "none";
    firstMoveMade = false;
    if (scoreDifference >= 0) {
        saveStats();
        document.getElementById("nextLvlBtn").style.display = "block";
        if (botRunning) {
            nextLevel();
        }
    }
    else {
        saveStats();
        gameOver();
    }
}

// Save the player's stats for the level.
function saveStats() {
    if (!statsSent) {

        // Calculate average time between moves.
        let total = 0;
        for(let i = 0; i < timeBetweenMoves.length; i++) {
            total += timeBetweenMoves[i];
        }
        let avgTime = total / timeBetweenMoves.length;

        let jsonData = {
            "avgmovetime": avgTime,
            "scorediff": scoreDifference,
            "shuffles": timesShuffled,
            "fives": fives,
            "fours": fours,
            "threes": threes
        };

        fetch('/stats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonData)
        })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
        statsSent = true;
    }
}

// Check for candy combinations of three in a row or column.
function checkThree() {
    // Check for combinations in rows.
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns - 2; c++) {
            [candy1, candy2, candy3] = [board[r][c], board[r][c+1], board[r][c+2]];
            if (candy1.src === candy2.src && candy2.src === candy3.src && !candy1.src.includes("blank")) {
                return true;
            }
        }
    }

    // Check for combinations in columns.
    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows - 2; r++) {
            [candy1, candy2, candy3] = [board[r][c], board[r+1][c], board[r+2][c]];
            if (candy1.src === candy2.src && candy2.src === candy3.src && !candy1.src.includes("blank")) {
                return true;
            }
        }
    }
    return false;
}

// Check for candy combinations of four in a row or column.
function checkFour() {
    // Check for combinations in rows.
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns - 3; c++) {
            [candy1, candy2, candy3, candy4] = [board[r][c], board[r][c+1], board[r][c+2], board[r][c+3]];
            if (candy1.src === candy2.src && candy2.src === candy3.src && candy3.src === candy4.src && !candy1.src.includes("blank")) {
                return true;
            }
        }
    }

    // Check for combinations in columns.
    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows - 3; r++) {
            [candy1, candy2, candy3, candy4] = [board[r][c], board[r+1][c], board[r+2][c], board[r+3][c]];
            if (candy1.src === candy2.src && candy2.src === candy3.src && candy3.src === candy4.src && !candy1.src.includes("blank")) {
                return true;
            }
        }
    }
    return false;
}

// Check for candy combinations of five in a row or column.
function checkFive() {
    // Check for combinations in rows.
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns - 4; c++) {
            [candy1, candy2, candy3, candy4, candy5] = [board[r][c], board[r][c+1], board[r][c+2], board[r][c+3], board[r][c+4]];
            if (candy1.src === candy2.src && candy2.src === candy3.src && candy3.src === candy4.src && candy4.src === candy5.src && !candy1.src.includes("blank")) {
                return true;
            }
        }
    }

    // Check for combinations in columns.
    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows - 4; r++) {
            [candy1, candy2, candy3, candy4, candy5] = [board[r][c], board[r+1][c], board[r+2][c], board[r+3][c], board[r+4][c]];
            if (candy1.src === candy2.src && candy2.src === candy3.src && candy3.src === candy4.src && candy4.src === candy5.src && !candy1.src.includes("blank")) {
                return true;
            }
        }
    }
    return false;
}

// Slide candies down when there are empty spaces on the board.
function slideCandy() {
    for (let c = 0; c < columns; c++) {
        let ind = rows - 1;
        // Slide non-blank candies down.
        for (let r = columns - 1; r >= 0; r--) {
            if (!board[r][c].src.includes("blank")) {
                board[ind][c].src = board[r][c].src;
                ind -= 1;
            }
        }

        // Fill empty spaces with blank candies.
        for (let r = ind; r >= 0; r--) {
            board[r][c].src = "static/images/blank.png";
        }
    }

    // End the game if the target score is reached or there are no more moves left.
    if (moveCounter >= maxMoves) {
        endLevel();
    }
}

// Generate new candies at the top of the board.
function generateCandy() {
    for (let c = 0; c < columns;  c++) {
        // If the top row contains a blank candy, replace it with a randomly generated candy.
        if (board[0][c].src.includes("blank")) {
            board[0][c].src = `static/images/${randomCandy()}.png`;
        }
    }
}
