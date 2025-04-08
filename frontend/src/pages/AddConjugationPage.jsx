import { useState } from "react";
import { addConjugation } from "../services/api";

function AddConjugationPage() {
  /***************************************************************
   * Configuration: Tenses & Persons
   ***************************************************************/
  const persons = ["je", "tu", "il/elle/on", "nous", "vous", "ils/elles"];
  const allTenses = [
    "présent",
    "passé composé",
    "imparfait",
    "futur simple",
    "conditionnel présent",
    "impératif"
  ];

  /***************************************************************
   * Full Verb Bulk Entry State & Helper Functions
   ***************************************************************/
  const [fullVerb, setFullVerb] = useState("");
  const [fullPronominal, setFullPronominal] = useState(false);
  const [fullVerbGroup, setFullVerbGroup] = useState(0);

  // Build the initial grid state for all tenses and persons.
  const buildInitialConjugations = () => {
    const initObj = {};
    allTenses.forEach((tense) => {
      initObj[tense] = {};
      persons.forEach((person) => {
        initObj[tense][person] = { text: "", irregular: false };
      });
    });
    return initObj;
  };

  const [fullConjugations, setFullConjugations] = useState(buildInitialConjugations);

  const handleFullConjChange = (tenseKey, personKey, field, value) => {
    setFullConjugations((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[tenseKey][personKey][field] = value;
      return copy;
    });
  };

  const handleSubmitFull = async () => {
    if (!fullVerb.trim()) {
      alert("Please specify the base verb (infinitive)!");
      return;
    }
    const confirmations = [];
    for (let tense of allTenses) {
      for (let person of persons) {
        const cell = fullConjugations[tense][person];
        if (cell.text.trim() !== "") {
          try {
            await addConjugation(
              fullVerb.trim().toLowerCase(),
              person,
              tense,
              cell.text.trim().toLowerCase(),
              cell.irregular,
              fullPronominal,
              parseInt(fullVerbGroup)
            );
            confirmations.push(`${person} - ${tense} => OK`);
          } catch (error) {
            confirmations.push(`${person} - ${tense} => FAILED: ${error}`);
          }
        }
      }
    }

    alert(
      `Finished adding all conjugations for "${fullVerb}".\n\n` +
        confirmations.join("\n")
    );

    // Reset all fields after submission.
    setFullVerb("");
    setFullPronominal(false);
    setFullVerbGroup(0);
    setFullConjugations(buildInitialConjugations());
  };

  /***************************************************************
   * Render: Full Verb Conjugation Grid
   ***************************************************************/
  return (
    <div className="min-h-screen w-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white">
      <div className="px-8 py-6 flex flex-col space-y-6">
        <div className="max-w-5xl mx-auto bg-gray-900 p-6 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-6 text-center">
            Add Full Verb Conjugation
          </h1>

          {/* Verb Details */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
            <input
              type="text"
              placeholder="Verb (infinitive), e.g. 'faire'"
              className="p-3 rounded bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white w-64"
              value={fullVerb}
              onChange={(e) => setFullVerb(e.target.value)}
            />
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={fullPronominal}
                onChange={() => setFullPronominal(!fullPronominal)}
                className="w-4 h-4 text-blue-500"
              />
              <span>Pronominal?</span>
            </label>
            <label className="flex items-center space-x-2">
              <span>Group:</span>
              <select
                className="p-2 rounded bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                value={fullVerbGroup}
                onChange={(e) => setFullVerbGroup(e.target.value)}
              >
                <option value={0}>0 - Unknown/No Group</option>
                <option value={1}>1 -er (First Group)</option>
                <option value={2}>2 -ir (Second Group)</option>
                <option value={3}>3 - (Third Group)</option>
              </select>
            </label>
          </div>

          {/* Conjugation Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-center border border-gray-600">
              <thead className="bg-gray-800">
                <tr>
                  <th className="p-2 border border-gray-600">Person / Tense</th>
                  {allTenses.map((tense) => (
                    <th key={tense} className="p-2 border border-gray-600">
                      {tense}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {persons.map((person) => (
                  <tr key={person} className="bg-gray-700 hover:bg-gray-600 transition-colors">
                    <td className="p-2 border border-gray-600 font-semibold">{person}</td>
                    {allTenses.map((tense) => {
                      const cell = fullConjugations[tense][person];
                      return (
                        <td key={tense} className="p-2 border border-gray-600">
                          <input
                            type="text"
                            placeholder="Conjugation"
                            className="p-2 w-28 rounded bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={cell.text}
                            onChange={(e) =>
                              handleFullConjChange(tense, person, "text", e.target.value)
                            }
                          />
                          <label className="flex items-center justify-center mt-1 text-sm">
                            <input
                              type="checkbox"
                              checked={cell.irregular}
                              onChange={(e) =>
                                handleFullConjChange(tense, person, "irregular", e.target.checked)
                              }
                              className="w-4 h-4 text-blue-500 ml-2"
                            />
                            <span className="ml-1 text-xs">irreg?</span>
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Submit Button */}
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

export default AddConjugationPage;
