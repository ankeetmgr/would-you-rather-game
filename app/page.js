"use client";

import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [options, setOptions] = useState(["Loading...", "Loading..."]);
  const [selected, setSelected] = useState(null);
  const [votes, setVotes] = useState([50, 50]);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState(0);
  const [level, setLevel] = useState("warmup");
  const [musicOn, setMusicOn] = useState(false);
  const ambienceRef = useRef(null);
  const advanceTimerRef = useRef(null);

  function playSound(frequency) {
    const audio = new AudioContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();

    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.08, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.2);

    oscillator.connect(gain);
    gain.connect(audio.destination);

    oscillator.start();
    oscillator.stop(audio.currentTime + 0.2);
  }

  function playVibeNote(audio, master, frequency) {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const bass = audio.createOscillator();
    const bassGain = audio.createGain();
    const now = audio.currentTime;

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(frequency, now);
    bass.type = "sine";
    bass.frequency.setValueAtTime(frequency / 2, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.065, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
    bassGain.gain.setValueAtTime(0.0001, now);
    bassGain.gain.exponentialRampToValueAtTime(0.11, now + 0.03);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

    oscillator.connect(gain);
    gain.connect(master);
    bass.connect(bassGain);
    bassGain.connect(master);
    oscillator.start(now);
    bass.start(now);
    oscillator.stop(now + 0.42);
    bass.stop(now + 0.46);
  }

  function startAmbience() {
    if (ambienceRef.current) return;

    const audio = new AudioContext();
    const master = audio.createGain();
    const pattern = [220, 329.63, 440, 329.63, 246.94, 369.99, 493.88, 369.99];
    let noteIndex = 0;

    master.gain.value = 0.52;
    master.connect(audio.destination);
    audio.resume();

    const playNextNote = () => {
      playVibeNote(audio, master, pattern[noteIndex]);
      noteIndex = (noteIndex + 1) % pattern.length;
    };

    playNextNote();
    const timer = window.setInterval(playNextNote, 430);

    ambienceRef.current = { audio, timer };
    setMusicOn(true);
  }

  function stopAmbience() {
    if (!ambienceRef.current) return;

    window.clearInterval(ambienceRef.current.timer);
    ambienceRef.current.audio.close();
    ambienceRef.current = null;
    setMusicOn(false);
  }

  function toggleMusic() {
    if (musicOn) {
      stopAmbience();
    } else {
      startAmbience();
    }
  }

  async function loadQuestion(nextLevel = level) {
    setLoading(true);
    setSelected(null);

    try {
      const rating = nextLevel === "chaotic" ? "pg13" : "pg";
      const response = await fetch(`/api/wyr?rating=${rating}`);
      const data = await response.json();

      setOptions(data.options);

      const leftVotes = Math.floor(Math.random() * 51) + 25;
      setVotes([leftVotes, 100 - leftVotes]);

    } catch {
      const fallbackOptions = [
        "Always have free pizza",
        "Always have free ice cream",
      ];

      setOptions(fallbackOptions);

    }

    setLoading(false);
  }

  function chooseOption(index) {
    if (selected !== null || loading) return;

    setSelected(index);
    playSound(index === 0 ? 280 : 440);

    const nextAnswerCount = answers + 1;
    const nextLevel = nextAnswerCount >= 5 ? "chaotic" : "warmup";

    setAnswers(nextAnswerCount);
    setLevel(nextLevel);

    advanceTimerRef.current = window.setTimeout(() => {
      loadQuestion(nextLevel);
    }, 1200);
  }

  useEffect(() => {
    loadQuestion();

    return () => {
      if (ambienceRef.current) {
        window.clearInterval(ambienceRef.current.timer);
        ambienceRef.current.audio.close();
      }
      window.clearTimeout(advanceTimerRef.current);
    };
  }, []);

  return (
    <main className="game">
      <section className="hero">
        <button
          className={`music-button ${musicOn ? "music-on" : ""}`}
          onClick={toggleMusic}
          aria-pressed={musicOn}
        >
          {musicOn ? "🎵 Music on" : "🔇 Music off"}
        </button>
        <span className="sticker left-sticker">🤯</span>
        <span className="sticker right-sticker">🍿</span>

        <p className="eyebrow">THE INTERNET&apos;S HARDEST DECISIONS</p>
        <h1>WOULD YOU RATHER?</h1>
        <p className={`level-badge ${level}`}>
          {level === "chaotic"
            ? "LEVEL 2 · CHAOTIC MODE"
            : `LEVEL 1 · WARM-UP ${answers}/5`}
        </p>

        <div className="characters">
          <div className="face">😄</div>
          <span className="vs">VS</span>
          <div className="face">😏</div>
        </div>
      </section>

      <section className="choices">
        <button
          className={`choice red ${selected === 0 ? "selected" : ""}`}
          onClick={() => chooseOption(0)}
          disabled={selected !== null || loading}
        >
          {options[0]}
          {selected === 0 && <strong>{votes[0]}% picked this</strong>}
        </button>

        <div className="or">OR</div>

        <button
          className={`choice blue ${selected === 1 ? "selected" : ""}`}
          onClick={() => chooseOption(1)}
          disabled={selected !== null || loading}
        >
          {options[1]}
          {selected === 1 && <strong>{votes[1]}% picked this</strong>}
        </button>
      </section>

    </main>
  );
}
