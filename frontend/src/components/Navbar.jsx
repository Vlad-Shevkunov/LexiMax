import { Link, useLocation, useNavigate} from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { logoutUser } from "../services/api"; // adjust the import as needed
function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "error";

  // For demonstration, we assume the server sends the session cookie
  // and that on page load you might have an endpoint to get the current user.
  // If you don't, you can also store the username on a global state when logging in.
  useEffect(() => {
    // Example: try to get user info from a session endpoint.
    axios.get(`${API_BASE_URL}/current_user`, { withCredentials: true })
      .then(res => {
        if (res.data && res.data.username) {
          setUsername(res.data.username);
        }
      })
      .catch(err => console.error("Error fetching current user:", err));
  }, [location]);

  const handleLogout = async () => {
    try {
      await logoutUser(); // call the API to log out
      setUsername("");   // clear our local username state
      navigate("/login"); // redirect the user to the login page
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

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
            to="/login"
            className={`
              px-4 py-2 rounded-md transition-colors duration-150 
              ${
                location.pathname === "/login"
                  ? "bg-gray-700"
                  : "hover:bg-gray-800"
              }
            `}
          >
            Login
          </Link>
        </li>
        <li>
          <Link
            to="/register"
            className={`
              px-4 py-2 rounded-md transition-colors duration-150 
              ${
                location.pathname === "/register"
                  ? "bg-gray-700"
                  : "hover:bg-gray-800"
              }
            `}
          >
            Register
          </Link>
        </li>
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
      {username && (
        <div className="absolute right-4 top-4 text-sm flex items-center space-x-2">
          <span>
            Signed in as <strong>{username}</strong>
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-white transition-colors duration-150"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
