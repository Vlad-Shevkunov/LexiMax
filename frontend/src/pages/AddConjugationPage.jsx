// src/pages/AddConjugationPage.jsx
import { useState, useEffect } from "react";
import { getSettings, addConjugation } from "../services/api";
import { toast } from "react-toastify";

export default function AddConjugationPage() {
  // ── Loading & settings ───────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [persons, setPersons] = useState([]);
  const [tenses, setTenses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [allowPronominal, setAllowPronominal] = useState(false);
  const [allowIrregular, setAllowIrregular] = useState(false);

  // ── Conjugation‐grid state ────────────────────────────────────────────
  // fullConjugations[tense][person] → { text, irregular }
  const [fullConjugations, setFullConjugations] = useState({});

  // ── Bulk‐add inputs ────────────────────────────────────────────────────
  const [fullVerb, setFullVerb] = useState("");
  const [fullPronominal, setFullPronominal] = useState(false);
  const [fullVerbGroup, setFullVerbGroup] = useState(0);

  // ── Build an empty grid given persons & tenses ────────────────────────
  const buildInitialConjugations = (ps, ts) => {
    const init = {};
    ts.forEach((tense) => {
      init[tense] = {};
      ps.forEach((person) => {
        init[tense][person] = { text: "", irregular: false };
      });
    });
    return init;
  };

  // ── Load user settings once on-mount ──────────────────────────────────
  useEffect(() => {
    getSettings()
      .then((s) => {
        const c = s.conj || {};
        const ps = c.persons || [];
        const ts = c.tenses || [];
        const gs = c.groups || [];

        setPersons(ps);
        setTenses(ts);
        setGroups(gs);
        setAllowPronominal(!!c.allowPronominal);
        setAllowIrregular(!!c.allowIrregular);

        // initialize grid
        setFullConjugations(buildInitialConjugations(ps, ts));
      })
      .catch((err) => {
        console.error("Failed to load settings:", err);
        toast.error("Could not load conjugation settings.");
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Show loading / prompt if no config ───────────────────────────────
  if (loading) {
    return <div className="p-6 text-white">Loading settings…</div>;
  }
  if (!persons.length || !tenses.length) {
    return (
      <div className="p-6 text-white">
        Please configure your <strong>persons</strong> and <strong>tenses</strong> in
        Settings before adding conjugations.
      </div>
    );
  }

  // ── Handle editing any one cell ───────────────────────────────────────
  const handleFullConjChange = (tense, person, field, value) => {
    setFullConjugations((prev) => {
      const copy = { ...prev };
      copy[tense] = { ...copy[tense] };
      copy[tense][person] = { ...copy[tense][person], [field]: value };
      return copy;
    });
  };

  // ── Bulk‐submit all filled cells ──────────────────────────────────────
  const handleSubmitFull = async () => {
    if (!fullVerb.trim()) {
      toast.error("Please specify the base verb (infinitive)!");
      return;
    }
    const results = [];
    for (let tense of tenses) {
      for (let person of persons) {
        const cell = fullConjugations[tense][person];
        if (cell.text.trim()) {
          try {
            await addConjugation(
              fullVerb.trim().toLowerCase(),
              person,
              tense,
              cell.text.trim().toLowerCase(),
              cell.irregular,
              fullPronominal,
              fullVerbGroup
            );
            results.push(`${person} – ${tense}: OK`);
          } catch {
            results.push(`${person} – ${tense}: FAILED`);
          }
        }
      }
    }
    toast.success(
      `Finished adding conjugations for "${fullVerb}".\n\n` +
        results.join("\n")
    );
    // reset
    setFullVerb("");
    setFullPronominal(false);
    setFullVerbGroup(0);
    setFullConjugations(buildInitialConjugations(persons, tenses));
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen w-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white">
      <div className="px-8 py-6 flex flex-col space-y-6">
        <div className="max-w-5xl mx-auto bg-gray-900 p-6 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-6 text-center">
            Add Full Verb Conjugation
          </h1>

          {/* Verb + Flags */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
            <input
              type="text"
              placeholder="Infinitive (e.g. faire)"
              className="p-3 rounded bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white w-64"
              value={fullVerb}
              onChange={(e) => setFullVerb(e.target.value)}
            />

            {allowPronominal && (
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={fullPronominal}
                  onChange={() => setFullPronominal(!fullPronominal)}
                  className="w-4 h-4 text-blue-500"
                />
                <span>Pronominal?</span>
              </label>
            )}

            {groups.length > 0 && (
              <label className="flex items-center space-x-2">
                <span>Group:</span>
                <select
                  className="p-2 rounded bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  value={fullVerbGroup}
                  onChange={(e) => setFullVerbGroup(e.target.value)}
                >
                  <option value={0}>0 – Unknown/No Group</option>
                  {groups.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {/* Conjugation Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-center border border-gray-600">
              <thead className="bg-gray-800">
                <tr>
                  <th className="p-2 border border-gray-600">Person / Tense</th>
                  {tenses.map((tense) => (
                    <th key={tense} className="p-2 border border-gray-600">
                      {tense}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {persons.map((person) => (
                  <tr
                    key={person}
                    className="bg-gray-700 hover:bg-gray-600 transition-colors"
                  >
                    <td className="p-2 border border-gray-600 font-semibold">
                      {person}
                    </td>
                    {tenses.map((tense) => {
                      const cell = fullConjugations[tense][person];
                      return (
                        <td key={tense} className="p-2 border border-gray-600">
                          <input
                            type="text"
                            placeholder="Conjugation"
                            className="p-2 w-28 rounded bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={cell.text}
                            onChange={(e) =>
                              handleFullConjChange(
                                tense,
                                person,
                                "text",
                                e.target.value
                              )
                            }
                          />
                          {allowIrregular && (
                            <label className="flex items-center justify-center mt-1 text-sm">
                              <input
                                type="checkbox"
                                checked={cell.irregular}
                                onChange={(e) =>
                                  handleFullConjChange(
                                    tense,
                                    person,
                                    "irregular",
                                    e.target.checked
                                  )
                                }
                                className="w-4 h-4 text-blue-500 ml-2"
                              />
                              <span className="ml-1 text-xs">irreg?</span>
                            </label>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Submit */}
          <div className="flex justify-center mt-4">
            <button
              onClick={handleSubmitFull}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded text-white font-semibold text-lg"
            >
              Submit All Conjugations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
