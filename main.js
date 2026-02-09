"use strict";

const MSG_DUPLICATE_NAME = "Duplikatowe nazwy są niedozwolone";
const MSG_INVALID_SCORE = 'Wynik musi być liczbą, pusty, lub "bomba"';
const MSG_PLAYER_CANT_BOMB = [
    "Gracz wykorzystał już pierwszą bombę (pkt. poniżej 500)",
    "Gracz wykorzystał już drugą bombę (pkt. powyżej 500)"
];
const MSG_LEADERBOARD_COLUMNS = ["l.p.", "Gracze", "Wynik"];
function isBombCmd(input) { return input.trim().toLowerCase() == "bomba"; }

function getPlayerNamesFromHTML() {
    return (Array.from(_playerListInputs.children)
        .map(input => input.value.trim())
        .filter(name => name.length > 0)
    );
}

function updateActivePlayerCount() {
    let player_count = getPlayerNamesFromHTML().length;
    _playerCount.innerText = player_count.toString();
    _startGameButton.disabled = (player_count < 2);
}

for(const input of _playerListInputs.children) {
    input.oninput = updateActivePlayerCount;
    input.addEventListener("keydown", e => {
        if(e.key === "Enter") {
            input.nextElementSibling?.focus();
        }
    });
}
updateActivePlayerCount();

function showError(msg) {
    _errorMessage.innerText = msg;
    _error.showModal();
}

class Player {
    constructor(name, index) {
        this.name = name;
        this.index = index;
        this.score = 0;
        this.bombsAvail = [true, true];
        this.usedBombThisTurn = false;
    }

    get isServing() { return this.index == g_round_number % g_players.length; }

    get scoreInput() { return _scoreEntryRow.children[this.index].firstElementChild; }
};

let g_players = [];
let g_round_number = 0;

function updatePlayerNamesHTML() {
    g_players.forEach((plr, idx) => {
        let td = _playerNameRow.children[idx];
        td.innerText = plr.name;
        td.className = (plr.isServing ? "servingPlayer" : "");
    });
}

function beginGame() {
    let players = getPlayerNamesFromHTML();
    if(players.unique().length !== players.length) {
        showError(MSG_DUPLICATE_NAME);
        return;
    }

    _gameSetup.hide();
    _gameTable.show();

    players.forEach((name, index) => {
        let player = new Player(name, index);
        g_players.push(player);

        _playerNameRow.insertCell();
        _scoreEntryRow.insertCell().appendChild(makeElement("input", input => {
            input.addEventListener("keydown", e => {
                if(e.key === "Enter") {
                    submitScores();
                }
            });
        }));
    });
    updatePlayerNamesHTML();
}

function submitScores() {
    // validate input first
    for(const plr of g_players) {
        let input = plr.scoreInput.value;
        if(isBombCmd(input)) {
            let bombnum = (plr.score >= 500) ? 1 : 0;
            if(!plr.bombsAvail[bombnum]) {
                 showError(MSG_PLAYER_CANT_BOMB[bombnum]);
                 return;
            }
        } else if(input.length == 0 || isNumeric(input)) {
            /*let val = 0;
            if(input.length > 0)
                val = Number(input);
            if(val > MAX_POINTS_PER_ROUND) {
                showError(MSG_CANT_GIVE_THIS_MUCH_POINTS);
                return;
            }*/
        } else {
            showError(MSG_INVALID_SCORE);
            return;
        }
    }

    for(const plr of g_players) {
        if(isBombCmd(plr.scoreInput.value)) {
            let bombnum = (plr.score >= 500) ? 1 : 0;
            plr.bombsAvail[bombnum] = false;
            plr.usedBombThisTurn = true;
            plr.score -= 60;
            g_players.forEach(p => {
                if(!p.isServing) {
                    p.score += 60;
                }
            });
        } else {
            plr.usedBombThisTurn = false;
            let val = 0;
            if(plr.scoreInput.value.length > 0)
                val = Number(plr.scoreInput.value);
            plr.score += val;
        }
    }

    g_round_number++;

    updatePlayerNamesHTML();
    _scoreEntryRow.insertAdjacentElement("beforebegin", makeElement("tr", tr => {
        tr.className = "scoreRow";
        for(const plr of g_players) {
            let td = tr.insertCell();
            if(plr.usedBombThisTurn) {
                td.innerHTML = "&#128163;"; // TODO: use an image
            } else {
                td.innerText = plr.score.toString();
            }
        }
    }))

    g_players.forEach(p => p.scoreInput.value = "");

    if(g_players.some(p => p.score >= 1000)) {
        endGame();
    } else {
        g_players[0].scoreInput.focus();
    }
}

function endGame() {
    let leaderboard = {};
    for(const plr of g_players) {
        if(!(plr.score in leaderboard))
            leaderboard[plr.score] = [];
        leaderboard[plr.score].push(plr.name);
    }
    leaderboard = Object.entries(leaderboard)
        .map(e => ({ score: Number(e[0]), players: e[1].join(", ") }))
        .sort((e1, e2) => e2.score - e1.score);

    // disable further score input
    for(const c of _scoreEntryRow.children)
        c.firstElementChild.disabled = true;
    _scoreSubmitBtn.hide();

    _gameEndControls.insertAdjacentElement("beforebegin", makeHtmlTableSized(3, leaderboard.length + 1, (td, x, y) => {
        if(y == 0) {
            td.innerText = MSG_LEADERBOARD_COLUMNS[x];
        } else {
            if(x == 0) {
                td.innerText = `${y}.`;
            } else if(x == 1) {
                td.innerText = leaderboard[y-1].players;
            } else {
                td.innerText = `${leaderboard[y-1].score}`;
            }
        }
    })).className = "leaderboard";

    _gameEndControls.show();
}

function restartGame() {
    document.querySelectorAll(".scoreRow").forEach(e => e.remove());
    document.querySelectorAll(".leaderboard").forEach(e => e.remove());
    _gameEndControls.hide();

    while(_scoreEntryRow.children.length > 0)
        _scoreEntryRow.lastElementChild.remove();
    while(_playerNameRow.children.length > 0)
        _playerNameRow.lastElementChild.remove();
    _scoreSubmitBtn.show();

    g_players = [];
    g_round_number = 0;

    _gameTable.hide();
    _gameSetup.show();
}

//beginGame(); ////////////////////////////////////////////////////////////////////////////////
