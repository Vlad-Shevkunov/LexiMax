import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { logoutUser } from "../services/api";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const navRef = useRef(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/current_user`, { withCredentials: true })
      .then((res) => setUsername(res.data.username || ""))
      .catch(() => setUsername(""));
  }, [location]);

  useEffect(() => {
    function onClick(e) {
      // if click is *outside* the <nav>, close any open dropdown:
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const isActive = (path) => location.pathname === path;
  const handleLogout = async () => {
    await logoutUser();
    setUsername("");
    navigate("/login");
  };

  const MenuItem = ({ to, label }) => (
    <Link
      to={to}
      className={`
        block px-4 py-2 whitespace-nowrap hover:bg-gray-700
        ${isActive(to) ? "bg-gray-700" : ""}
      `}
      onClick={() => setOpenMenu(null)}
    >
      {label}
    </Link>
  );

  const Dropdown = ({ name, label, items }) => (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();            // <-- prevent document-click
          setOpenMenu(openMenu === name ? null : name);
        }}
        className={`flex items-center gap-1 rounded bg-gray-800 px-3 py-2 hover:bg-gray-700 transition 
          ${openMenu === name ? "bg-gray-700" : ""}`}
      >
        {label} ▾
      </button>

      {openMenu === name && (
        <ul className="absolute left-0 mt-1 w-44 rounded bg-gray-800 shadow-lg z-20">
          {items.map((i) => (
            <MenuItem key={i.to} to={i.to} label={i.label} />
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <nav
      ref={navRef}
      className="fixed inset-x-0 top-0 z-50 bg-gray-900 text-white shadow"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Brand */}
        <Link to="/" className="text-lg font-bold hover:text-gray-300 transition">
          LexiMax
        </Link>

        {/* Main menu */}
        <div className="flex items-center space-x-6">
          <Dropdown
            name="vocab"
            label="Vocabulary"
            items={[
              { to: "/add-word", label: "Add Word" },
              { to: "/words", label: "Word List" },
              { to: "/game", label: "Word Game" },
            ]}
          />
          <Dropdown
            name="conj"
            label="Conjugation"
            items={[
              { to: "/add-conjugation", label: "Add Conjugation" },
              { to: "/conjugation-list", label: "Conjugation List" },
              { to: "/conjugation-game", label: "Conjugation Game" },
            ]}
          />
          <Dropdown
            name="stats"
            label="Configuration"
            items={[
              { to: "/stats", label: "Stats" },
              { to: "/settings", label: "Settings" },
            ]}
          />
        </div>

        {/* Auth / user */}
        <div className="flex items-center space-x-4">
          {!username ? (
            <>
              <Link
                to="/login"
                className={`rounded bg-gray-800 px-3 py-2 hover:bg-gray-700 transition ${
                  isActive("/login") ? "bg-gray-700" : ""
                }`}
              >
                Login
              </Link>
              <Link
                to="/register"
                className={`rounded bg-gray-800 px-3 py-2 hover:bg-gray-700 transition ${
                  isActive("/register") ? "bg-gray-700" : ""
                }`}
              >
                Register
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();  
                  setOpenMenu(openMenu === "user" ? null : "user");
                }}
                className={`flex items-center gap-1 rounded bg-gray-800 px-3 py-2 hover:bg-gray-700 transition 
                  ${openMenu === "user" ? "bg-gray-700" : ""}`}
              >
                Signed in as <strong>{username}</strong> ▾
              </button>
              {openMenu === "user" && (
                <ul className="absolute right-0 mt-1 w-32 rounded bg-gray-800 shadow-lg z-20">
                  <li>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-gray-700"
                    >
                      Logout
                    </button>
                  </li>
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
