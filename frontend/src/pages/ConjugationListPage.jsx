import { useEffect, useState } from "react";
import {
  getConjugations,
  updateConjugation,
  deleteConjugation,
} from "../services/api";

function ConjugationListPage() {
  const [conjugations, setConjugations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [verbGroupEdits, setVerbGroupEdits] = useState({}); // For editing verb header info
  const allTenses = [
    "présent",
    "passé composé",
    "imparfait",
    "futur simple",
    "conditionnel présent",
    "impératif"
  ];
  const persons = ["je", "tu", "il/elle/on", "nous", "vous", "ils/elles"];

  // State to switch between "row" view and "verb" view.
  const [viewMode, setViewMode] = useState("row");

  useEffect(() => {
    fetchConjugations();
  }, []);

  const fetchConjugations = async () => {
    try {
      const data = await getConjugations();
      setConjugations(data);
    } catch (error) {
      console.error("Error fetching conjugations:", error);
    }
  };

  const handleEdit = (conjugation) => {
    setEditingId(conjugation.id);
    setEditData({
      ...conjugation,
      verbGroup: conjugation.verb_group, // ensuring consistent naming
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleChange = (e, field) => {
    setEditData({ ...editData, [field]: e.target.value });
  };

  const handleToggleIrregular = () => {
    setEditData({ ...editData, irregular: !editData.irregular });
  };

  const handleTogglePronominal = () => {
    setEditData({ ...editData, pronominal: !editData.pronominal });
  };

  const handleSave = async () => {
    try {
      await updateConjugation(
        editData.id,
        editData.verb,
        editData.person,
        editData.tense,
        editData.conjugation,
        editData.irregular,
        editData.pronominal,
        editData.verbGroup
      );
      fetchConjugations();
      setEditingId(null);
    } catch (error) {
      console.error("Error updating conjugation:", error);
    }
  };

  const handleDelete = async (conjugationId) => {
    try {
      await deleteConjugation(conjugationId);
      setConjugations((prev) =>
        prev.filter((conjugation) => conjugation.id !== conjugationId)
      );
    } catch (error) {
      console.error("Error deleting conjugation:", error);
    }
  };

  // Group conjugations by verb for the verb view.
  const groupedConjugations = conjugations.reduce((groups, conj) => {
    const verb = conj.verb;
    if (!groups[verb]) {
      groups[verb] = [];
    }
    groups[verb].push(conj);
    return groups;
  }, {});

  // --- Functions for editing verb headers for each verb group ---
  const startVerbEdit = (verb) => {
    const group = groupedConjugations[verb][0].verb_group;
    setVerbGroupEdits((prev) => ({
      ...prev,
      [verb]: { editing: true, newVerb: verb, newGroup: group, originalVerb: verb },
    }));
  };

  const handleVerbEditChange = (originalVerb, field, value) => {
    setVerbGroupEdits((prev) => ({
      ...prev,
      [originalVerb]: { ...prev[originalVerb], [field]: value },
    }));
  };

  const cancelVerbEdit = (originalVerb) => {
    setVerbGroupEdits((prev) => {
      const copy = { ...prev };
      delete copy[originalVerb];
      return copy;
    });
  };

  const saveVerbEdit = async (originalVerb) => {
    if (!verbGroupEdits[originalVerb]) return;
    const { newVerb, newGroup } = verbGroupEdits[originalVerb];
    const groupConjugations = groupedConjugations[originalVerb];
    try {
      // Update every conjugation in the group with the new verb name and group.
      await Promise.all(
        groupConjugations.map((c) =>
          updateConjugation(
            c.id,
            newVerb,
            c.person,
            c.tense,
            c.conjugation,
            c.irregular,
            c.pronominal,
            parseInt(newGroup)
          )
        )
      );
      cancelVerbEdit(originalVerb);
      fetchConjugations();
    } catch (error) {
      console.error("Error updating verb group:", error);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white p-8">
      <div className="w-full max-w-5xl bg-gray-900 p-6 rounded-lg shadow-lg overflow-x-auto mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Conjugation List</h1>

        {/* Toggle Bar */}
        <div className="flex justify-center mb-4 space-x-4">
          <button
            onClick={() => setViewMode("row")}
            className={`px-4 py-2 rounded ${
              viewMode === "row" ? "bg-blue-600" : "bg-gray-600"
            } text-white font-semibold`}
          >
            Row View
          </button>
          <button
            onClick={() => setViewMode("verb")}
            className={`px-4 py-2 rounded ${
              viewMode === "verb" ? "bg-blue-600" : "bg-gray-600"
            } text-white font-semibold`}
          >
            Verb View
          </button>
        </div>

        {viewMode === "row" ? (
          // ROW VIEW: Current table layout.
          <table className="w-full text-left border-collapse border border-gray-700 rounded-lg">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-3 border border-gray-700">Verb</th>
                <th className="p-3 border border-gray-700">Person</th>
                <th className="p-3 border border-gray-700">Tense</th>
                <th className="p-3 border border-gray-700">Conjugation</th>
                <th className="p-3 border border-gray-700">Irregular</th>
                <th className="p-3 border border-gray-700">Pronominal</th>
                <th className="p-3 border border-gray-700">Group</th>
                <th className="p-3 border border-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {conjugations.map((conjugation) => {
                const isEditing = editingId === conjugation.id;
                return (
                  <tr
                    key={conjugation.id}
                    className="bg-gray-900 text-white hover:bg-gray-800 transition-colors duration-150"
                  >
                    {isEditing ? (
                      <>
                        <td className="p-3 border border-gray-700">
                          <input
                            type="text"
                            value={editData.verb}
                            onChange={(e) => handleChange(e, "verb")}
                            className="bg-gray-700 border border-gray-600 rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-3 border border-gray-700">
                          <select
                            value={editData.person}
                            onChange={(e) => handleChange(e, "person")}
                            className="bg-gray-700 border border-gray-600 rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="je">Je</option>
                            <option value="tu">Tu</option>
                            <option value="il/elle/on">Il/Elle/On</option>
                            <option value="nous">Nous</option>
                            <option value="vous">Vous</option>
                            <option value="ils/elles">Ils/Elles</option>
                          </select>
                        </td>
                        <td className="p-3 border border-gray-700">
                          <select
                            value={editData.tense}
                            onChange={(e) => handleChange(e, "tense")}
                            className="bg-gray-700 border border-gray-600 rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Tense</option>
                            {allTenses.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 border border-gray-700">
                          <input
                            type="text"
                            value={editData.conjugation}
                            onChange={(e) => handleChange(e, "conjugation")}
                            className="bg-gray-700 border border-gray-600 rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-3 border border-gray-700 text-center">
                          <input
                            type="checkbox"
                            checked={editData.irregular}
                            onChange={handleToggleIrregular}
                            className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-3 border border-gray-700 text-center">
                          <input
                            type="checkbox"
                            checked={editData.pronominal}
                            onChange={handleTogglePronominal}
                            className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-3 border border-gray-700">
                          <select
                            value={editData.verbGroup}
                            onChange={(e) =>
                              setEditData({ ...editData, verbGroup: parseInt(e.target.value) })
                            }
                            className="bg-gray-700 border border-gray-600 rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value={0}>0</option>
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                          </select>
                        </td>
                        <td className="p-3 border border-gray-700 flex space-x-2">
                          <button
                            onClick={handleSave}
                            className="bg-green-600 px-3 py-1 rounded text-white hover:bg-green-700 transition-colors duration-150"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="bg-gray-600 px-3 py-1 rounded text-white hover:bg-gray-700 transition-colors duration-150"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 border border-gray-700">{conjugation.verb}</td>
                        <td className="p-3 border border-gray-700">{conjugation.person}</td>
                        <td className="p-3 border border-gray-700">{conjugation.tense}</td>
                        <td className="p-3 border border-gray-700">{conjugation.conjugation}</td>
                        <td className="p-3 border border-gray-700 text-center">
                          {conjugation.irregular ? "✅" : "❌"}
                        </td>
                        <td className="p-3 border border-gray-700 text-center">
                          {conjugation.pronominal ? "✅" : "❌"}
                        </td>
                        <td className="p-3 border border-gray-700">{conjugation.verb_group}</td>
                        <td className="p-3 border border-gray-700 flex space-x-2">
                          <button
                            onClick={() => handleEdit(conjugation)}
                            className="bg-blue-600 px-3 py-1 rounded text-white hover:bg-blue-700 transition-colors duration-150"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(conjugation.id)}
                            className="bg-red-600 px-3 py-1 rounded text-white hover:bg-red-700 transition-colors duration-150"
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
        ) : (
          // VERB VIEW: Group by verb and display in a grid layout.
          Object.keys(groupedConjugations).map((verb) => {
            const groupConjugations = groupedConjugations[verb];
            // Get the current group (assume all conjugations in group share same group)
            const currentGroup = groupConjugations[0].verb_group;
            const verbEdit = verbGroupEdits[verb];
            return (
              <div key={verb} className="bg-gray-800 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-center mb-4">
                  {verbEdit && verbEdit.editing ? (
                    <>
                      <input
                        type="text"
                        value={verbEdit.newVerb}
                        onChange={(e) =>
                          handleVerbEditChange(verb, "newVerb", e.target.value)
                        }
                        className="bg-gray-700 border border-gray-600 rounded p-2 mr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={verbEdit.newGroup}
                        onChange={(e) =>
                          handleVerbEditChange(verb, "newGroup", e.target.value)
                        }
                        className="bg-gray-700 border border-gray-600 rounded p-2 mr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={0}>0</option>
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                      </select>
                      <button
                        onClick={() => saveVerbEdit(verb)}
                        className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition-colors duration-150 mr-2"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => cancelVerbEdit(verb)}
                        className="px-3 py-1 rounded bg-gray-600 text-white hover:bg-gray-700 transition-colors duration-150"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold mr-4">{verb}</h2>
                      <span className="mr-4">Group: {currentGroup}</span>
                      <button
                        onClick={() => startVerbEdit(verb)}
                        className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-150"
                      >
                        Edit Verb
                      </button>
                    </>
                  )}
                </div>
                {/* Conjugation Grid for this verb */}
                <table className="w-full text-center border border-gray-700 rounded-lg">
                  <thead className="bg-gray-900 text-white">
                    <tr>
                      <th className="p-3 border border-gray-700">Person / Tense</th>
                      {allTenses.map((tense) => (
                        <th key={tense} className="p-3 border border-gray-700">{tense}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {persons.map((person) => (
                      <tr key={person} className="bg-gray-900 hover:bg-gray-800 transition-colors duration-150">
                        <td className="p-3 border border-gray-700 font-semibold">{person}</td>
                        {allTenses.map((tense) => {
                          // Find the conjugation for this person and tense
                          const cell = groupConjugations.find(
                            (c) => c.person === person && c.tense === tense
                          );
                          return (
                            <td key={tense} className="p-3 border border-gray-700">
                              {cell ? (
                                editingId === cell.id ? (
                                  <div>
                                    <input
                                      type="text"
                                      value={editData.conjugation}
                                      onChange={(e) => handleChange(e, "conjugation")}
                                      className="bg-gray-700 border border-gray-600 rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                                    />
                                    <div className="flex justify-center space-x-2">
                                      <button
                                        onClick={handleSave}
                                        className="bg-green-600 px-2 py-1 rounded text-white hover:bg-green-700 transition-colors duration-150 text-sm"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={handleCancelEdit}
                                        className="bg-gray-600 px-2 py-1 rounded text-white hover:bg-gray-700 transition-colors duration-150 text-sm"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center">
                                    <span>{cell.conjugation}</span>
                                    <div className="flex space-x-2 mt-1">
                                      <button
                                        onClick={() => handleEdit(cell)}
                                        className="bg-blue-600 px-2 py-1 rounded text-white hover:bg-blue-700 transition-colors duration-150 text-xs"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDelete(cell.id)}
                                        className="bg-red-600 px-2 py-1 rounded text-white hover:bg-red-700 transition-colors duration-150 text-xs"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                )
                              ) : (
                                "-"
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ConjugationListPage;
