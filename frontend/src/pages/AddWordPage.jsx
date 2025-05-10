// src/pages/AddWordPage.jsx
import { useState, useEffect } from "react";
import { addWord, getSettings } from "../services/api";
import { toast } from "react-toastify";

export default function AddWordPage() {
  // form fields
  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("");
  const [article, setArticle] = useState("");
  const [wordClass, setWordClass] = useState("");

  // settings-driven lists
  const [partsList, setPartsList] = useState([]);
  const [articlesList, setArticlesList] = useState([]);
  const [classesList, setClassesList] = useState([]);

  // load user settings once
  useEffect(() => {
    getSettings()
      .then((s) => {
        const vocab = s.vocab || {};
        setPartsList(vocab.partsOfSpeech || []);
        setArticlesList(vocab.articles || []);
        setClassesList(vocab.classes || []);
      })
      .catch((err) => {
        console.error("Failed to load settings:", err);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addWord(word, translation, partOfSpeech, article, wordClass);
      toast.success("✅ Word added successfully!");
      // reset
      setWord("");
      setTranslation("");
      setPartOfSpeech("");
      setArticle("");
      setWordClass("");
    } catch (error) {
      toast.error("❌ Failed to add word. Please try again.");
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
          {/* Word */}
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

          {/* Translation */}
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

          {/* Part of Speech (only if settings provide any) */}
          {partsList.length > 0 && (
            <select
              value={partOfSpeech}
              onChange={(e) => setPartOfSpeech(e.target.value)}
              className="
                p-3 rounded bg-gray-700 border border-gray-600
                focus:outline-none focus:ring-2 focus:ring-blue-500
              "
              required
            >
              <option value="">Select Part of Speech</option>
              {partsList.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          )}

          {/* Article (only if settings provide any) */}
          {articlesList.length > 0 && (
            <select
              value={article}
              onChange={(e) => setArticle(e.target.value)}
              className="
                p-3 rounded bg-gray-700 border border-gray-600
                focus:outline-none focus:ring-2 focus:ring-blue-500
              "
            >
              <option value="">No Article</option>
              {articlesList.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          )}

          {/* Class (only if settings provide any) */}
          {classesList.length > 0 && (
            <select
              value={wordClass}
              onChange={(e) => setWordClass(e.target.value)}
              className="
                p-3 rounded bg-gray-700 border border-gray-600
                focus:outline-none focus:ring-2 focus:ring-blue-500
              "
            >
              <option value="">No Class</option>
              {classesList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Submit */}
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
