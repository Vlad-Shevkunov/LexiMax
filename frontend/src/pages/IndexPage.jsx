// src/pages/Index.jsx
import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo2.png";

export default function IndexPage() {
  return (
    <div className="min-h-screen w-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white pt-20 px-4 sm:px-8">
      <div className="mx-auto max-w-4xl space-y-12">

        {/* Logo at top */}
        <div className="flex justify-center">
          <img src={logo} alt="LexiMax" className="h-20" />
        </div>

        {/* Intro */}
        <section
          id="intro"
          className="space-y-4 bg-gray-800 bg-opacity-50 rounded-lg p-6 shadow-lg transform hover:scale-[1.02] transition"
        >
          <h1 className="text-5xl font-bold text-indigo-400">
            Welcome to LexiMax
          </h1>
          <p className="text-lg">
            LexiMax helps you master your vocabulary and conjugations with
            interactive games, progress tracking, and a sleek,
            distraction-free interface.
          </p>
        </section>

        {/* Why LexiMax */}
        <section
          id="why"
          className="space-y-4 bg-gray-800 bg-opacity-50 rounded-lg p-6 shadow-lg transform hover:scale-[1.02] transition"
        >
          <h2 className="text-3xl font-semibold text-indigo-400">
            Why LexiMax?
          </h2>
          <div className="space-y-4 text-base">
            <p>
              I decided to make LexiMax when I was trying to learn French.
              Immediately, I realized that there is just so much vocabulary
              and conjugations to memorize.
            </p>
            <p>
              And personally, I was too lazy to go through rigorous
              memorization and spend hours at the textbook. So I built
              a fun, game-based interface to make learning more engaging.
            </p>
            <p>
              At first it was strictly for French, but the same idea works
              for any language (though conjugations fit some languages
              better than others).
            </p>
            <p>
              The premise: add anything you want to memorize, then play
              games to test your recall.
            </p>
            <p>
              Two game styles:
              <strong> graded</strong> (type your answer and get scored)
              or <strong>speed</strong> (race to type the right word
              as quickly as possible).
            </p>
            <p>
              You choose your word sets, articles, game mode—and track
              your progress over time. Enjoy!
            </p>
          </div>
        </section>

        {/* Getting Started */}
        <section
          id="tips"
          className="space-y-4 bg-gray-800 bg-opacity-50 rounded-lg p-6 shadow-lg transform hover:scale-[1.02] transition"
        >
          <h2 className="text-3xl font-semibold text-indigo-400">
            Getting Started
          </h2>
          <ul className="list-disc list-inside space-y-2 text-base">
            <li>
              Add new entries via{" "}
              <Link to="/add-word" className="text-blue-400 underline">
                Add Word
              </Link>{" "}
              and{" "}
              <Link
                to="/add-conjugation"
                className="text-blue-400 underline"
              >
                Add Conjugation
              </Link>
              .
            </li>
            <li>
              Review all your items in{" "}
              <Link to="/words" className="text-blue-400 underline">
                Word List
              </Link>{" "}
              and{" "}
              <Link
                to="/conjugation-list"
                className="text-blue-400 underline"
              >
                Conjugation List
              </Link>
              .
            </li>
            <li>
              Challenge yourself with{" "}
              <Link to="/game" className="text-blue-400 underline">
                Word Game
              </Link>{" "}
              or{" "}
              <Link
                to="/conjugation-game"
                className="text-blue-400 underline"
              >
                Conjugation Game
              </Link>
              .
            </li>
            <li>
              Track your progress in{" "}
              <Link to="/stats" className="text-blue-400 underline">
                Stats
              </Link>
              .
            </li>
            <li>Toggle <em>Zen Mode</em> for a calm, timer-free session.</li>
            <li>
              Tweak everything from hint brackets to theme colors in{" "}
              <Link to="/settings" className="text-blue-400 underline">
                Settings
              </Link>
              .
            </li>
          </ul>
        </section>

        {/* About Me */}
        <section
          id="about"
          className="space-y-4 bg-gray-800 bg-opacity-50 rounded-lg p-6 shadow-lg transform hover:scale-[1.02] transition"
        >
          <h2 className="text-3xl font-semibold text-indigo-400">
            About Me
          </h2>
          <p className="text-base">
            Hi there! I’m <strong>Vladyslav Shevkunov</strong>, a language
            enthusiast and CS major at UC Berkeley. I built LexiMax to make
            language practice fun, engaging, and effective. Peek at the
            source on{" "}
            <a
              href="https://github.com/Vlad-Shevkunov/LexiMax"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              GitHub
            </a>
            .
          </p>
        </section>

        {/* Contact */}
        <section
          id="contact"
          className="space-y-4 bg-gray-800 bg-opacity-50 rounded-lg p-6 shadow-lg transform hover:scale-[1.02] transition"
        >
          <h2 className="text-3xl font-semibold text-indigo-400">
            Get in Touch
          </h2>
          <p className="text-base">
            Questions, feedback, or feature requests? Shoot me a message:
          </p>
          <ul className="space-y-2 text-base">
            <li>
              📧 Email:{" "}
              <a
                href="mailto:vshevkunov@berkeley.edu"
                className="text-blue-400 underline"
              >
                vshevkunov@berkeley.edu
              </a>
            </li>
            <li>
              👔 LinkedIn:{" "}
              <a
                href="https://www.linkedin.com/in/vshevkunov"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline"
              >
                @vshevkunov
              </a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
