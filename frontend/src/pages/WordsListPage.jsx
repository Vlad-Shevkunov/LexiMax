import { useEffect, useState } from "react";
import { getWords, updateWord, deleteWord } from "../services/api";

function WordsListPage() {
  const [words, setWords] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchWords();
  }, []);

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
    // Make a copy of the translations array so we can edit them
    setEditData({ ...word, translations: [...word.translations] });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleChange = (e, field) => {
    setEditData({ ...editData, [field]: e.target.value });
  };

  const handleTranslationChange = (index, value) => {
    const updatedTranslations = [...editData.translations];
    updatedTranslations[index] = value;
    setEditData({ ...editData, translations: updatedTranslations });
  };

  const handleAddTranslation = () => {
    setEditData({
      ...editData,
      translations: [...editData.translations, ""],
    });
  };

  const handleDeleteTranslation = (index) => {
    const updatedTranslations = [...editData.translations];
    updatedTranslations.splice(index, 1);

    if (updatedTranslations.length === 0) {
      alert("At least one translation is required!");
      return;
    }

    setEditData({ ...editData, translations: updatedTranslations });
  };

  const handleSave = async () => {
    try {
      await updateWord(
        editData.id,
        editData.word,
        editData.translations,
        editData.part_of_speech,
        editData.article === "none" ? null : editData.article
      );
      fetchWords();
      setEditingId(null);
    } catch (error) {
      console.error("Error updating word:", error);
    }
  };

  const handleDelete = async (wordId) => {
    try {
      await deleteWord(wordId);
      setWords((prev) => prev.filter((word) => word.id !== wordId));
    } catch (error) {
      console.error("Error deleting word:", error);
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

        <table className="w-full text-left border-collapse border border-gray-700 rounded-lg">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="p-3 border border-gray-700">Word</th>
              <th className="p-3 border border-gray-700">Translations</th>
              <th className="p-3 border border-gray-700">Part of Speech</th>
              <th className="p-3 border border-gray-700">Article</th>
              <th className="p-3 border border-gray-700">Actions</th>
            </tr>
          </thead>

          <tbody>
            {words.map((word) => {
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

                      <td className="p-3 border border-gray-700 align-top">
                        {editData.translations.map((translation, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2 mb-2"
                          >
                            <input
                              type="text"
                              value={translation}
                              onChange={(e) =>
                                handleTranslationChange(index, e.target.value)
                              }
                              className="
                                bg-gray-700 border border-gray-600 rounded p-2 w-full
                                focus:outline-none focus:ring-2 focus:ring-blue-500
                              "
                            />
                            <button
                              onClick={() => handleDeleteTranslation(index)}
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

                      <td className="p-3 border border-gray-700">
                        <select
                          value={editData.part_of_speech}
                          onChange={(e) => handleChange(e, "part_of_speech")}
                          className="
                            bg-gray-700 border border-gray-600 rounded p-2 w-full
                            focus:outline-none focus:ring-2 focus:ring-blue-500
                          "
                        >
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
                      </td>

                      <td className="p-3 border border-gray-700">
                        <select
                          value={editData.article}
                          onChange={(e) => handleChange(e, "article")}
                          className="
                            bg-gray-700 border border-gray-600 rounded p-2 w-full
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
                      </td>

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
                      <td className="p-3 border border-gray-700">{word.word}</td>
                      <td className="p-3 border border-gray-700">
                        {word.translations.join(", ")}
                      </td>
                      <td className="p-3 border border-gray-700">
                        {word.part_of_speech}
                      </td>
                      <td className="p-3 border border-gray-700">
                        {word.article || "None"}
                      </td>
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

export default WordsListPage;
