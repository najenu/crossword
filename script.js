// small hardcoded example of crossword data (7/5/24 boston globe mini)
// TODO parse this from a file
globeMini = {
    nRows: 5,
    nCols: 5,
    clues: [
        {   
            loc: 1,
            across: true,
            len: 4,
            text: `Chowder mollusk`,    
        },
        {
            loc: 1,
            across: false,
            len: 5,
            text: `Girl in Tchaikovsky's "The Nutcracker"`,
        },
        {
            loc: 2,
            across: false,
            len: 5,
            text: `Corrective eye surgery`,
        },
        {
            loc: 3,
            across: false,
            len: 5,
            text: `Come up, as a topic`,
        },
        {
            loc: 4,
            across: false,
            len: 4,
            text: `Fit well together`,
        },
        {
            loc: 5,
            across: false,
            len: 4,
            text: `Fencing sword`,
        },
        {   
            loc: 5,
            across: true,
            len: 5,
            text: `Emergency signal`,    
        },
        {   
            loc: 6,
            across: true,
            len: 5,
            text: `Desert haven`,    
        },
        {   
            loc: 7,
            across: true,
            len: 5,
            text: `Luck o' the ___`,    
        },
        {   
            loc: 8,
            across: true,
            len: 4,
            text: `Superior, e.g.`,    
        }
    ],
    locations: {
        1: [0,1],
        2: [0,2],
        3: [0,3],
        4: [0,4],
        5: [1,0],
        6: [2,0],
        7: [3,0],
        8: [4,0],
    }
}


/*
 * globals, accessed throughout
 * (feels like these should be members of some kind of class but idk how to do OOP in JS)
 */
let crossword = null;
let cluesByIdx = null;
let selectedCell = null;
let selectedClue = null;


/*
 * basic helper functions
 */
function isActiveIndex(i, j) {
    if (i < 0 || j < 0 || i >= crossword.nRows || j >= crossword.nCols) {
        return false;
    }
    // active if there are any applicable clues at this location
    return cluesByIdx[i][j].length > 0;
}

function getCellByIdx(i, j) {
    const container = document.querySelector("#grid-container");
    return container.childNodes[i].childNodes[j];
}

function isCellInClue(i, j, clue) {
    start = crossword.locations[clue.loc];
    if (clue.across) {
        return i == start[0] && start[1] <= j && j < start[1] + clue.len;
    } else {
        return j == start[1] && start[0] <= i && i < start[0] + clue.len;
    }
}


/*
 * logic governing automatic cursor movement
 */
function advanceCursor() {
    // try to advance within current clue
    if (selectedClue.across) {
        if (isCellInClue(i, selectedCell.j + 1, selectedClue)) {
            selectCell(i, selectedCell.j + 1);
            return;
        }
    } else {
        if (isCellInClue(selectedCell.i + 1, j, selectedClue)) {
            selectCell(selectedCell.i + 1, j);
            return;
        }
    }

    // end of current clue - find next clue in same direction, or first clue in opposite direction
    let nextClue = crossword.clues.find((clue) => {
        return clue.across === selectedClue.across && clue.loc > selectedClue.loc;
    });
    if (!nextClue) {
        nextClue = crossword.clues.find((clue) => {
            return clue.across !== selectedClue.across;
        });
    }
    selectClue(nextClue);
    let start = crossword.locations[nextClue.loc];
    selectCell(start[0], start[1]);
}

function retreatCursor() {
    // try to retreat within current clue
    if (selectedClue.across) {
        if (isCellInClue(i, selectedCell.j - 1, selectedClue)) {
            selectCell(i, selectedCell.j - 1);
            return;
        }
    } else {
        if (isCellInClue(selectedCell.i - 1, j, selectedClue)) {
            selectCell(selectedCell.i - 1, j);
            return;
        }
    }

    // start of current clue - find previous clue in same direction, if there is none do nothing
    let prevClue = crossword.clues.findLast((clue) => {
        return clue.across === selectedClue.across && clue.loc < selectedClue.loc;
    });

    if (prevClue) {
        selectClue(prevClue);
        let start = crossword.locations[prevClue.loc];
        selectCell(start[0] + (prevClue.across ? 0 : prevClue.len - 1),
                   start[1] + (prevClue.across ? prevClue.len - 1 : 0));
    }
}

let arrowKeyDeltas = {
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1],
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0]
}

function onEnterLetter(e) {
    let letterDiv = selectedCell.cell.childNodes[0];
    if (e.key.length === 1) { // check if it's a single character
        letterDiv.textContent = e.key.toUpperCase();
        advanceCursor();
    } else if (e.key == "Backspace") {
        if (letterDiv.textContent == "") {
            retreatCursor();
        } else {
            letterDiv.textContent = "";
        }
    } else if (e.key in arrowKeyDeltas) {
        let diff = arrowKeyDeltas[e.key];
        let newI = selectedCell.i + diff[0];
        let newJ = selectedCell.j + diff[1];
        if (isActiveIndex(newI, newJ)) {
            selectCell(newI, newJ);
        }
    }
}


/*
 * logic when a cell or clue is selected
 * either manually or automatically
 */
function selectClue(clue) {
    // unselect cells in current clue
    if (selectedClue) {
        let start = crossword.locations[selectedClue.loc];
        let i = start[0]; let j = start[1];
        for (let k = 0; k < selectedClue.len; k++) {
            getCellByIdx(i, j).classList.remove("clue-selected-cell");
            selectedClue.across ? j++ : i++;
        }
        selectedClue.textNode.classList.remove("selected-clue");
    }

    // select cells in this clue
    start = crossword.locations[clue.loc];
    i = start[0]; j = start[1];
    for (let k = 0; k < clue.len; k++) {
        getCellByIdx(i, j).classList.add("clue-selected-cell");
        clue.across ? j++ : i++;
    }
    clue.textNode.classList.add("selected-clue");
    selectedClue = clue;
}

function selectCell(i, j) {
    if (!isActiveIndex(i,j)) {
        console.log(`ERROR: selected invalid index (${i}, ${j})`);
        return;
    }
    const cell = getCellByIdx(i, j);
    if (!cell) {
        console.log(`ERROR: couldn't find selected cell (${i}, ${j})`);
        return;
    }

    if (selectedCell && selectedCell.cell === cell) {
        // if same cell reselected, select the other clue (if there is one)
        newClue = cluesByIdx[i][j].find((clue) => {
            return !(clue.loc == selectedClue.loc && clue.across == selectedClue.across);
        });
        if (newClue) {
            selectClue(newClue);
        }
        return;
    }

    // dis-select currently selected cell
    if (selectedCell) {
        selectedCell.cell.classList.remove("selected-cell");
    } else {
        // first selection of any cell, start listening for keystrokes
        window.addEventListener("keydown", onEnterLetter);
    }

    cell.classList.add("selected-cell");
    selectedCell = {cell, i, j};

    // keep current selection if applicable
    if (!selectedClue || !isCellInClue(i, j, selectedClue)) {
        // TODO could start with unfilled clue if one is filled
        selectClue(cluesByIdx[i][j][0]);
    }
}


/*
 * setup logic: populates DOM and internal data structures based on clues, adds appropriate event handlers
 */

// construct map from each index pair to clues applicable at that location
function preProcessClues() {
    // nRows x nCols grid of empty arrays
    cluesByIdx = Array();
    for (let i = 0; i < crossword.nRows; i++) {
        cluesByIdx.push(Array());
        for (let j = 0; j < crossword.nCols; j++) {
            cluesByIdx[i].push(Array());
        }
    }

    for (const clue of crossword.clues) {
        let start = crossword.locations[clue.loc];
        let i = start[0]; let j = start[1];
        for (let k = 0; k < clue.len; k++) {
            if (i >= crossword.nRows || j >= crossword.nCols) {
                console.log(`ERROR: invalid clue ${clue.loc} ${clue.across? "across" : "down"} 
                            of length ${clue.len} calls for invalid index (${i},${j}) 
                            in puzzle of size (${crossword.nRows},${crossword.nCols})`);
                break;
            }

            cluesByIdx[i][j].push(clue);
            clue.across ? j++ : i++;
        }
    }
}

function initActiveCell(cell, i, j) {
    cell.classList.add("active-cell");

    const letterDiv = document.createElement("div");
    letterDiv.classList.add("letter-div");
    cell.appendChild(letterDiv);

    cell.addEventListener("mousedown", () => {
        selectCell(i, j);
    });
}

// creates n x n grid of empty and blocked cells
function setUpGrid() {
    const container = document.querySelector("#grid-container");
    container.innerHTML = "";

    for (let i = 0; i < crossword.nRows; i++) {
        const newRow = document.createElement("div");
        newRow.classList.add("row");
        container.appendChild(newRow);
    
        for (let j = 0; j < crossword.nCols; j++) {
            const newCell = document.createElement("div");
            newCell.classList.add("cell");
            newRow.appendChild(newCell);
            if (isActiveIndex(i, j)) {
                initActiveCell(newCell, i, j);
            }
        }
    }
}

// writes in clue location numbers and populates clue text
function setUpClues() {
    const acrossClues = document.querySelector("#across-clues");
    const downClues = document.querySelector("#down-clues");

    // want clues to appear in numeric order
    crossword.clues.sort((clueA, clueB) => {
        return clueA.loc < clueB.loc ? -1 : 1;
    });

    for (const clue of crossword.clues) {
        const newClue = document.createElement("div");
        newClue.classList.add("clue");
        newClue.textContent = `${clue.loc}. ${clue.text}`;
        clue.across ? acrossClues.appendChild(newClue) : downClues.appendChild(newClue);
        clue.textNode = newClue;

        newClue.addEventListener("click", (e) => {
            // TODO could make this start at next unfilled letter
            start = crossword.locations[clue.loc];
            selectCell(start[0], start[1]);
            selectClue(clue);
        });
    }

    // add the lil numbers in the boxes
    for (loc in crossword.locations) {
        start = crossword.locations[loc];
        cell = getCellByIdx(start[0], start[1]);

        const locDiv = document.createElement("div");
        locDiv.classList.add("loc-number");
        locDiv.textContent = loc;
        cell.appendChild(locDiv);
    }
}


/*
 * main
 */

crossword = globeMini;
preProcessClues();
setUpGrid();
setUpClues();