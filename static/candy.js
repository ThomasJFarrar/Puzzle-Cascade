// Define constant arrays and variables.
var candyList = ["Blue", "Orange", "Green", "Yellow", "Red", "Purple"];
var board = [];
var rows = 9;
var columns = 9;
var score = 0;
var moveCounter = 0;

var maxMoves = 20;
var shufflePenalty = 3;
var maxCandies = 6;
var targetScore = 1000;

var currTile;
var otherTile;
var firstMoveMade = false;

// When the window loads, start the game and set intervals for game actions.
window.onload = function() {
    startGame();
    setInterval(function(){
        crushCandy();
        slideCandy();
        generateCandy();
    }, 100);
}

// Generate a random candy from the candy list.
function randomCandy() {
    return candyList[Math.floor(Math.random() * maxCandies)]; //0 - 5.99
}

// Initialize the game state.
function startGame() {
    // Set target score and hide play again button.
    document.getElementById("target").innerText = targetScore;
    document.getElementById("playAgainBtn").style.display = "none";
    // Display shuffle button with shuffle penalty.
    document.getElementById("shuffle").textContent = `Shuffle (${shufflePenalty} moves)`;
    moveCounter = 0
    score = 0
    generateGrid()
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
    // Check if the dragged tiles are not blank and are adjacent.
    if (currTile.src.includes("blank") || otherTile.src.includes("blank")) {
        return; // If either tile is blank, exit the function since the move is not valid.
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
        const validMove = checkValid(); // Check if the move creates a valid combination.
        // Increment move counter if move is valid.
        if (validMove) {
            firstMoveMade = true;
            moveCounter++;
        } else {
            // If move is not valid, revert the swap.
            let currImg = currTile.src;
            let otherImg = otherTile.src;
            currTile.src = otherImg;
            otherTile.src = currImg;
        }
    }
}

// Check for and eliminate candy combinations of three or more in a row or column.
function crushCandy() {
    crushFive();
    crushFour();
    crushThree();
    // Update the displayed moves and score.
    document.getElementById("moves").innerText = maxMoves - moveCounter;
    document.getElementById("score").innerText = score;
}

// Handle shuffling the candies on the board.
function shuffle() {
    // Check if there are enough moves left to shuffle.
    if (!(moveCounter + shufflePenalty > maxMoves)) {
        regenerateGrid()
    }
    else {
        // Inform player that they can't shuffle.
    }
}

// Regenerate the grid after shuffling the candies.
function regenerateGrid() {
    // Add shuffle penalty to the move counter.
    moveCounter += shufflePenalty;
    clearBoard()
    firstMoveMade = false;
    generateGrid();
    crushCandy();
}

// Handle the end of the game.
function endGame() {
    // Display a message or perform any necessary actions.
    clearBoard()
    saveScore(score);
    score = 0
    firstMoveMade = false;
    // Display the play again button.
    document.getElementById("playAgainBtn").style.display = "block";
}

// Save the player's score for the level.
function saveScore(score) {
    // Save the score and post to python.
}

// Check for and eliminate candy combinations of three in a row or column.
function crushThree() {
    // Check for combinations in rows.
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns - 2; c++) {
            const [candy1, candy2, candy3] = [board[r][c], board[r][c+1], board[r][c+2]];
            if (candy1.src === candy2.src && candy2.src === candy3.src && !candy1.src.includes("blank")) {
                candy1.src = candy2.src = candy3.src = "static/images/blank.png";
                if (firstMoveMade) {
                    score += 30;
                }
            }
        }
    }

    // Check for combinations in columns.
    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows - 2; r++) {
            const [candy1, candy2, candy3] = [board[r][c], board[r+1][c], board[r+2][c]];
            if (candy1.src === candy2.src && candy2.src === candy3.src && !candy1.src.includes("blank")) {
                candy1.src = candy2.src = candy3.src = "static/images/blank.png";
                if (firstMoveMade) {
                    score += 30;
                }
            }
        }
    }
}

// Check for and eliminate candy combinations of four in a row or column.
function crushFour() {
    // Check for combinations in rows.
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns - 3; c++) {
            const [candy1, candy2, candy3, candy4] = [board[r][c], board[r][c+1], board[r][c+2], board[r][c+3]];
            if (candy1.src === candy2.src && candy2.src === candy3.src && candy3.src === candy4.src && !candy1.src.includes("blank")) {
                candy1.src = candy2.src = candy3.src = candy4.src = "static/images/blank.png";
                if (firstMoveMade) {
                    score += 40;
                }
            }
        }
    }

    // Check for combinations in columns
    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows - 3; r++) {
            const [candy1, candy2, candy3, candy4] = [board[r][c], board[r+1][c], board[r+2][c], board[r+3][c]];
            if (candy1.src === candy2.src && candy2.src === candy3.src && candy3.src === candy4.src && !candy1.src.includes("blank")) {
                candy1.src = candy2.src = candy3.src = candy4.src = "static/images/blank.png";
                if (firstMoveMade) {
                    score += 40;
                }
            }
        }
    }
}

// Check for and eliminate candy combinations of five in a row or column.
function crushFive() {
    // Check for combinations in rows.
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns - 4; c++) {
            const [candy1, candy2, candy3, candy4, candy5] = [board[r][c], board[r][c+1], board[r][c+2], board[r][c+3], board[r][c+4]];
            if (candy1.src === candy2.src && candy2.src === candy3.src && candy3.src === candy4.src && candy4.src === candy5.src && !candy1.src.includes("blank")) {
                candy1.src = candy2.src = candy3.src = candy4.src = candy5.src = "static/images/blank.png";
                if (firstMoveMade) {
                    score += 50;
                }
            }
        }
    }

    // Check for combinations in columns
    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows - 4; r++) {
            const [candy1, candy2, candy3, candy4, candy5] = [board[r][c], board[r+1][c], board[r+2][c], board[r+3][c], board[r+4][c]];
            if (candy1.src === candy2.src && candy2.src === candy3.src && candy3.src === candy4.src && candy4.src === candy5.src && !candy1.src.includes("blank")) {
                candy1.src = candy2.src = candy3.src = candy4.src = candy5.src = "static/images/blank.png";
                if (firstMoveMade) {
                    score += 50;
                }
            }
        }
    }
}

// Function to check if there is a valid move on the board.
function checkValid() {
    // Check for valid moves in rows.
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns - 2; c++) {
            const [candy1, candy2, candy3] = [board[r][c], board[r][c+1], board[r][c+2]];
            if (candy1.src === candy2.src && candy2.src === candy3.src && !candy1.src.includes("blank")) {
                return true;
            }
        }
    }

    // Check for valid moves in columns.
    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows - 2; r++) {
            const [candy1, candy2, candy3] = [board[r][c], board[r+1][c], board[r+2][c]];
            if (candy1.src === candy2.src && candy2.src === candy3.src && !candy1.src.includes("blank")) {
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
    if (score >= targetScore || moveCounter >= maxMoves) {
        endGame();
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
