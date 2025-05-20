// src/pages/WordsListPage.jsx
import { useEffect, useState, useMemo } from "react";
import { getWords, updateWord, deleteWord, getSettings } from "../services/api";
import { toast } from "react-toastify";

export default function WordsListPage() {
  const [words, setWords] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  // settings lists
  const [partsList, setPartsList] = useState([]);
  const [articlesList, setArticlesList] = useState([]);
  const [classesList, setClassesList] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterPart,  setFilterPart]  = useState("");
  const [filterArticle, setFilterArticle] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [showFilters, setShowFilters] = useState(false);


  useEffect(() => {
    fetchWords();
    getSettings()
      .then((s) => {
        const vocab = s.vocab || {};
        setPartsList(vocab.partsOfSpeech || []);
        setArticlesList(vocab.articles || []);
        setClassesList(vocab.classes || []);
      })
      .catch((err) => console.error("Failed to load settings:", err));
  }, []);

  const displayedWords = useMemo(() => {
    return words.filter((w) => {
      const term = searchTerm.toLowerCase();
      const matchesText =
        w.word.toLowerCase().includes(term) ||
        w.translations.some(t => t.toLowerCase().includes(term));

      const matchesPart = filterPart
        ? w.part_of_speech === filterPart
        : true;

      const matchesArticle = filterArticle
        ? (filterArticle === "None"
            ? !w.article
            : w.article === filterArticle)
        : true;

      const matchesClass = filterClass
        ? (filterClass === "None"
            ? !w.class
            : w.class === filterClass)
        : true;

      return matchesText && matchesPart && matchesArticle && matchesClass;
    });
  }, [words, searchTerm, filterPart, filterArticle, filterClass]);


  const fetchWords = async () => {
    try {
      const data = await getWords();
      setWords(data);
    } catch (error) {
      console.error("Error fetching words:", error);
    }
  };

  const handleEdit = (word) => {
    setEditingId(word.id);
    setEditData({
      ...word,
      translations: [...word.translations],
      word_class: word.class || ""
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleChange = (e, field) => {
    setEditData({ ...editData, [field]: e.target.value });
  };

  const handleTranslationChange = (index, value) => {
    const updated = [...editData.translations];
    updated[index] = value;
    setEditData({ ...editData, translations: updated });
  };

  const handleAddTranslation = () => {
    setEditData({
      ...editData,
      translations: [...editData.translations, ""],
    });
  };

  const handleDeleteTranslation = (index) => {
    const updated = [...editData.translations];
    if (updated.length === 1) {
      alert("At least one translation is required!");
      return;
    }
    updated.splice(index, 1);
    setEditData({ ...editData, translations: updated });
  };

  const handleSave = async () => {
    try {
      // note: updateWord signature now includes word_class
      await updateWord(
        editData.id,
        editData.word,
        editData.translations,
        editData.part_of_speech,
        editData.article,
        editData.word_class
      );
      fetchWords();
      setEditingId(null);
      toast.success("Updated word!");
    } catch (error) {
      console.error("Error updating word:", error);
      toast.error("Failed to update word.");
    }
  };

  const handleDelete = async (wordId) => {
    try {
      await deleteWord(wordId);
      setWords((prev) => prev.filter((w) => w.id !== wordId));
      toast.success("Deleted word!");
    } catch (error) {
      console.error("Error deleting word:", error);
      toast.error("Failed to delete word.");
    }
  };

  return (
    <div
      className="
        min-h-screen w-screen
        flex items-center justify-center
        bg-gradient-to-r from-gray-900 via-gray-800 to-black
        text-white p-8
      "
    >
      <div className="w-full max-w-5xl bg-gray-900 p-6 rounded-lg shadow-lg overflow-x-auto">

        <h1 className="text-3xl font-bold mb-6 text-center">Word List</h1>
        <div className="flex items-center justify-center mb-4">
          <button
            onClick={() => setShowFilters(f => !f)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-center text-white transition"
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-4 mb-4">
            <input
              type="text"
              placeholder="Search word or translation…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-gray-700 border-gray-600 rounded p-2 flex-grow focus:ring-2"
            />

            {partsList.length > 0 && (
              <select
                value={filterPart}
                onChange={e => setFilterPart(e.target.value)}
                className="bg-gray-700 border-gray-600 rounded p-2 focus:ring-2"
              >
                <option value="">All Parts</option>
                {partsList.map(p => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            )}

            {articlesList.length > 0 && (
              <select
                value={filterArticle}
                onChange={e => setFilterArticle(e.target.value)}
                className="bg-gray-700 border-gray-600 rounded p-2 focus:ring-2"
              >
                <option value="">All Articles</option>
                <option value="None">None</option>
                {articlesList.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            )}

            {classesList.length > 0 && (
              <select
                value={filterClass}
                onChange={e => setFilterClass(e.target.value)}
                className="bg-gray-700 border-gray-600 rounded p-2 focus:ring-2"
              >
                <option value="">All Classes</option>
                <option value="None">None</option>
                {classesList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}

            <button
              onClick={() => {
                setSearchTerm("");
                setFilterPart("");
                setFilterArticle("");
                setFilterClass("");
              }}
              className="bg-gray-600 px-3 py-1 rounded hover:bg-gray-700"
            >
              Clear
            </button>
          </div>
        )}

        <table className="w-full text-left border-collapse border border-gray-700 rounded-lg">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="p-3 border border-gray-700">Word</th>
              <th className="p-3 border border-gray-700">Translations</th>
              {partsList.length > 0 && (
                <th className="p-3 border border-gray-700">Part of Speech</th>
              )}
              {articlesList.length > 0 && (
                <th className="p-3 border border-gray-700">Article</th>
              )}
              {classesList.length > 0 && (
                <th className="p-3 border border-gray-700">Class</th>
              )}
              <th className="p-3 border border-gray-700">Actions</th>
            </tr>
          </thead>

          <tbody>
            {displayedWords.map((word) => {
              const isEditing = editingId === word.id;
              return (
                <tr
                  key={word.id}
                  className="
                    bg-gray-900 text-white
                    hover:bg-gray-800 transition-colors duration-150
                  "
                >
                  {isEditing ? (
                    <>
                      {/* Word */}
                      <td className="p-3 border border-gray-700">
                        <input
                          type="text"
                          value={editData.word}
                          onChange={(e) => handleChange(e, "word")}
                          className="
                            bg-gray-700 border border-gray-600 rounded p-2 w-full
                            focus:outline-none focus:ring-2 focus:ring-blue-500
                          "
                        />
                      </td>

                      {/* Translations */}
                      <td className="p-3 border border-gray-700 align-top">
                        {editData.translations.map((t, i) => (
                          <div
                            key={i}
                            className="flex items-center space-x-2 mb-2"
                          >
                            <input
                              type="text"
                              value={t}
                              onChange={(e) =>
                                handleTranslationChange(i, e.target.value)
                              }
                              className="
                                bg-gray-700 border border-gray-600 rounded p-2 w-full
                                focus:outline-none focus:ring-2 focus:ring-blue-500
                              "
                            />
                            <button
                              onClick={() => handleDeleteTranslation(i)}
                              className="
                                bg-red-600 px-2 py-1 rounded text-white
                                hover:bg-red-700 transition-colors duration-150
                              "
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={handleAddTranslation}
                          className="
                            bg-green-600 px-3 py-1 rounded text-white
                            hover:bg-green-700 transition-colors duration-150
                          "
                        >
                          ➕ Add
                        </button>
                      </td>

                      {/* Part of Speech */}
                      {partsList.length > 0 && (
                        <td className="p-3 border border-gray-700">
                          <select
                            value={editData.part_of_speech}
                            onChange={(e) =>
                              handleChange(e, "part_of_speech")
                            }
                            className="
                              bg-gray-700 border border-gray-600 rounded p-2 w-full
                              focus:outline-none focus:ring-2 focus:ring-blue-500
                            "
                          >
                            {partsList.map((p) => (
                              <option key={p} value={p}>
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}

                      {/* Article */}
                      {articlesList.length > 0 && (
                        <td className="p-3 border border-gray-700">
                          <select
                            value={editData.article || ""}
                            onChange={(e) => handleChange(e, "article")}
                            className="
                              bg-gray-700 border border-gray-600 rounded p-2 w-full
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
                        </td>
                      )}

                      {/* Class */}
                      {classesList.length > 0 && (
                        <td className="p-3 border border-gray-700">
                          <select
                            value={editData.word_class}
                            onChange={(e) => handleChange(e, "word_class")}
                            className="
                              bg-gray-700 border border-gray-600 rounded p-2 w-full
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
                        </td>
                      )}

                      {/* Actions */}
                      <td className="p-3 border border-gray-700 flex space-x-2">
                        <button
                          onClick={handleSave}
                          className="
                            bg-green-600 px-3 py-1 rounded text-white
                            hover:bg-green-700 transition-colors duration-150
                          "
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="
                            bg-gray-600 px-3 py-1 rounded text-white
                            hover:bg-gray-700 transition-colors duration-150
                          "
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      {/* Display Mode */}
                      <td className="p-3 border border-gray-700">{word.word}</td>
                      <td className="p-3 border border-gray-700">
                        {word.translations.join(", ")}
                      </td>
                      {partsList.length > 0 && (
                        <td className="p-3 border border-gray-700">
                          {word.part_of_speech}
                        </td>
                      )}
                      {articlesList.length > 0 && (
                        <td className="p-3 border border-gray-700">
                          {word.article || "None"}
                        </td>
                      )}
                      {classesList.length > 0 && (
                        <td className="p-3 border border-gray-700">
                          {word.class || "None"}
                        </td>
                      )}
                      <td className="p-3 border border-gray-700 flex space-x-2">
                        <button
                          onClick={() => handleEdit(word)}
                          className="
                            bg-blue-600 px-3 py-1 rounded text-white
                            hover:bg-blue-700 transition-colors duration-150
                          "
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(word.id)}
                          className="
                            bg-red-600 px-3 py-1 rounded text-white
                            hover:bg-red-700 transition-colors duration-150
                          "
                        >
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
