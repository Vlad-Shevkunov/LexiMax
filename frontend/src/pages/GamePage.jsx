import { useState, useEffect, useRef } from "react";
import { startGameAPI, endGameAPI } from "../services/api";

function GamePage() {
  // --------------------- State for the Word Queue & Current Index
  const [wordQueue, setWordQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // --------------------- Results & Feedback
  const [gameResults, setGameResults] = useState([]);
  const [isCorrect, setIsCorrect] = useState(null);

  // --------------------- Inputs & Refs
  const [articleInput, setArticleInput] = useState("");
  const [mainWordInput, setMainWordInput] = useState("");
  const articleRef = useRef(null);
  const mainWordRef = useRef(null);

  // --------------------- Per-word Timing
  const [wordStartTime, setWordStartTime] = useState(null);

  // --------------------- Game Flow
  const [gameOver, setGameOver] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // --------------------- Overall Timer
  const [startTime, setStartTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // --------------------- Settings
  const [timeLimit, setTimeLimit] = useState(300);
  const [gameType, setGameType] = useState("frenchToEnglish"); // "frenchToEnglish","englishToFrench","both"
  const [ungraded, setUngraded] = useState(false);  // real-time checking
  const [zenMode, setZenMode] = useState(false);

  // --------------------- Score
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);

  // --------------------- Final Summaries
  const [finalScore, setFinalScore] = useState(null);
  const [finalAttempts, setFinalAttempts] = useState(null);
  const [finalResults, setFinalResults] = useState(null);

  // ─────────────────────────────────────────────────────────────────────────
  // 1) Timer Effect for overall game
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!startTime || gameOver) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(timeLimit - elapsed, 0);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        handleEndGame();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, gameOver, timeLimit]);

  // ─────────────────────────────────────────────────────────────────────────
  // 2) Start Game
  // ─────────────────────────────────────────────────────────────────────────
  const handleStartGame = async () => {
    try {
      const response = await startGameAPI(timeLimit);
      if (!response.words || response.words.length === 0) {
        console.warn("No words returned from API!");
        return;
      }

      // Decide direction per word if "both"
      const wordsWithMode = response.words.map((w) => {
        let mode = gameType;
        if (gameType === "both") {
          mode = Math.random() < 0.5 ? "frenchToEnglish" : "englishToFrench";
        }
        return { ...w, mode };
      });

      setWordQueue(wordsWithMode);
      setCurrentIndex(0);
      setGameResults([]);
      setGameOver(false);
      setShowSummary(false);
      setCorrectAnswers(0);
      setTotalAttempts(0);
      setIsCorrect(null);

      // Start overall timer
      setStartTime(Date.now());
      // Clear inputs
      setArticleInput("");
      setMainWordInput("");
      // Start time for the first word
      setWordStartTime(Date.now());
    } catch (error) {
      console.error("Error starting game:", error);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 3) Helper: remove bracketed hints, e.g. "[some hint]"
  // ─────────────────────────────────────────────────────────────────────────
  const stripHints = (text) => {
    return text.replace(/\[.*?\]/g, "").trim();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 4) Current Word & "getCurrentWord()" building `prompt` & `expected`
  // ─────────────────────────────────────────────────────────────────────────
  const getCurrentWord = () => {
    const baseItem = wordQueue[currentIndex];
    if (!baseItem) return null;

    let prompt = "";
    let expected = [];

    if (baseItem.mode === "frenchToEnglish") {
      // The user sees the French => set the French as 'prompt'
      // The user must type an English translation
      prompt = baseItem.word;

      // We want to ignore brackets from the translations
      // so we do stripHints on each
      if (baseItem.translations && baseItem.translations.length > 0) {
        expected = baseItem.translations.map((t) => stripHints(t).toLowerCase());
      } else {
        expected = [];
      }
    } else {
      // englishToFrench
      // We'll pick a random English translation as the prompt
      // also remove bracket from the prompt so user doesn't see the bracket text
      if (baseItem.translations && baseItem.translations.length > 0) {
        const randomTranslation = baseItem.translations[
          Math.floor(Math.random() * baseItem.translations.length)
        ];
        prompt = randomTranslation;
      } else {
        prompt = "(no translations??)";
      }

      // If the item has an article
      if (baseItem.article && baseItem.article !== "none") {
        expected = [
          `${baseItem.article} ${baseItem.word}`.toLowerCase()
        ];
      } else {
        expected = [baseItem.word.toLowerCase()];
      }
    }

    return {
      ...baseItem,
      prompt,
      expected
    };
  };

  // Focus logic
  useEffect(() => {
    const w = getCurrentWord();
    if (!w || gameOver) return;

    // If english->french & has article => focus articleRef
    if (w.mode === "englishToFrench" && w.article !== "none") {
      articleRef.current?.focus();
    } else {
      mainWordRef.current?.focus();
    }

    setWordStartTime(Date.now());
  }, [currentIndex, wordQueue, gameOver]);

  // ─────────────────────────────────────────────────────────────────────────
  // 5) "Submit" for Graded Mode
  // ─────────────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (ungraded) return; // no manual submit in ungraded
    processAttempt();
  };

  const processAttempt = () => {
    const w = getCurrentWord();
    if (!w) return;

    const spentSeconds = Math.floor((Date.now() - (wordStartTime || Date.now())) / 1000);

    let userFullAnswer = "";
    if (w.mode === "englishToFrench") {
      if (w.article === "none") {
        userFullAnswer = mainWordInput.trim().toLowerCase();
      } else {
        userFullAnswer = (articleInput.trim() + " " + mainWordInput.trim()).toLowerCase();
      }
    } else {
      // frenchToEnglish
      userFullAnswer = mainWordInput.trim().toLowerCase();
    }

    const answeredCorrectly = w.expected.includes(userFullAnswer);

    setGameResults((prev) => [
      ...prev,
      {
        word_id: w.id,
        word: w.prompt,
        correct_answer: w.expected.join(", "),
        user_answer: userFullAnswer,
        correct: answeredCorrectly,
        timeSpent: spentSeconds
      },
    ]);

    setTotalAttempts((p) => p + 1);
    if (answeredCorrectly) setCorrectAnswers((p) => p + 1);
    setIsCorrect(answeredCorrectly);

    // Clear
    setArticleInput("");
    setMainWordInput("");

    // Next
    setTimeout(() => {
      const nextIndex = currentIndex + 1;
      if (nextIndex < wordQueue.length) {
        setCurrentIndex(nextIndex);
      } else {
        handleEndGame();
      }
    }, 0);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 6) Ungraded Real-Time Checking
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ungraded || gameOver) return;

    const w = getCurrentWord();
    if (!w) return;

    let userFullAnswer = "";
    if (w.mode === "englishToFrench") {
      if (w.article === "none") {
        userFullAnswer = mainWordInput.trim().toLowerCase();
      } else {
        userFullAnswer = (articleInput.trim() + " " + mainWordInput.trim()).toLowerCase();
      }
    } else {
      userFullAnswer = mainWordInput.trim().toLowerCase();
    }

    const answeredCorrectly = w.expected.includes(userFullAnswer);
    if (answeredCorrectly) {
      const spentSeconds = Math.floor((Date.now() - (wordStartTime || Date.now())) / 1000);

      setGameResults((prev) => [
        ...prev,
        {
          word_id: w.id,
          word: w.prompt,
          correct_answer: w.expected.join(", "),
          user_answer: userFullAnswer,
          correct: true,
          timeSpent: spentSeconds
        },
      ]);

      setTotalAttempts((p) => p + 1);
      setCorrectAnswers((p) => p + 1);
      setIsCorrect(true);

      // Clear
      setArticleInput("");
      setMainWordInput("");

      // Next
      const nextIndex = currentIndex + 1;
      if (nextIndex < wordQueue.length) {
        setCurrentIndex(nextIndex);
      } else {
        handleEndGame();
      }
    } else {
      // For ungraded, we do NOT show "wrong" message => setIsCorrect(false) anyway
      // but will hide in the UI
      setIsCorrect(false);
    }
  }, [articleInput, mainWordInput, ungraded, currentIndex, wordQueue, gameOver]);

  // ─────────────────────────────────────────────────────────────────────────
  // 7) End Game
  // ─────────────────────────────────────────────────────────────────────────
  const handleEndGame = () => {
    setGameOver(true);
    setShowSummary(true);

    setGameResults((prev) => {
      const attempts = prev.length;
      const correct = prev.filter((r) => r.correct).length;

      setFinalAttempts(attempts);
      setFinalScore(correct);
      setFinalResults(prev);
      return prev;
    });
  };

  // endGameAPI call
  useEffect(() => {
    if (gameOver && finalScore !== null && finalAttempts !== null && finalResults !== null) {
      endGameAPI(timeLimit, gameType, zenMode, finalResults, finalAttempts, finalScore, ungraded);
    }
  }, [gameOver, finalScore, finalAttempts, finalResults, timeLimit, gameType, zenMode, ungraded]);

  // ─────────────────────────────────────────────────────────────────────────
  // 8) Summary: Mistakes or Longest Time
  // ─────────────────────────────────────────────────────────────────────────
  const renderCelebration = () => (
    <div className="text-center flex flex-col items-center mt-6">
      <h2 className="text-4xl font-bold text-green-500 animate-bounce flex items-center gap-3">
        🎉 <span>Congratulations!</span> 🎉
      </h2>
      <p className="text-lg mt-4">You got a perfect score!</p>
    </div>
  );

  const renderMistakesTable = () => {
    const mistakes = gameResults.filter((r) => !r.correct);
    if (mistakes.length === 0) return null;

    return (
      <div className="mt-6">
        <h2 className="text-2xl font-semibold text-red-500">Mistakes</h2>
        <table className="w-full mt-2 border border-gray-500">
          <thead>
            <tr className="bg-gray-800">
              <th className="p-2 border border-gray-600">Word</th>
              <th className="p-2 border border-gray-600">Your Answer</th>
              <th className="p-2 border border-gray-600">Correct Answer</th>
            </tr>
          </thead>
          <tbody>
            {mistakes.map((m, i) => (
              <tr key={i} className="bg-gray-700 text-center">
                <td className="p-2 border border-gray-600">{m.word}</td>
                <td className="p-2 border border-gray-600 text-red-500">{m.user_answer}</td>
                <td className="p-2 border border-gray-600 text-green-400">{m.correct_answer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderLongestTimeTable = () => {
    const sorted = [...gameResults].sort((a, b) => b.timeSpent - a.timeSpent);
    const top10 = sorted.slice(0, 10);
    if (top10.length === 0) return null;

    return (
      <div className="mt-6">
        <h2 className="text-2xl font-semibold text-blue-400">Longest Time Spent</h2>
        <table className="w-full mt-2 border border-gray-500">
          <thead>
            <tr className="bg-gray-800">
              <th className="p-2 border border-gray-600">Word</th>
              <th className="p-2 border border-gray-600">Your Answer</th>
              <th className="p-2 border border-gray-600">Correct?</th>
              <th className="p-2 border border-gray-600">Time (s)</th>
            </tr>
          </thead>
          <tbody>
            {top10.map((r, i) => (
              <tr key={i} className="bg-gray-700 text-center">
                <td className="p-2 border border-gray-600">{r.word}</td>
                <td className="p-2 border border-gray-600">{r.user_answer}</td>
                <td className="p-2 border border-gray-600">{r.correct ? "✅" : "❌"}</td>
                <td className="p-2 border border-gray-600 text-yellow-400">{r.timeSpent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // If summary is visible
  if (showSummary) {
    const accuracy = totalAttempts > 0
      ? ((correctAnswers / totalAttempts) * 100).toFixed(2)
      : 0;

    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white">
        <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-3xl font-semibold">Game Summary</h1>

          {ungraded
            ? renderLongestTimeTable()
            : (accuracy === "100.00" ? renderCelebration() : renderMistakesTable())
          }

          <div className="mt-6">
            <p className="text-lg">Total Attempts: <strong>{totalAttempts}</strong></p>
            <p className="text-lg">Correct Answers: <strong>{correctAnswers}</strong></p>
            <p className="text-lg">Accuracy: <strong>{accuracy}%</strong></p>
          </div>

          <button
            className="mt-6 px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold text-lg w-full"
            onClick={handleStartGame}
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  // If not started => show settings
  if (!startTime) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white">
        <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-3xl font-bold mb-6 text-center">Game Settings</h1>

          {/* Time Limit */}
          <label className="block text-left mb-4">
            <span className="font-medium block mb-1">Time Limit (Seconds):</span>
            <select
              className="p-2 rounded bg-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={timeLimit}
              onChange={(e) => setTimeLimit(parseInt(e.target.value))}
            >
              <option value={120}>2 min</option>
              <option value={300}>5 min</option>
            </select>
          </label>

          {/* Game Type */}
          <label className="block text-left mb-4">
            <span className="font-medium block mb-1">Game Type:</span>
            <select
              className="p-2 rounded bg-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={gameType}
              onChange={(e) => setGameType(e.target.value)}
            >
              <option value="frenchToEnglish">French → English</option>
              <option value="englishToFrench">English → French</option>
              <option value="both">Both</option>
            </select>
          </label>

          {/* Ungraded check */}
          <label className="flex items-center justify-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={ungraded}
              onChange={() => setUngraded(!ungraded)}
              className="w-4 h-4 text-blue-500"
            />
            <span className="font-medium">Ungraded (Real-Time Checking)?</span>
          </label>

          {/* Zen Mode */}
          <label className="flex items-center justify-center gap-2 mb-6">
            <input
              type="checkbox"
              checked={zenMode}
              onChange={() => setZenMode(!zenMode)}
              className="w-4 h-4 text-blue-500"
            />
            <span className="font-medium">Zen Mode (Hide Timer &amp; Score)</span>
          </label>

          <button
            className="w-full px-5 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold text-lg transition-colors duration-150"
            onClick={handleStartGame}
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 9) Main Game Screen
  // ─────────────────────────────────────────────────────────────────────────
  const currentWord = getCurrentWord();
  if (!currentWord) {
    return <div className="text-white">No more words available.</div>;
  }

  const isUngradedMode = ungraded;

  // *** WRAP the inputs + button in a single FORM *** so pressing Enter works in graded mode
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white">
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <h1 className="text-3xl font-semibold mb-4">Translate This Word:</h1>
        <h2 className="text-4xl font-bold mb-6">{currentWord.prompt}</h2>

        <form onSubmit={handleSubmit}>
          {/* If englishToFrench & article != none => side by side */}
          {currentWord.mode === "englishToFrench" && currentWord.article !== "none" ? (
            <div className="flex items-center justify-center gap-2 mb-4">
              <input
                ref={articleRef}
                type="text"
                placeholder="Article"
                value={articleInput}
                onChange={(e) => setArticleInput(e.target.value)}
                onKeyDown={(e) => {
                  // pressing space focuses main word
                  if (e.key === " ") {
                    e.preventDefault();
                    mainWordRef.current?.focus();
                  }
                }}
                className="
                  p-3 text-black bg-white rounded-md
                  w-20 text-center border border-gray-500
                "
              />
              <input
                ref={mainWordRef}
                type="text"
                placeholder="Main Word"
                value={mainWordInput}
                onChange={(e) => setMainWordInput(e.target.value)}
                className="
                  p-3 text-black bg-white rounded-md
                  w-48 text-center border border-gray-500
                "
              />
            </div>
          ) : (
            // single input
            <div className="mb-4 flex justify-center">
              <input
                ref={mainWordRef}
                type="text"
                placeholder="Type your answer..."
                value={mainWordInput}
                onChange={(e) => setMainWordInput(e.target.value)}
                className="
                  p-3 text-black bg-white rounded-md
                  w-72 text-center border border-gray-500
                "
              />
            </div>
          )}

          {/* If not ungraded => show Submit Button, letting user press Enter or click */}
          {!isUngradedMode && (
            <button
              type="submit"
              className="
                px-5 py-2 bg-blue-500 hover:bg-blue-600
                rounded-lg text-white font-semibold text-lg
              "
            >
              Submit
            </button>
          )}
        </form>

        {/* Real-time feedback if ungraded => we skip the "Wrong... keep typing" */}
        {/* So only show messages in graded mode */}
        {!ungraded && isCorrect !== null && (
          <p
            className={`mt-4 text-lg font-bold ${
              isCorrect ? "text-green-500" : "text-red-500"
            }`}
          >
            {isCorrect ? "Correct!" : "Wrong!"}
          </p>
        )}

        {/* If ungraded => no messages appear */}

        {!zenMode && (
          <div className="mt-4">
            <p className="text-sm">Time Left: {timeRemaining}s</p>
            <p className="text-sm">
              Accuracy:{" "}
              {totalAttempts > 0
                ? ((correctAnswers / totalAttempts) * 100).toFixed(2)
                : 0}
              %
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default GamePage;
