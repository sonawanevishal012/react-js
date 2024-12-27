import React, { useState, useEffect } from "react";
import "../Connections/Connection.css";

// Sample words categorized by topics
const topics = {
  animals: ["Dog", "Cat", "Cow", "Fish"],
  fruits: ["Apple", "Banana", "Peach", "Grape"],
  countries: ["India", "China", "USA", "Italy"],
};

// Function to generate a 4x4 grid and place words randomly
const generateGrid = (gridSize, topicWords) => {
  const grid = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(""));

  const placeWordInGrid = (word) => {
    const direction = Math.random() > 0.5 ? "horizontal" : "vertical";
    let placed = false;

    while (!placed) {
      const startRow = Math.floor(Math.random() * gridSize);
      const startCol = Math.floor(Math.random() * gridSize);

      if (direction === "horizontal") {
        if (startCol + word.length <= gridSize) {
          let fits = true;
          for (let i = 0; i < word.length; i++) {
            if (grid[startRow][startCol + i] !== "") {
              fits = false;
              break;
            }
          }
          if (fits) {
            for (let i = 0; i < word.length; i++) {
              grid[startRow][startCol + i] = word[i];
            }
            placed = true;
          }
        }
      } else {
        if (startRow + word.length <= gridSize) {
          let fits = true;
          for (let i = 0; i < word.length; i++) {
            if (grid[startRow + i][startCol] !== "") {
              fits = false;
              break;
            }
          }
          if (fits) {
            for (let i = 0; i < word.length; i++) {
              grid[startRow + i][startCol] = word[i];
            }
            placed = true;
          }
        }
      }
    }
  };

  topicWords.forEach((word) => placeWordInGrid(word));

  // Fill the remaining spaces with random letters
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (grid[row][col] === "") {
        grid[row][col] = String.fromCharCode(
          65 + Math.floor(Math.random() * 26)
        ); // Random uppercase letters
      }
    }
  }

  return grid;
};

const getRandomWords = (words, numWords) => {
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, numWords);
};

const Game = () => {
  const gridSize = 4;
  const [selectedCells, setSelectedCells] = useState([]);
  const [message, setMessage] = useState("");
  const [grid, setGrid] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Initialize the game
  useEffect(() => {
    if (hasStarted) {
      const topicKeys = Object.keys(topics);
      const randomTopicKey = topicKeys[Math.floor(Math.random() * topicKeys.length)];
      setSelectedTopic(randomTopicKey);
      const words = getRandomWords(topics[randomTopicKey], 4); // Select 4 random words from the topic
      setGrid(generateGrid(gridSize, words));
    }
  }, [hasStarted]);

  const restartGame = () => {
    setHasStarted(true);
    setMessage("");
    setGameOver(false);
    setSelectedCells([]);
  };

  const handleMouseDown = (row, col) => {
    if (gameOver) return;
    setSelectedCells([{ row, col }]);
  };

  const handleMouseEnter = (row, col) => {
    if (selectedCells.length > 0 && !gameOver) {
      const lastCell = selectedCells[selectedCells.length - 1];
      const rowDiff = Math.abs(lastCell.row - row);
      const colDiff = Math.abs(lastCell.col - col);

      // Only allow selecting adjacent cells
      if (rowDiff <= 1 && colDiff <= 1) {
        setSelectedCells((prevCells) => [
          ...prevCells,
          { row, col },
        ]);
      }
    }
  };

  const handleMouseUp = () => {
    if (gameOver) return;
    const selectedWord = selectedCells
      .map((cell) => grid[cell.row][cell.col])
      .join("");

    if (selectedWord.toLowerCase() === selectedTopic.toLowerCase()) {
      setMessage(`Great job! You found all ${selectedTopic} words!`);
    } else {
      setMessage("Oops! Try again.");
    }
    setGameOver(true);
    setSelectedCells([]);
  };

  const isCellSelected = (row, col) => {
    return selectedCells.some((cell) => cell.row === row && cell.col === col);
  };

  return (
    <div className="game-container">
      <h1>Word Connection Game</h1>
      {!hasStarted ? (
        <div className="start-screen">
          <button onClick={restartGame}>Start Game</button>
        </div>
      ) : (
        <>
          <div className="controls">
            <h3>Selected Topic: {selectedTopic}</h3>
            <h4>Find the words related to {selectedTopic}</h4>
          </div>
          <div className="grid">
            {grid.map((row, rowIndex) => (
              <div className="grid-row" key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <div
                    key={colIndex}
                    className={`grid-cell ${
                      isCellSelected(rowIndex, colIndex) ? "selected" : ""
                    }`}
                    onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                    onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                    onMouseUp={handleMouseUp}
                  >
                    {cell}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="message">
            <p>{message}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default Game;

