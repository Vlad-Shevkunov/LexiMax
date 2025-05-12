// src/pages/ConjugationListPage.jsx
import { useEffect, useState } from "react";
import {
  getConjugations,
  updateConjugation,
  deleteConjugation,
  getSettings,
} from "../services/api";
import { toast } from "react-toastify";

export default function ConjugationListPage() {
  // ── Loaded Settings ───────────────────────────────────────────────
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [persons, setPersons] = useState([]);
  const [tenses, setTenses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [allowPronominal, setAllowPronominal] = useState(false);
  const [allowIrregular, setAllowIrregular] = useState(false);

  // ── Conjugations Data & Edit State ────────────────────────────────
  const [conjugations, setConjugations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [verbGroupEdits, setVerbGroupEdits] = useState({}); // { [verb]: { editing,newVerb,newGroup } }

  // ── View Mode: "row" or "verb" ────────────────────────────────────
  const [viewMode, setViewMode] = useState("row");

  // ── Fetch user settings on mount ──────────────────────────────────
  useEffect(() => {
    getSettings()
      .then((s) => {
        // Default fallback if user hasn't set these
        const c = s.conj || {};
        setPersons(c.persons?.length ? c.persons : ["je","tu","il/elle/on","nous","vous","ils/elles"]);
        setTenses(c.tenses?.length ? c.tenses : [
          "présent","passé composé","imparfait","futur simple","conditionnel présent","impératif"
        ]);
        setGroups(c.groups?.length ? c.groups : []);
        setAllowPronominal(!!c.allowPronominal);
        setAllowIrregular(!!c.allowIrregular);
      })
      .catch((err) => {
        console.error("Failed to load settings:", err);
        alert("Could not load conjugation settings.");
      })
      .finally(() => {
        setLoadingSettings(false);
      });
  }, []);

  // ── Fetch conjugations whenever the page mounts or after edits ────
  useEffect(() => {
    fetchConjugations();
  }, []);

  const fetchConjugations = async () => {
    try {
      const data = await getConjugations();
      setConjugations(data);
    } catch (e) {
      console.error("Error fetching conjugations:", e);
    }
  };

  if (loadingSettings) {
    return <div className="p-6 text-white">Loading settings…</div>;
  }

  // Group for "verb" view
  const grouped = conjugations.reduce((acc, c) => {
    (acc[c.verb] = acc[c.verb] || []).push(c);
    return acc;
  }, {});

  // ── Handlers ───────────────────────────────────────────────────────
  const handleEdit = (c) => {
    setEditingId(c.id);
    setEditData({
      ...c,
      verbGroup: c.verb_group,
    });
  };
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };
  const handleChange = (e, field) => {
    setEditData({ ...editData, [field]: e.target.value });
  };
  const handleToggle = (field) => {
    setEditData({ ...editData, [field]: !editData[field] });
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
      toast.success("Updated conjugation!");
    } catch (e) {
      console.error("Error saving conjugation:", e);
      toast.error("Failed to save conjugation.");
    }
  };
  const handleDelete = async (id) => {
    try {
      await deleteConjugation(id);
      setConjugations((prev) => prev.filter((c) => c.id !== id));
      toast.success("Deleted conjugation!");
    } catch (e) {
      console.error("Error deleting conjugation:", e);
      toast.error("Failed to delete conjugation.");
    }
  };

  // Verb‐header edits
  const startVerbEdit = (verb) => {
    const first = grouped[verb][0];
    setVerbGroupEdits((prev) => ({
      ...prev,
      [verb]: { editing: true, newVerb: verb, newGroup: first.verb_group, newPronominal: first.pronominal },
    }));
  };
  const handleVerbEditChange = (verb, field, value) => {
    setVerbGroupEdits((prev) => ({
      ...prev,
      [verb]: { ...prev[verb], [field]: value },
    }));
  };
  const cancelVerbEdit = (verb) => {
    setVerbGroupEdits((prev) => {
      const nxt = { ...prev };
      delete nxt[verb];
      return nxt;
    });
  };
  const saveVerbEdit = async (verb) => {
    const e = verbGroupEdits[verb];
    if (!e) return;
    try {
      await Promise.all(
        grouped[verb].map((c) =>
          updateConjugation(
            c.id,
            e.newVerb,
            c.person,
            c.tense,
            c.conjugation,
            c.irregular,
            (e.newPronominal !== undefined ? e.newPronominal : c.pronominal),
            (groups.length>0 ? e.newGroup :  c.verb_group)
          )
        )
      );
      cancelVerbEdit(verb);
      fetchConjugations();
    } catch (err) {
      console.error("Error updating verb group:", err);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white p-8">
      <div className="w-full max-w-5xl bg-gray-900 p-6 rounded-lg shadow-lg overflow-x-auto mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Conjugation List</h1>

        {/* Toggle */}
        <div className="flex justify-center mb-4 space-x-4">
          {["row", "verb"].map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-4 py-2 rounded ${
                viewMode === m ? "bg-blue-600" : "bg-gray-600"
              } text-white font-semibold`}
            >
              {m === "row" ? "Row View" : "Verb View"}
            </button>
          ))}
        </div>

        {viewMode === "row" ? (
          <table className="w-full text-left border-collapse border border-gray-700 rounded-lg">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-3 border border-gray-700">Verb</th>
                <th className="p-3 border border-gray-700">Person</th>
                <th className="p-3 border border-gray-700">Tense</th>
                <th className="p-3 border border-gray-700">Conjugation</th>
                {allowIrregular && <th className="p-3 border border-gray-700">Irregular</th>}
                {allowPronominal && <th className="p-3 border border-gray-700">Pronominal</th>}
                {groups.length>0 && <th className="p-3 border border-gray-700">Group</th>}
                <th className="p-3 border border-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {conjugations.map((c) => {
                const editing = editingId === c.id;
                return (
                  <tr
                    key={c.id}
                    className="bg-gray-900 text-white hover:bg-gray-800 transition-colors duration-150"
                  >
                    {editing ? (
                      <>
                        <td className="p-3 border border-gray-700">
                          <input
                            type="text"
                            value={editData.verb}
                            onChange={(e) => handleChange(e, "verb")}
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-3 border border-gray-700">
                          <select
                            value={editData.person}
                            onChange={(e) => handleChange(e, "person")}
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {persons.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 border border-gray-700">
                          <select
                            value={editData.tense}
                            onChange={(e) => handleChange(e, "tense")}
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {tenses.map((t) => (
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
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        {allowIrregular && (
                          <td className="p-3 border border-gray-700 text-center">
                            <input
                              type="checkbox"
                              checked={editData.irregular}
                              onChange={() => handleToggle("irregular")}
                              className="h-4 w-4 text-blue-500"
                            />
                          </td>
                        )}
                        {allowPronominal && (
                          <td className="p-3 border border-gray-700 text-center">
                            <input
                              type="checkbox"
                              checked={editData.pronominal}
                              onChange={() => handleToggle("pronominal")}
                              className="h-4 w-4 text-blue-500"
                            />
                          </td>
                        )}
                        {groups.length>0 && (
                          <td className="p-3 border border-gray-700">
                            <select
                              value={editData.verbGroup}
                              onChange={(e) => handleChange(e, "verbGroup")}
                              className="w-full bg-gray-700 border border-gray-600 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value={0}>0 – Unknown</option>
                              {groups.map((g) => (
                                <option key={g} value={g}>
                                  {g}
                                </option>
                              ))}
                            </select>
                          </td>
                        )}
                        <td className="p-3 border border-gray-700 flex space-x-2">
                          <button
                            onClick={handleSave}
                            className="bg-green-600 px-3 py-1 rounded text-white hover:bg-green-700 transition"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="bg-gray-600 px-3 py-1 rounded text-white hover:bg-gray-700 transition"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 border border-gray-700">{c.verb}</td>
                        <td className="p-3 border border-gray-700">{c.person}</td>
                        <td className="p-3 border border-gray-700">{c.tense}</td>
                        <td className="p-3 border border-gray-700">{c.conjugation}</td>
                        {allowIrregular && (
                          <td className="p-3 border border-gray-700 text-center">
                            {c.irregular ? "✅" : "❌"}
                          </td>
                        )}
                        {allowPronominal && (
                          <td className="p-3 border border-gray-700 text-center">
                            {c.pronominal ? "✅" : "❌"}
                          </td>
                        )}
                        {groups.length>0 && <td className="p-3 border border-gray-700">{c.verb_group}</td> }
                        <td className="p-3 border border-gray-700 flex space-x-2">
                          <button
                            onClick={() => handleEdit(c)}
                            className="bg-blue-600 px-3 py-1 rounded text-white hover:bg-blue-700 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="bg-red-600 px-3 py-1 rounded text-white hover:bg-red-700 transition"
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
          // --- Verb View ---
          Object.keys(grouped).map((verb) => {
            const rows = grouped[verb];
            const vg = rows[0].verb_group;
            const edit = verbGroupEdits[verb];
            return (
              <div key={verb} className="bg-gray-800 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-center mb-4">
                  {edit?.editing ? (
                    <>
                      <input
                        type="text"
                        value={edit.newVerb}
                        onChange={(e) => handleVerbEditChange(verb, "newVerb", e.target.value)}
                        className="bg-gray-700 border border-gray-600 rounded p-2 mr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {allowPronominal && (
                        <label className="flex items-center gap-2 mr-4">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-500"
                            checked={verbGroupEdits[verb].newPronominal}
                            onChange={e =>
                              handleVerbEditChange(verb, "newPronominal", e.target.checked)
                            }
                          />
                          <span>Pronominal</span>
                        </label>
                      )}
                      {groups.length>0 && (
                        <select
                          value={edit.newGroup}
                          onChange={(e) => handleVerbEditChange(verb, "newGroup", e.target.value)}
                          className="bg-gray-700 border border-gray-600 rounded p-2 mr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={0}>0 – Unknown</option>
                          {groups.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      )}
                      <button
                        onClick={() => saveVerbEdit(verb)}
                        className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition mr-2"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => cancelVerbEdit(verb)}
                        className="px-3 py-1 rounded bg-gray-600 text-white hover:bg-gray-700 transition"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold mr-4">{verb}</h2>
                      {allowPronominal && !edit?.editing && (
                        <span className="mr-4">
                          Pronominal: {rows[0].pronominal ? "✅" : "❌"}
                        </span>
                      )}
                      {groups.length > 0 && ( <span className="mr-4">Group: {vg}</span> )}
                      <button
                        onClick={() => startVerbEdit(verb)}
                        className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                      >
                        Edit Verb
                      </button>
                    </>
                  )}
                </div>
                <table className="w-full text-center border border-gray-700 rounded-lg">
                  <thead className="bg-gray-900 text-white">
                    <tr>
                      <th className="p-3 border border-gray-700">Person/Tense</th>
                      {tenses.map((t) => (
                        <th key={t} className="p-3 border border-gray-700">{t}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {persons.map((p) => (
                      <tr key={p} className="bg-gray-900 hover:bg-gray-800 transition">
                        <td className="p-3 border border-gray-700 font-semibold">{p}</td>
                        {tenses.map((t) => {
                          const cell = rows.find((r) => r.person === p && r.tense === t);
                          console.log(`looking for p=${p} t=${t} →`, cell);
                          if (!cell) return <td key={t} className="p-3 border border-gray-700">—</td>;
                          const inEdit = editingId === cell.id;
                          return (
                            <td key={t} className="p-3 border border-gray-700">
                              {inEdit ? (
                                <div>
                                  <input
                                    type="text"
                                    value={editData.conjugation}
                                    onChange={(e) => handleChange(e, "conjugation")}
                                    className="bg-gray-700 border border-gray-600 rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                                  />
                                  {allowIrregular && (
                                    <label className="flex items-center justify-center mt-2">
                                      <input
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-500"
                                        checked={editData.irregular}
                                        onChange={() => handleToggle("irregular")}
                                      />
                                      <span className="ml-1">Irregular</span>
                                    </label>
                                  )}
                                  <div className="flex justify-center space-x-2">
                                    <button
                                      onClick={handleSave}
                                      className="bg-green-600 px-2 py-1 rounded text-white hover:bg-green-700 transition text-xs"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="bg-gray-600 px-2 py-1 rounded text-white hover:bg-gray-700 transition text-xs"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <span>{cell.conjugation}</span>
                                  {allowIrregular && (
                                    <span className="mt-1 text-sm">
                                      {cell.irregular ? "✅ Irregular" : "❌ Regular"}
                                    </span>
                                  )}
                                  <div className="flex space-x-2 mt-1">
                                    <button
                                      onClick={() => handleEdit(cell)}
                                      className="bg-blue-600 px-2 py-1 rounded text-white hover:bg-blue-700 transition text-xs"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDelete(cell.id)}
                                      className="bg-red-600 px-2 py-1 rounded text-white hover:bg-red-700 transition text-xs"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
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
