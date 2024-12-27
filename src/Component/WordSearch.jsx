import React, { useState, useEffect, useRef, useCallback } from "react";
import "./css/WordSearch.css";
import wordsFromData from "./Words.js"; // Import the words from Words.js

// Memoize grid generation to avoid recalculating on every render
const generateGrid = (size, words) => {
  const grid = Array(size)
    .fill(null)
    .map(() => Array(size).fill(""));

  const placeWordInGrid = (word) => {
    const direction = Math.random() > 0.5 ? "horizontal" : "vertical";
    let placed = false;

    while (!placed) {
      const startRow = Math.floor(Math.random() * size);
      const startCol = Math.floor(Math.random() * size);

      if (direction === "horizontal") {
        if (startCol + word.length <= size) {
          let fits = true;
          for (let i = 0; i < word.length; i++) {
            if (
              grid[startRow][startCol + i] !== "" &&
              grid[startRow][startCol + i] !== word[i]
            ) {
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
        if (startRow + word.length <= size) {
          let fits = true;
          for (let i = 0; i < word.length; i++) {
            if (
              grid[startRow + i][startCol] !== "" &&
              grid[startRow + i][startCol] !== word[i]
            ) {
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

  words.forEach((word) => placeWordInGrid(word));

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (grid[row][col] === "") {
        grid[row][col] = String.fromCharCode(
          65 + Math.floor(Math.random() * 26)
        );
      }
    }
  }

  return grid;
};

const getRandomWords = (words, numWords) => {
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, numWords);
};

const WordSearch = () => {
  const gridSize = 10;
  const noOfWords = 1;
  const timerDuration = 120; // Timer duration in seconds
  const [words, setWords] = useState(getRandomWords(wordsFromData, noOfWords));
  const [grid, setGrid] = useState(generateGrid(gridSize, words));
  const [selectedCells, setSelectedCells] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [foundWordCells, setFoundWordCells] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [gameOver, setGameOver] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const gridContainerRef = useRef(null);
  const timerRef = useRef(null);
  const [touchingGrid, setTouchingGrid] = useState(false);

  // Timer logic
  useEffect(() => {
    if (hasStarted && timeLeft > 0 && !gameWon) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 || gameWon) {
      setGameOver(true);
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timeLeft, hasStarted, gameWon]);

  // Check if all words are found
  useEffect(() => {
    if (foundWords.length === words.length) {
      setGameWon(true);
    }
  }, [foundWords, words]);

  // Memoize grid update to avoid unnecessary recalculation
  const updateGrid = useCallback(() => {
    setGrid(generateGrid(gridSize, words));
  }, [words]);

  useEffect(() => {
    updateGrid();
  }, [words, updateGrid]);

  const restartGame = () => {
    const newWords = getRandomWords(wordsFromData, noOfWords); // Get new words
    setWords(newWords); // Update words
    setSelectedCells([]);
    setFoundWords([]);
    setFoundWordCells([]);
    setIsDragging(false);
    setGameWon(false);
    setGameOver(false);
    setTimeLeft(timerDuration); // Reset timer
    setHasStarted(true); // Start the game
  };

  const handleMouseDown = (row, col) => {
    if (!gameOver && hasStarted) {
      setIsDragging(true);
      setSelectedCells([{ row, col }]);
    }
  };

  const handleMouseEnter = (row, col) => {
    if (isDragging && !gameOver && hasStarted) {
      // Avoid adding duplicate cells
      if (!selectedCells.some((cell) => cell.row === row && cell.col === col)) {
        setSelectedCells((prevSelectedCells) => [
          ...prevSelectedCells,
          { row, col },
        ]);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);

    const selectedWord = selectedCells
      .map((cell) => grid[cell.row][cell.col])
      .join("");
    if (words.includes(selectedWord) && !foundWords.includes(selectedWord)) {
      setFoundWords([...foundWords, selectedWord]);
      setFoundWordCells((prevCells) => [...prevCells, ...selectedCells]);
    }
    setSelectedCells([]);
  };

  const isCellSelected = (row, col) => {
    return selectedCells.some((cell) => cell.row === row && cell.col === col);
  };

  // Handle touch start event

// Handle touch start on grid container
const handleTouchStart = useCallback(
  (e) => {
    if (!gameOver && hasStarted && !e.target.closest(".start-button")) {
      e.stopPropagation(); // Prevent bubbling up
      e.preventDefault(); // Prevent page scrolling
      setTouchingGrid(true);

      const touch = e.touches[0];
      const rect = gridContainerRef.current.getBoundingClientRect();

      if (
        touch.clientX >= rect.left &&
        touch.clientX <= rect.right &&
        touch.clientY >= rect.top &&
        touch.clientY <= rect.bottom
      ) {
        const row = Math.floor(
          (touch.clientY - rect.top) / (rect.height / gridSize)
        );
        const col = Math.floor(
          (touch.clientX - rect.left) / (rect.width / gridSize)
        );

        const clampedRow = Math.min(Math.max(row, 0), gridSize - 1);
        const clampedCol = Math.min(Math.max(col, 0), gridSize - 1);

        setIsDragging(true);
        setSelectedCells([{ row: clampedRow, col: clampedCol }]);
      }
    }
  },
  [gameOver, hasStarted]
);

const handleTouchMove = useCallback(
  (e) => {
    if (touchingGrid && isDragging && !gameOver && hasStarted) {
      e.stopPropagation(); // Prevent bubbling up
      e.preventDefault(); // Prevent page scrolling

      const touch = e.touches[0];
      const rect = gridContainerRef.current.getBoundingClientRect();

      if (
        touch.clientX >= rect.left &&
        touch.clientX <= rect.right &&
        touch.clientY >= rect.top &&
        touch.clientY <= rect.bottom
      ) {
        const row = Math.floor(
          (touch.clientY - rect.top) / (rect.height / gridSize)
        );
        const col = Math.floor(
          (touch.clientX - rect.left) / (rect.width / gridSize)
        );

        const clampedRow = Math.min(Math.max(row, 0), gridSize - 1);
        const clampedCol = Math.min(Math.max(col, 0), gridSize - 1);

        const lastSelectedCell = selectedCells[selectedCells.length - 1];
        const rowDiff = Math.abs(clampedRow - lastSelectedCell?.row);
        const colDiff = Math.abs(clampedCol - lastSelectedCell?.col);

        if (rowDiff <= 3 && colDiff <= 3) {
          if (
            !selectedCells.some(
              (cell) => cell.row === clampedRow && cell.col === clampedCol
            )
          ) {
            setSelectedCells((prevSelectedCells) => [
              ...prevSelectedCells,
              { row: clampedRow, col: clampedCol },
            ]);
          }
        }
      }
    }
  },
  [touchingGrid, isDragging, gameOver, hasStarted, selectedCells]
);

// Handle touch end event
const handleTouchEnd = useCallback(() => {
  setIsDragging(false);
  setTouchingGrid(false);

  if (selectedCells.length > 0) {
    const selectedWord = selectedCells
      .map((cell) => grid[cell.row] && grid[cell.row][cell.col])
      .join("");

    if (words.includes(selectedWord) && !foundWords.includes(selectedWord)) {
      setFoundWords((prevFoundWords) => [...prevFoundWords, selectedWord]);
      setFoundWordCells((prevCells) => [...prevCells, ...selectedCells]);
    }
  }

  setSelectedCells([]);
}, [selectedCells, words, foundWords, grid]);


useEffect(() => {
  const container = gridContainerRef.current;
  container.addEventListener("touchstart", handleTouchStart, {
    passive: false,
  });
  container.addEventListener("touchmove", handleTouchMove, { passive: false });
  container.addEventListener("touchend", handleTouchEnd);

  return () => {
    container.removeEventListener("touchstart", handleTouchStart);
    container.removeEventListener("touchmove", handleTouchMove);
    container.removeEventListener("touchend", handleTouchEnd);
  };
}, [handleTouchStart, handleTouchMove, handleTouchEnd]);


  return (
    <div className="backgroud">
    <div className="word-search-container" ref={gridContainerRef}>
      {!hasStarted ? (
        <div className="start-screen">
          <h1>Welcome to Word Search!</h1>
          <button onClick={restartGame} onTouchStart={(e) => e.stopPropagation()} className="start-button">
            Start Game
          </button>
        </div>
      ) : (
        <>
          <div className="controls">
            <button onClick={restartGame} className="restart-button">
              Restart Game
            </button>
            <label>
              <h3>Find below words:</h3>
              <span>{words.join(", ")}</span>
            </label>
            <div className="timer">
              Time Left: <b>{timeLeft} seconds</b>
            </div>
          </div>
          <div
            ref={gridContainerRef}
            className="grid"
            onMouseDown={(e) => e.preventDefault()}
          >
            {grid.map((row, rowIndex) => (
              <div className="grid-row" key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <div
                    key={colIndex}
                    className={`grid-cell ${
                      isCellSelected(rowIndex, colIndex) ? "selected" : ""
                    } ${
                      foundWordCells.some(
                        (cell) => cell.row === rowIndex && cell.col === colIndex
                      )
                        ? "found"
                        : ""
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

          {gameWon && (
            <div className="win-popup">
              <span role="img" aria-label="thumbs-up">
                👍
              </span>
              <p>Great, You found all the words!</p>
            </div>
          )}
          {gameOver && !gameWon && (
            <div className="win-popup">
              <span role="img" aria-label="stop">
                ⏰
              </span>
              <p>Time's up! Game Over.</p>
            </div>
          )}

          <div className="found-words-left">
            <h4>Found Words</h4>
            <ul className="word-list">
              {words.map((word, index) => (
                <li
                  key={index}
                  className={`word ${foundWords.includes(word) ? "found" : ""}`}
                >
                  {word}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
    </div>
  );
};

export default WordSearch;
