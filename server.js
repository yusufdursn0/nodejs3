const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const words = require('./words');

const app = express();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

mongoose.connect('mongodb://localhost:27017/hangmanLeaderboard');


const scoreSchema = new mongoose.Schema({ username: String, score: Number });

const Score = mongoose.model('Score', scoreSchema);

let guessedLetters = [];
let selectedWord = '';


function getRandomWord(difficulty) {
    const list = words[difficulty];
    return list[Math.floor(Math.random() * list.length)].toLowerCase();
}

app.get('/', (req, res) => {
    res.sendFile(path.join('public', 'index.html'));
});

app.post('/guess', async (req, res) => {
    const letter = req.body.letter ? req.body.letter.toLowerCase() : null;
    const player = req.body.username;
    const difficulty = req.body.difficulty;

    if (!selectedWord) {
        selectedWord = getRandomWord(difficulty);
        guessedLetters = [];
        if (difficulty === 'easy') remainingLives = 5;
        else if (difficulty === 'medium') remainingLives = 7;
        else if (difficulty === 'hard') remainingLives = 9;
    }

    if (letter)
        if (!guessedLetters.includes(letter)) {
            guessedLetters.push(letter);
            if (!selectedWord.includes(letter)) {
                remainingLives--;
            }
        }



    const display = selectedWord
        .split('')
        .map(ch => guessedLetters.includes(ch) ? ch : '_')
        .join(' ');

    if (remainingLives <= 0) {
        const lostWord = selectedWord;
        guessedLetters = [];
        selectedWord = '';
        return res.send(`<p>You lost! The word was: <strong>${lostWord}</strong></p><a href="/">Start over</a>`);
    }

    if (!display.includes('_')) {
        const score = 100 * remainingLives;
        await new Score({ username: player, score }).save();
        guessedLetters = [];
        selectedWord = '';
        return res.send(`<p>Congratulations! Your score: <strong>${score}</strong></p><a href="/">Play again</a>`);
    }

    res.send(`
    <p>Word: ${display}</p>
    <p>Remaining lives: ${remainingLives}</p>
    <form method="POST" action="/guess">
      <input type="hidden" name="username" value="${player}" />
      <input type="hidden" name="difficulty" value="${difficulty}" />
      <input type="text" name="letter" maxlength="1" required autofocus />
      <button>Guess</button>
    </form>
  `);
});

app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
