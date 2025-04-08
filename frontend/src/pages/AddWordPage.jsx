import { useState } from "react";
import { addWord } from "../services/api";

function AddWordPage() {
  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("");
  const [article, setArticle] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addWord(word, translation, partOfSpeech, article);
      alert("Word added successfully!");
      setWord("");
      setTranslation("");
      setPartOfSpeech("");
      setArticle("");
    } catch (error) {
      alert("Failed to add word.");
    }
  };

  return (
    <div
      className="
        min-h-screen w-screen
        flex items-center justify-center
        bg-gradient-to-r from-gray-900 via-gray-800 to-black
        text-white
      "
    >
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Add a Word</h1>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
          <input
            type="text"
            placeholder="Word"
            className="
              p-3 rounded bg-gray-700 border border-gray-600
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
            value={word}
            onChange={(e) => setWord(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Translation"
            className="
              p-3 rounded bg-gray-700 border border-gray-600
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            required
          />

          <select
            value={partOfSpeech}
            onChange={(e) => setPartOfSpeech(e.target.value)}
            className="
              p-3 rounded bg-gray-700 border border-gray-600
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          >
            <option value="">Select Part of Speech</option>
            <option value="noun">Noun</option>
            <option value="verb">Verb</option>
            <option value="adjective">Adjective</option>
            <option value="adverb">Adverb</option>
            <option value="pronoun">Pronoun</option>
            <option value="preposition">Preposition</option>
            <option value="conjunction">Conjunction</option>
            <option value="interjection">Interjection</option>
            <option value="numeral">Numeral</option>
            <option value="phrase">Phrase</option>
          </select>

          <select
            value={article}
            onChange={(e) => setArticle(e.target.value)}
            className="
              p-3 rounded bg-gray-700 border border-gray-600
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          >
            <option value="none">No Article</option>
            <option value="un">un</option>
            <option value="une">une</option>
            <option value="des">des</option>
            <option value="le">le</option>
            <option value="la">la</option>
            <option value="les">les</option>
            <option value="l'">l'</option>
          </select>

          <button
            type="submit"
            className="
              bg-blue-600 p-3 rounded text-white font-semibold
              hover:bg-blue-700 transition-colors duration-150
            "
          >
            Add Word
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddWordPage;
