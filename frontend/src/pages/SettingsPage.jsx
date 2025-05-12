import React, { useEffect, useState, useRef } from "react";
import { getSettings, saveSettings } from "../services/api";
import { toast } from "react-toastify";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("languages");

  // Top-level
  const [fromLang, setFromLang] = useState("");
  const [toLang, setToLang] = useState("");

  // Vocabulary
  const [parts, setParts] = useState([]);
  const [articles, setArticles] = useState([]);
  const [classes, setClasses] = useState([]);

  // Conjugation
  const [persons, setPersons] = useState([]);
  const [tenses, setTenses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [allowPr, setAllowPr] = useState(true);
  const [allowIr, setAllowIr] = useState(true);

  useEffect(() => {
    getSettings()
      .then((s) => {
        setFromLang(s.sourceLang || "");
        setToLang(s.targetLang || "");
        setParts(s.vocab.partsOfSpeech || []);
        setArticles(s.vocab.articles || []);
        setClasses(s.vocab.classes || []);
        setPersons(s.conj.persons || []);
        setTenses(s.conj.tenses || []);
        setGroups(s.conj.groups || []);
        setAllowPr(s.conj.allowPronominal ?? true);
        setAllowIr(s.conj.allowIrregular ?? true);
      })
      .catch((e) => {
        console.error("Failed to load settings:", e);
        alert("Could not load settings.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Editable pill-list component with refined styling
  const EditableList = ({ label, items, setItems }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newText, setNewText] = useState("");
    const inputRef = useRef(null);
  
    useEffect(() => {
      if (isAdding && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isAdding]);
  
    const finishAdd = () => {
      const trimmed = newText.trim();
      if (trimmed) setItems([...items, trimmed]);
      setNewText("");
      setIsAdding(false);
    };
  
    return (
      <div className="mb-6">
        <h4 className="font-semibold text-lg text-indigo-400 mb-3">{label}</h4>
        <div className="flex flex-wrap gap-3">
          {items.map((it, i) => (
            <div
              key={i}
              className="flex items-center bg-indigo-600 bg-opacity-80 text-white px-4 py-2 rounded-lg shadow-sm"
            >
              <span className="whitespace-nowrap">{it}</span>
              <button
                onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                className="ml-2 p-1 rounded-full hover:bg-red-500 hover:bg-opacity-25 transition"
                aria-label={`Remove ${it}`}
              >
              <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
  
          {isAdding ? (
            <input
              ref={inputRef}
              type="text"
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onBlur={finishAdd}
              onKeyDown={e => e.key === "Enter" && finishAdd()}
              className="px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder={`New ${label}…`}
            />
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="text-sm text-indigo-300 hover:text-indigo-200 underline"
            >
              + Add {label}
            </button>
          )}
        </div>
      </div>
    );
  };
  

  const saveAll = () => {
    const payload = {
      sourceLang: fromLang,
      targetLang: toLang,
      vocab: { partsOfSpeech: parts, articles, classes },
      conj: { persons, tenses, groups, allowPronominal: allowPr, allowIrregular: allowIr },
    };
    saveSettings(payload)
      .then(() => toast.success("Settings saved!"))
      .catch((e) => {
        console.error("Save failed:", e);
        toast.error("Save failed: " + (e.message || e));
      });
  };

  if (loading) {
    return (
      <div className="p-6 text-white">
        <p>Loading settings…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 bg-opacity-50 backdrop-blur-sm py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl bg-gray-800 bg-opacity-75 rounded-xl shadow-xl p-8 space-y-8 text-white">
        <h1 className="text-3xl font-bold text-indigo-400 text-center">
          Your Settings
        </h1>

        {/* Section Tabs */}
        <div className="flex justify-center space-x-6 border-b border-gray-700 pb-4">
          {['languages', 'vocabulary', 'conjugation'].map((sectKey) => {
            const label = sectKey.charAt(0).toUpperCase() + sectKey.slice(1);
            return (
              <button
                key={sectKey}
                onClick={() => setActiveSection(sectKey)}
                className={`pb-2 text-lg font-medium transition-colors ${
                  activeSection === sectKey
                    ? 'border-b-2 border-indigo-400 text-indigo-400'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Panels */}
        {activeSection === 'languages' && (
          <section id="languages" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <label className="flex flex-col space-y-1">
                <span className="text-indigo-300">From:</span>
                <input
                  type="text"
                  value={fromLang}
                  onChange={(e) => setFromLang(e.target.value)}
                  placeholder="e.g. English"
                  className="bg-gray-700 border border-gray-600 rounded-md px-4 py-3 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                />
              </label>
              <label className="flex flex-col space-y-1">
                <span className="text-indigo-300">To:</span>
                <input
                  type="text"
                  value={toLang}
                  onChange={(e) => setToLang(e.target.value)}
                  placeholder="e.g. French"
                  className="bg-gray-700 border border-gray-600 rounded-md px-4 py-3 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                />
              </label>
            </div>
          </section>
        )}

        {activeSection === 'vocabulary' && (
          <section id="vocabulary" className="space-y-6">
            <EditableList label="Parts of Speech" items={parts} setItems={setParts} />
            <EditableList label="Articles" items={articles} setItems={setArticles} />
            <EditableList label="Classes" items={classes} setItems={setClasses} />
          </section>
        )}

        {activeSection === 'conjugation' && (
          <section id="conjugation" className="space-y-6">
            <EditableList label="Persons" items={persons} setItems={setPersons} />
            <EditableList label="Tenses" items={tenses} setItems={setTenses} />
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={allowPr}
                  onChange={() => setAllowPr((v) => !v)}
                  className="h-5 w-5 text-indigo-400 bg-gray-700 rounded focus:ring-2 focus:ring-indigo-400 transition"
                />
                <span className="text-indigo-300">Allow Pronominal</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={allowIr}
                  onChange={() => setAllowIr((v) => !v)}
                  className="h-5 w-5 text-indigo-400 bg-gray-700 rounded focus:ring-2 focus:ring-indigo-400 transition"
                />
                <span className="text-indigo-300">Allow Irregular</span>
              </label>
            </div>
            <EditableList label="Verb Groups" items={groups} setItems={setGroups} />
          </section>
        )}

        {/* Save Button */}
        <div className="text-right">
          <button
            onClick={saveAll}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
