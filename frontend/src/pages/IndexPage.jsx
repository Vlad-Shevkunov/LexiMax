// src/pages/Index.jsx
import React from "react";

export default function IndexPage() {
  return (
    <div className="min-h-screen w-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white pt-20 px-4 sm:px-8">
      <div className="mx-auto max-w-4xl space-y-16">
        {/* Intro */}
        <section id="intro" className="space-y-4">
          <h1 className="text-5xl font-bold">Welcome to LexiMax</h1>
          <p className="text-lg">
            LexiMax helps you master your vocabulary and conjugations with interactive
            games, progress tracking, and a sleek, distraction-free interface. 
          </p>
        </section>

        <section id="why" className="space-y-4">
          <h2 className="text-3xl font-semibold">Why LexiMax?</h2>
          <p className="text-base">
            I decided to make LexiMax when I was trying to learn French. Immediately, I realized that there is just so much vocabulary and conjugations to memorize. 
            And personally, I was too lazy to go through rigorous memorization and spend hours at the textbook. So, I decided to create a fun game based interface
            to make learning more fun. Initially, I only intended this to be a French-learning website, but I quickly realized the same idea for a vocabulary game 
            can be applied to other languages as well (though the conjugation game is certainly more relatable to certain languages more than others).
            
            The basic premise here comes that you can add any things you want to memorize and then play games to test your knowledge. There are two main game styles:
            graded, where you have to submit your answer and will then be graded on whether it was correct or not; ungraded, where you have to answer the question
            as fast as possible and will be automatically moved on once you type the correct option. You have a lot of control about the type of game you want to play, 
            the words you include, whether you want to have articles for the words, and more. Hope you enjoy!
          </p>
        </section>

        {/* Tips */}
        <section id="tips" className="space-y-4">
          <h2 className="text-3xl font-semibold">Getting Started</h2>
          <ul className="list-disc list-inside space-y-2 text-base">
            <li>Add new entries via <strong>Add Word</strong> and <strong>Add Conjugation</strong>.</li>
            <li>Review all your items in <strong>Word List</strong> and <strong>Conjugation List</strong>.</li>
            <li>Challenge yourself under <strong>Word Game</strong> or <strong>Conjugation Game</strong>.</li>
            <li>Check your performance over time in <strong>Stats</strong>.</li>
            <li>Toggle <em>Zen Mode</em> for a calm, timer-free session.</li>
            <li>Add brackets in the translation for tips that won't get graded later</li>
          </ul>
        </section>

        {/* About Me */}
        <section id="about" className="space-y-4">
          <h2 className="text-3xl font-semibold">About Me</h2>
          <p className="text-base">
            Hi there! I’m <strong>Vladyslav Shevkunov</strong>, a language enthusiast and computer science
            major at UC Berkeley. I built LexiMax to make French practice fun, engaging, and effective.
            You can peek at the source on{" "}
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
        <section id="contact" className="space-y-4">
          <h2 className="text-3xl font-semibold">Get in Touch</h2>
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
             👔 Linkedin:{" "}
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
