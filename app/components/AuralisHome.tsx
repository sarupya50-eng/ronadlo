"use client";

import { useRef } from "react";

type Song = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  thumbnail?: string;
  duration?: string;
};

type Props = {
  songs: Song[];
  featured: any[];
  currentSong: Song | null;
  playing: boolean;
  liked: string[];
  playSong: (song: Song) => void;
  toggleLike: (id: string) => void;
  setQueue: React.Dispatch<React.SetStateAction<Song[]>>;
};

export default function AuralisHome({
  songs,
  featured,
  currentSong,
  playing,
  liked,
  playSong,
  toggleLike,
  setQueue,
}: Props) {
  const rails = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollRail = (id: string, amount: number) => {
    rails.current[id]?.scrollBy({
      left: amount,
      behavior: "smooth",
    });
  };

  const addQueue = (song: Song) => {
    setQueue((old) =>
      old.some((item) => item.id === song.id) ? old : [...old, song]
    );
  };

  const popular = featured.map((item) => ({
    id: item.title,
    title: item.title,
    artist: item.artist,
    thumbnail: item.image,
  }));

  const sections = [
    {
      id: "trending",
      label: "🔥 TRENDING",
      title: "Trending now",
      data: songs.slice(0, 12),
    },
    {
      id: "recommended",
      label: "✨ MADE FOR YOU",
      title: "Recommended for you",
      data: songs.slice(2, 14),
    },
    {
      id: "popular",
      label: "📈 DISCOVER",
      title: "Popular right now",
      data: popular,
    },
  ];

  return (
    <div className="auralis-home">
      <section className="auralis-hero">
        <div className="auralis-hero-glow" />

        <div className="auralis-hero-content">
          <span className="section-label">AURALIS DISCOVER</span>

          <h1>
            Find your next
            <br />
            <span>favorite sound.</span>
          </h1>

          <p>
            Discover trending music, hidden gems and songs made for your mood.
          </p>

          <button
            className="auralis-hero-button"
            onClick={() => songs[0] && playSong(songs[0])}
          >
            ▶ Start listening
          </button>
        </div>

        {featured[0] && (
          <div className="auralis-hero-art">
            <img src={featured[0].image} alt="" />
            <div>
              <small>FEATURED TODAY</small>
              <strong>{featured[0].title}</strong>
              <span>{featured[0].artist}</span>
            </div>
          </div>
        )}
      </section>

      {sections.map((section) => (
        <section className="auralis-rail-section" key={section.id}>
          <div className="auralis-section-heading">
            <div>
              <span>{section.label}</span>
              <h2>{section.title}</h2>
            </div>

            <div className="auralis-rail-buttons">
              <button onClick={() => scrollRail(section.id, -650)}>←</button>
              <button onClick={() => scrollRail(section.id, 650)}>→</button>
            </div>
          </div>

          <div
            className="auralis-rail"
            ref={(element) => {
              rails.current[section.id] = element;
            }}
          >
            {section.data.length ? (
              section.data.map((song, index) => (
                <article
                  className={`auralis-song-card ${
                    currentSong?.id === song.id ? "active" : ""
                  }`}
                  key={`${section.id}-${song.id}-${index}`}
                >
                  <button
                    className="auralis-cover"
                    onClick={() => playSong(song)}
                  >
                    {song.thumbnail ? (
                      <img src={song.thumbnail} alt="" loading="lazy" />
                    ) : (
                      <div className="auralis-placeholder">♫</div>
                    )}

                    <span className="auralis-card-play">
                      {currentSong?.id === song.id && playing ? "Ⅱ" : "▶"}
                    </span>
                  </button>

                  <div className="auralis-song-info">
                    <button onClick={() => playSong(song)}>
                      {song.title}
                    </button>
                    <span>{song.artist}</span>
                  </div>

                  <div className="auralis-song-actions">
                    <button
                      onClick={() => toggleLike(song.id)}
                      className={liked.includes(song.id) ? "liked" : ""}
                    >
                      {liked.includes(song.id) ? "♥" : "♡"}
                    </button>

                    <button onClick={() => addQueue(song)}>＋</button>
                  </div>
                </article>
              ))
            ) : (
              <div className="auralis-empty">
                Search for music to discover songs.
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
