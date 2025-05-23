import { useState, useEffect } from "react";
import { startConjugationGameAPI, endConjugationGameAPI, getSettings } from "../services/api";
import { toast } from "react-toastify";


// utility: generate a map { tenseString → colorString }
function generateTenseColors(tenses) {
  return tenses.reduce((map, tense, i) => {
    const hue = (i * 137.508) % 360;               // evenly distribute around the wheel
    map[tense] = `hsl(${hue.toFixed(1)}, 70%, 50%)`; // you can tweak S/L to taste
    return map;
  }, {});
}

function ConjugationGamePage() {
  // -------------------------------------
  // Conjugation Queue & Results
  const [conjugationQueue, setConjugationQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gameResults, setGameResults] = useState([]); 
  const [isCorrect, setIsCorrect] = useState(null);

  // Score & Flow
  const [gameOver, setGameOver] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);

  // Summaries 
  const [finalScore, setFinalScore] = useState(null);
  const [finalAttempts, setFinalAttempts] = useState(null);
  const [finalResults, setFinalResults] = useState(null);

  // Timer
  const [startTime, setStartTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Track time spent per item
  const [itemStartTime, setItemStartTime] = useState(null);

  // Input
  const [userInput, setUserInput] = useState("");

  // Basic Settings
  const [timeLimit, setTimeLimit] = useState(300);
  const [gameMode, setGameMode] = useState("both");  
  const [zenMode, setZenMode] = useState(false);
  const [ungraded, setUngraded] = useState(false);

  // Advanced
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedTenses, setSelectedTenses] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([1, 2, 3]);
  const [pronominalChoice, setPronominalChoice] = useState("both");

    // — what the user saved in their settings:
  const [availableTenses,    setAvailableTenses]    = useState([]);
  const [availableGroups,    setAvailableGroups]    = useState([]);
  const [allowPronominal,    setAllowPronominal]    = useState(true);
  const [allowIrregular,     setAllowIrregular]     = useState(true);

  // For color-coded tenses
  const [tenseColors, setTenseColors] = useState({});

  // Toggle advanced
  const handleToggleAdvanced = () => {
    setShowAdvanced(!showAdvanced);
  };

  const handleTenseToggle = (tense) => {
    if (selectedTenses.includes(tense)) {
      setSelectedTenses(selectedTenses.filter((t) => t !== tense));
    } else {
      setSelectedTenses([...selectedTenses, tense]);
    }
  };

  const handleGroupToggle = (grp) => {
    if (selectedGroups.includes(grp)) {
      setSelectedGroups(selectedGroups.filter((g) => g !== grp));
    } else {
      setSelectedGroups([...selectedGroups, grp]);
    }
  };

    // ── load the user’s conjugation‐settings ──
  useEffect(() => {
    getSettings()
      .then(s => {
        const c = s.conj || {};
        setAvailableTenses(   c.tenses        || [] );
        setAvailableGroups(   c.groups        || [] );
        setAllowPronominal(   c.allowPronominal );
        setAllowIrregular(    c.allowIrregular  );
        // and default the “selected” filters to *all* available:
        setSelectedTenses(    c.tenses        || [] );
        setSelectedGroups(    c.groups        || [] );
        // if they disallowed pronominal, force exclude:
        setPronominalChoice( c.allowPronominal ? "both" : "exclude" );
        // if they disallowed irregular, force “regular”:
        setGameMode(         c.allowIrregular  ? "both" : "regular" );
      })
      .catch(console.error);
  }, []);


  // -------------------------------------
  // Timer effect
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

  useEffect(() => {
    if (availableTenses.length) {
      setTenseColors(generateTenseColors(availableTenses));
    }
  }, [availableTenses]);
  // -------------------------------------
  // Start Game
  const handleStartGame = async () => {
    try {
      const response = await startConjugationGameAPI(
        timeLimit,
        gameMode,
        selectedTenses,
        selectedGroups,
        pronominalChoice
      );
      console.log("startConjugationGameAPI response:", response);

      if (!response.conjugations || response.conjugations.length === 0) {
        toast.error("No valid conjugations returned, try different settings!")
        console.warn("No conjugations returned!");
        return;
      }

      // Setup queue
      setConjugationQueue(response.conjugations);
      setCurrentIndex(0);
      setGameResults([]);
      setIsCorrect(null);
      setShowSummary(false);
      setGameOver(false);
      setCorrectAnswers(0);
      setTotalAttempts(0);

      setStartTime(Date.now());
      setItemStartTime(Date.now());
      setUserInput("");
    } catch (error) {
      console.error("Error starting conj game:", error);
    }
  };

  // -------------------------------------
  // getCurrentConjugation
  const getCurrentConjugation = () => {
    return conjugationQueue[currentIndex] || null;
  };

  // -------------------------------------
  // handleSubmit => graded
  const handleSubmit = (e) => {
    e.preventDefault();
    if (ungraded) return; // ungraded doesn't use form submit
    processAttempt();
  };

  const processAttempt = () => {
    const item = getCurrentConjugation();
    if (!item) return;

    const userAnswer = userInput.trim().toLowerCase();
    const correctAnswer = (item.conjugation || "").toLowerCase();
    const answeredCorrectly = userAnswer === correctAnswer;

    const spentSeconds = Math.floor((Date.now() - (itemStartTime || Date.now())) / 1000);

    const resultObj = {
      id: item.id,
      verb: item.verb,
      person: item.person,
      tense: item.tense,
      user_answer: userInput,
      correct_answer: item.conjugation,
      correct: answeredCorrectly,
      timeSpent: spentSeconds,
    };

    setGameResults((prev) => [...prev, resultObj]);
    setTotalAttempts((p) => p + 1);
    if (answeredCorrectly) setCorrectAnswers((p) => p + 1);

    setIsCorrect(answeredCorrectly);
    setUserInput("");

    // Next item or end
    setTimeout(() => {
      const nextIndex = currentIndex + 1;
      if (nextIndex < conjugationQueue.length) {
        setCurrentIndex(nextIndex);
        setItemStartTime(Date.now());
      } else {
        handleEndGame();
      }
    }, 0);
  };

  // -------------------------------------
  // Ungraded => Real-time checking
  useEffect(() => {
    if (!ungraded || gameOver) return;

    const item = getCurrentConjugation();
    if (!item) return;

    const userAnswer = userInput.trim().toLowerCase();
    const correctAnswer = (item.conjugation || "").toLowerCase();
    const answeredCorrectly = userAnswer === correctAnswer;

    if (answeredCorrectly) {
      const spentSeconds = Math.floor((Date.now() - (itemStartTime || Date.now())) / 1000);

      const resultObj = {
        id: item.id,
        verb: item.verb,
        person: item.person,
        tense: item.tense,
        user_answer: userInput,
        correct_answer: item.conjugation,
        correct: true,
        timeSpent: spentSeconds,
      };

      setGameResults((prev) => [...prev, resultObj]);
      setTotalAttempts((p) => p + 1);
      setCorrectAnswers((p) => p + 1);
      setIsCorrect(true);
      setUserInput("");

      const nextIndex = currentIndex + 1;
      if (nextIndex < conjugationQueue.length) {
        setCurrentIndex(nextIndex);
        setItemStartTime(Date.now());
      } else {
        handleEndGame();
      }
    } else {
      // no "Wrong!" for ungraded
      setIsCorrect(false);
    }
  }, [ungraded, userInput, gameOver, currentIndex]);

  // -------------------------------------
  // End
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

  // Send results once fully computed
  useEffect(() => {
    if (gameOver && finalScore !== null && finalAttempts !== null && finalResults !== null) {
      endConjugationGameAPI(
        timeLimit,
        gameMode,
        zenMode,
        ungraded,
        selectedTenses,
        selectedGroups,
        pronominalChoice,
        finalResults,
        finalAttempts,
        finalScore
      ).then(() => console.log("Conjugation game ended successfully"))
        .catch((err) => console.error("Error ending conj game:", err));
    }
  }, [
    gameOver,
    finalScore,
    finalAttempts,
    finalResults,
    timeLimit,
    gameMode,
    zenMode,
    ungraded,
    selectedTenses,
    selectedGroups,
    pronominalChoice
  ]);

  // Celebration for 100% 
  const renderCelebration = () => (
    <div className="text-center flex flex-col items-center mt-6">
      <h2 className="text-4xl font-bold text-green-500 animate-bounce flex items-center gap-3">
        🎉 <span>Congratulations!</span> 🎉
      </h2>
      <p className="text-lg mt-4">You got a perfect score!</p>
    </div>
  );

  // Mistakes table
  const renderMistakesTable = () => {
    const mistakes = gameResults.filter((r) => !r.correct);
    if (mistakes.length === 0) return null;

    return (
      <div className="mt-6">
        <h2 className="text-2xl font-semibold text-red-500">Mistakes</h2>
        <table className="w-full mt-2 border border-gray-500">
          <thead>
            <tr className="bg-gray-800">
              <th className="p-2 border border-gray-600">Verb</th>
              <th className="p-2 border border-gray-600">Tense</th>
              <th className="p-2 border border-gray-600">Person</th>
              <th className="p-2 border border-gray-600">Your Answer</th>
              <th className="p-2 border border-gray-600">Correct</th>
            </tr>
          </thead>
          <tbody>
            {mistakes.map((m, i) => (
              <tr key={i} className="text-center bg-gray-700">
                <td className="p-2 border border-gray-600">{m.verb}</td>
                <td className="p-2 border border-gray-600">{m.tense}</td>
                <td className="p-2 border border-gray-600">{m.person}</td>
                <td className="p-2 border border-gray-600 text-red-500">{m.user_answer}</td>
                <td className="p-2 border border-gray-600 text-green-400">{m.correct_answer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Longest Time table if ungraded
  const renderLongestTimeTable = () => {
    const sorted = [...gameResults].sort((a, b) => (b.timeSpent || 0) - (a.timeSpent || 0));
    const top10 = sorted.slice(0, 10);
    if (top10.length === 0) return null;

    return (
      <div className="mt-6">
        <h2 className="text-2xl font-semibold text-blue-400">Longest Time Spent</h2>
        <table className="w-full mt-2 border border-gray-500">
          <thead>
            <tr className="bg-gray-800">
              <th className="p-2 border border-gray-600">Verb</th>
              <th className="p-2 border border-gray-600">Tense</th>
              <th className="p-2 border border-gray-600">Person</th>
              <th className="p-2 border border-gray-600">Your Answer</th>
              <th className="p-2 border border-gray-600">Time(s)</th>
            </tr>
          </thead>
          <tbody>
            {top10.map((m, i) => (
              <tr key={i} className="text-center bg-gray-700">
                <td className="p-2 border border-gray-600">{m.verb}</td>
                <td className="p-2 border border-gray-600">{m.tense}</td>
                <td className="p-2 border border-gray-600">{m.person}</td>
                <td className="p-2 border border-gray-600">{m.user_answer}</td>
                <td className="p-2 border border-gray-600 text-yellow-400">{m.timeSpent || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Show Summary 
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

          <div className="mt-6 flex gap-4">
            {/* 1) Same settings */}
            <button
              className="flex-1 px-5 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold"
              onClick={() => {
                // reset only game state—but keep settings in place:
                handleStartGame();
              }}
            >
              ▶️ Play Again With Same Settings
            </button>

            {/* 2) Different settings */}
            <button
              className="flex-1 px-5 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold"
              onClick={() => {
                setStartTime(null);
                setShowSummary(false);
                setConjugationQueue([]);
                setCurrentIndex(0);
              }}
            >
              ⚙️ Play With Different Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If not started => settings
  if (!startTime) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white">
        <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-3xl font-bold mb-6 text-center">Conjugation Game Settings</h1>

          {/* Time Limit */}
          <label className="block text-left mb-4">
            <span className="font-medium block mb-1">Time Limit (Minutes):</span>
            <select
              className="p-2 rounded bg-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={timeLimit}
              onChange={(e) => setTimeLimit(parseInt(e.target.value))}
            >
              <option value={120}>2 min</option>
              <option value={300}>5 min</option>
            </select>
          </label>

          {/* Regular/Irregular/Both */}
          { allowIrregular &&(
            <label className="block text-left mb-4">
              <span className="font-medium block mb-1">Game Mode (Regular/Irregular):</span>
              <select
                className="p-2 rounded bg-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={gameMode}
                onChange={(e) => setGameMode(e.target.value)}
              >
                <option value="regular">Regular</option>
                <option value="irregular">Irregular</option>
                <option value="both">Both</option>
              </select>
            </label>
          )}

          {/* Ungraded */}
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
          <label className="flex items-center justify-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={zenMode}
              onChange={() => setZenMode(!zenMode)}
              className="w-4 h-4 text-blue-500"
            />
            <span className="font-medium">Zen Mode (Hide Timer & Score)</span>
          </label>

          {/* ADVANCED OPTIONS */}
          <div className="mb-6">
            <button
                onClick={handleToggleAdvanced}
                className="w-full text-left mb-4 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded transition"
              >
                Advanced Settings {showAdvanced ? "▾" : "▸"}
            </button>
            {showAdvanced && (
              <>
                <div className="mb-6 p-4 bg-gray-800 rounded space-y-3">
                  <p className="font-medium">Tenses to Include:</p>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto">
                    {availableTenses.map((t) => (
                      <label key={t} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-500"
                          checked={selectedTenses.includes(t)}
                          onChange={() => handleTenseToggle(t)}
                        />
                        <span>{t}</span>
                      </label>
                    ))}
                  </div>
                </div>
          
                {allowPronominal && (
                  <div className="mb-6 p-4 bg-gray-800 rounded space-y-3">
                    <p className="font-medium">Pronominal Verbs:</p>
                    <div className="flex gap-4">
                      {["exclude", "only", "both"].map((choice) => (
                        <label key={choice} className="flex items-center gap-2">
                          <input
                            type="radio"
                            className="h-4 w-4 text-blue-500"
                            name="pronominal"
                            value={choice}
                            checked={pronominalChoice === choice}
                            onChange={() => setPronominalChoice(choice)}
                          />
                          <span>{choice.charAt(0).toUpperCase() + choice.slice(1)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {availableGroups.length>0 && (
                  <div className="mb-6 p-4 bg-gray-800 rounded space-y-3">
                    <p className="font-medium">Groups to Include:</p>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto">
                      {availableGroups.map((g) => (
                        <label key={g} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-500"
                            checked={selectedGroups.includes(g)}
                            onChange={() => handleGroupToggle(g)}
                          />
                          <span>Group {g}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <button
            className="w-full px-5 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold text-lg"
            onClick={handleStartGame}
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  // Main Game Screen
  const currentItem = getCurrentConjugation();
  if (!currentItem) {
    return <div className="text-white">No more conjugations available.</div>;
  }

  // Tense color
  const color = tenseColors[currentItem.tense] || "#10B981";

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white">
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        {/* Tense color-coded pill */}
        <div className="mb-4">
          <span
            style={{
              backgroundColor: color,
              color: "#fff",
              padding: "0.4rem 0.8rem",
              borderRadius: "0.375rem",
              fontWeight: "600",
            }}
          >
            {currentItem.tense}
          </span>
        </div>

        <h2 className="text-4xl font-bold mb-4">
          {currentItem.person} → "{currentItem.verb}"
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="
              p-3 text-black bg-white rounded-md
              w-full text-center border border-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
            placeholder="Type the correct conjugation..."
            required
          />
          
          {/* If ungraded => no button => user must rely on real-time */}
          {!ungraded && (
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

        {/* Show correct/wrong only if graded */}
        {!ungraded && isCorrect !== null && (
          <p
            className={`mt-4 text-lg font-bold ${
              isCorrect ? "text-green-500" : "text-red-500"
            }`}
          >
            {isCorrect ? "Correct!" : "Wrong!"}
          </p>
        )}
        {!zenMode && (
          <div className="mt-4">
            <p className="text-sm">Time Left: {timeRemaining}s</p>
            {ungraded ? (
              <p className="text-sm">
                Words Completed: {gameResults.length}
              </p>
            ) : (
              <p className="text-sm">
                Accuracy:{" "}
                {totalAttempts > 0
                  ? ((correctAnswers / totalAttempts) * 100).toFixed(2)
                  : 0}
                %
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ConjugationGamePage;
