import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();

  return (
    <nav
      className="
        fixed top-0 w-full z-50
        bg-gradient-to-r from-gray-900 via-gray-800 to-black
        text-white p-4 shadow-lg
      "
    >
      <ul className="flex justify-center items-center space-x-6 text-sm md:text-base">
        <li>
          <Link
            to="/"
            className={`
              px-4 py-2 rounded-md transition-colors duration-150 
              ${
                location.pathname === "/"
                  ? "bg-gray-700"
                  : "hover:bg-gray-800"
              }
            `}
          >
            Add Word
          </Link>
        </li>
        <li>
          <Link
            to="/words"
            className={`
              px-4 py-2 rounded-md transition-colors duration-150 
              ${
                location.pathname === "/words"
                  ? "bg-gray-700"
                  : "hover:bg-gray-800"
              }
            `}
          >
            Word List
          </Link>
        </li>
        <li>
          <Link
            to="/game"
            className={`
              px-4 py-2 rounded-md transition-colors duration-150
              ${
                location.pathname === "/game"
                  ? "bg-gray-700"
                  : "hover:bg-gray-800"
              }
            `}
          >
            Word Game
          </Link>
        </li>
        <li>
          <Link
            to="/add-conjugation"
            className={`
              px-4 py-2 rounded-md transition-colors duration-150
              ${
                location.pathname === "/add-conjugation"
                  ? "bg-gray-700"
                  : "hover:bg-gray-800"
              }
            `}
          >
            Add Conjugation
          </Link>
        </li>
        <li>
          <Link
            to="/conjugation-list"
            className={`
              px-4 py-2 rounded-md transition-colors duration-150
              ${
                location.pathname === "/conjugation-list"
                  ? "bg-gray-700"
                  : "hover:bg-gray-800"
              }
            `}
          >
            Conjugation List
          </Link>
        </li>
        <li>
          <Link
            to="/conjugation-game"
            className={`
              px-4 py-2 rounded-md transition-colors duration-150
              ${
                location.pathname === "/conjugation-game"
                  ? "bg-gray-700"
                  : "hover:bg-gray-800"
              }
            `}
          >
            Conjugation Game
          </Link>
        </li>
        <li>
          <Link
            to="/stats"
            className={`
              px-4 py-2 rounded-md transition-colors duration-150
              ${
                location.pathname === "/stats"
                  ? "bg-gray-700"
                  : "hover:bg-gray-800"
              }
            `}
          >
            Stats
          </Link>
        </li> 
      </ul>
    </nav>
  );
}

export default Navbar;
