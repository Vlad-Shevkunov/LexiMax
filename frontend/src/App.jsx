import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import AddWordPage from "./pages/AddWordPage";
import WordsListPage from "./pages/WordsListPage";
import GamePage from "./pages/GamePage";
import AddConjugationPage from "./pages/AddConjugationPage";
import ConjugationListPage from "./pages/ConjugationListPage";
import ConjugationGamePage from "./pages/ConjugationGamePage";
import StatsPage from "./pages/StatsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import IndexPage from "./pages/IndexPage";
import SettingsPage from "./pages/SettingsPage";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <>
      <ToastContainer />
      <Router>
        {/* 
          A full-screen gradient behind everything.
          The Navbar is fixed at top, so we create a top padding for the content area to avoid overlap. 
        */}
        <div className="min-h-screen w-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white">
          <Navbar />

          {/* 
            Top padding so the page content doesn't hide behind the fixed nav. 
            You can adjust this based on your nav's height. 
          */}
          <div className="pt-20 px-4">
            <Routes>
              <Route path="/" element={<IndexPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/add-word" element={<AddWordPage />} />
              <Route path="/words" element={<WordsListPage />} />
              <Route path="/game" element={<GamePage />} />
              <Route path="/add-conjugation" element={<AddConjugationPage />} />
              <Route path="/conjugation-list" element={<ConjugationListPage />} />
              <Route path="/conjugation-game" element={<ConjugationGamePage />} />
              <Route path="/stats" element={<StatsPage />} />
            </Routes>
          </div>
        </div>
      </Router>
    </>
  );
}

export default App;
