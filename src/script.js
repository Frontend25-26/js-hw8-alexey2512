const board = document.getElementById("board");
const field = Array(8).fill(null).map(() => Array(8).fill(null));

let selectedPiece;
let currentPlayer;
let overlay;

function switchPlayer() {
    currentPlayer = currentPlayer === "white" ? "black" : "white";
}

function cellSize() {
    return document.querySelector('.cell').offsetWidth;
}

function createAndStartGame() {
    for (const row of board.querySelectorAll(".row"))
        row.remove();
    selectedPiece = null;
    currentPlayer = "white";
    overlay = null;
    for (let i = 0; i < 8; i++)
        for (let j = 0; j < 8; j++)
            field[i][j] = null;

    for (let i = 0; i < 8; i++) {
        const row = document.createElement("div");
        row.classList.add("row");
        for (let j = 0; j < 8; j++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.classList.add((i + j) % 2 === 0 ? "white" : "black");
            cell.dataset.i = i;
            cell.dataset.j = j;

            if (i < 3 && (i + j) % 2 !== 0) {
                addPiece(cell, "black", i, j);
            } else if (i > 4 && (i + j) % 2 !== 0) {
                addPiece(cell, "white", i, j);
            }
            row.appendChild(cell);
        }
        board.appendChild(row);
    }
}

function addPiece(cell, color, row, col) {
    const piece = document.createElement("div");
    piece.classList.add("piece", color);
    piece.dataset.color = color;
    piece.dataset.col = col;
    piece.dataset.row = row;
    cell.appendChild(piece);
    field[row][col] = {color, element: piece};
}

function getValidMoves(row, col) {
    const piece = field[row][col];
    if (!piece || piece.color !== currentPlayer) return [];

    const moves = [];
    const direction = piece.color === "white" ? -1 : 1;

    const simpleMoves = [[row + direction, col - 1], [row + direction, col + 1]];
    for (const [newRow, newCol] of simpleMoves)
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8 && !field[newRow][newCol])
            moves.push({row: newRow, col: newCol, capture: null});

    const captureMoves = [
        [row + direction * 2, col - 2, row + direction, col - 1],
        [row + direction * 2, col + 2, row + direction, col + 1],
        [row - direction * 2, col - 2, row - direction, col - 1],
        [row - direction * 2, col + 2, row - direction, col + 1]
    ];
    for (const [newRow, newCol, captureRow, captureCol] of captureMoves)
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
            const capturedPiece = field[captureRow][captureCol];
            if (capturedPiece && capturedPiece.color !== piece.color && !field[newRow][newCol])
                moves.push({row: newRow, col: newCol, capture: {row: captureRow, col: captureCol}});
        }

    return moves;
}

function movePiece(fromRow, fromCol, toRow, toCol, capturePos) {
    const piece = field[fromRow][fromCol];
    const element = piece.element;
    const fromCell = document.querySelector(`[data-i="${fromRow}"][data-j="${fromCol}"]`);
    const toCell = document.querySelector(`[data-i="${toRow}"][data-j="${toCol}"]`);

    field[fromRow][fromCol] = null;

    const deltaX = (toCol - fromCol) * cellSize();
    const deltaY = (toRow - fromRow) * cellSize();

    if (capturePos) element.classList.add('jumping');
    element.style.setProperty('--x', `${deltaX}px`);
    element.style.setProperty('--y', `${deltaY}px`);

    setTimeout(() => {
        element.style.setProperty('--x', '0px');
        element.style.setProperty('--y', '0px');
        element.classList.remove('jumping');
        element.dataset.row = toRow;
        element.dataset.col = toCol;

        fromCell.removeChild(element);
        toCell.appendChild(element);

        if (capturePos) {
            const capturedPiece = field[capturePos.row][capturePos.col];
            if (capturedPiece) {
                capturedPiece.element.classList.add('captured');
                setTimeout(() => {
                    capturedPiece.element.remove();
                }, 400);
                field[capturePos.row][capturePos.col] = null;
            }
        }

        field[toRow][toCol] = piece;

        switchPlayer();
        checkWinner();
    }, 300);
}

function checkWinner() {
    let whites = 0;
    let blacks = 0;
    let whiteValidMoves = 0;
    let blackValidMoves = 0;
    for (let i = 0; i < 8; i++)
        for (let j = 0; j < 8; j++)
            if (field[i][j]) {
                if (field[i][j].color === "white") {
                    whites++;
                    whiteValidMoves += getValidMoves(i, j);
                } else {
                    blacks++;
                    blackValidMoves += getValidMoves(i, j);
                }
            }
    if (whites === 0 || blacks === 0)
        showWinner(whites > 0 ? "Белые" : "Черные");
    else if (whiteValidMoves === 0 || blackValidMoves === 0)
        showWinner(whiteValidMoves > 0 ? "Белые" : "Черные");
}

function showWinner(winner) {
    const [backColor, fontColor] = winner === "Белые" ? ["white", "black"] : ["black", "white"]
    overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "100";

    const message = document.createElement("div");
    message.textContent = `${winner} победили!`;
    message.style.fontSize = "48px";
    message.style.color = fontColor;
    message.style.fontWeight = "bold";
    message.style.padding = "30px 60px";
    message.style.backgroundColor = backColor;
    message.style.borderRadius = "8px";

    overlay.appendChild(message);
    document.body.appendChild(overlay);

    overlay.addEventListener("click", function () {
        overlay.remove();
        overlay = null;
        createAndStartGame();
    });
}

board.addEventListener("click", (e) => {
    if (overlay) return;

    const piece = e.target.closest(".piece");
    const cell = e.target.closest(".cell");

    if (piece && piece.dataset.color === currentPlayer && !selectedPiece) {
        selectedPiece = {
            element: piece,
            row: parseInt(piece.dataset.row),
            col: parseInt(piece.dataset.col)
        };
        piece.classList.add("selected");
    } else if (selectedPiece) {
        if (cell) {
            const targetRow = parseInt(cell.dataset.i);
            const targetCol = parseInt(cell.dataset.j);
            const validMoves = getValidMoves(selectedPiece.row, selectedPiece.col);
            const move = validMoves.find(m => m.row === targetRow && m.col === targetCol);
            if (move) movePiece(selectedPiece.row, selectedPiece.col, targetRow, targetCol, move.capture);
        }
        selectedPiece.element.classList.remove("selected");
        selectedPiece = null;
    }
});

createAndStartGame();
