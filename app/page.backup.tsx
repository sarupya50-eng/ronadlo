"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Song = {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  thumbnail: string | null;
  duration: string | null;
};

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(70);

  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.YT) {
      createPlayer();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.body.appendChild(script);

    window.onYouTubeIframeAPIReady = createPlayer;

    return () => {
      window.onYouTubeIframeAPIReady = () => {};
    };
  }, []);

  function createPlayer() {
    if (!playerContainerRef.current || playerRef.current) return;

    playerRef.current = new window.YT.Player(
      playerContainerRef.current,
      {
        height: "1",
        width: "1",
        videoId: "",
        playerVars: {
          autoplay: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(volume);
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setPlaying(true);
            }

            if (event.data === window.YT.PlayerState.PAUSED) {
              setPlaying(false);
            }

            if (event.data === window.YT.PlayerState.ENDED) {
              nextSong();
            }
          },
        },
      }
    );
  }

  async function search(e: FormEvent) {
    e.preventDefault();

    if (!query.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setSongs(data.results || []);
    } catch {
      setError("Could not connect to the music search server.");
    } finally {
      setLoading(false);
    }
  }

  function playSong(song: Song) {
    setCurrentSong(song);

    if (!playerRef.current) {
      setTimeout(() => {
        if (playerRef.current) {
          playerRef.current.loadVideoById(song.id);
          playerRef.current.playVideo();
        }
      }, 500);

      return;
    }

    playerRef.current.loadVideoById(song.id);
    playerRef.current.playVideo();
  }

  function togglePlay() {
    if (!currentSong || !playerRef.current) return;

    const state = playerRef.current.getPlayerState();

    if (
      state === window.YT.PlayerState.PLAYING
    ) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }

  function nextSong() {
    if (!currentSong || songs.length === 0) return;

    const index = songs.findIndex(
      (song) => song.id === currentSong.id
    );

    const next = songs[(index + 1) % songs.length];

    if (next) {
      playSong(next);
    }
  }

  function previousSong() {
    if (!currentSong || songs.length === 0) return;

    const index = songs.findIndex(
      (song) => song.id === currentSong.id
    );

    const previous =
      songs[(index - 1 + songs.length) % songs.length];

    if (previous) {
      playSong(previous);
    }
  }

  function changeVolume(value: number) {
    setVolume(value);

    if (playerRef.current) {
      playerRef.current.setVolume(value);
    }
  }

  return (
    <>
      <div ref={playerContainerRef} className="youtube-player" />

      <main className="auralis">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-icon">A</div>
            <span>Auralis</span>
          </div>

          <nav>
            <button className="nav-active">
              <span>⌂</span>
              Home
            </button>

            <button>
              <span>⌕</span>
              Search
            </button>

            <button>
              <span>♡</span>
              Liked Songs
            </button>

            <button>
              <span>▣</span>
              Library
            </button>
          </nav>

          <div className="sidebar-footer">
            <span>AURALIS MUSIC</span>
            <p>Your music. Your way.</p>
          </div>
        </aside>

        <section className="content">
          <header className="topbar">
            <div>
              <span className="eyebrow">
                AURALIS MUSIC
              </span>

              <h1>Find your sound.</h1>
            </div>

            <form
              className="search-box"
              onSubmit={search}
            >
              <span>⌕</span>

              <input
                value={query}
                onChange={(e) =>
                  setQuery(e.target.value)
                }
                placeholder="Search songs, artists..."
              />

              <button type="submit">
                Search
              </button>
            </form>
          </header>

          {!songs.length && !loading && (
            <section className="hero">
              <div>
                <span>DISCOVER MUSIC</span>

                <h2>
                  Music that sounds
                  <br />
                  like you.
                </h2>

                <p>
                  Search millions of songs,
                  artists and albums.
                </p>

                <button
                  onClick={() => {
                    setQuery("Imagine Dragons");
                  }}
                >
                  Start discovering →
                </button>
              </div>

              <div className="hero-art">
                <div>♪</div>
              </div>
            </section>
          )}

          {loading && (
            <div className="status">
              Searching for <b>{query}</b>...
            </div>
          )}

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          {!loading && songs.length > 0 && (
            <section className="results">
              <div className="section-title">
                <div>
                  <span>SEARCH RESULTS</span>
                  <h2>Results for "{query}"</h2>
                </div>

                <small>
                  {songs.length} songs
                </small>
              </div>

              <div className="song-list">
                {songs.map((song, index) => (
                  <div
                    className={`song-row ${
                      currentSong?.id === song.id
                        ? "selected"
                        : ""
                    }`}
                    key={song.id}
                  >
                    <span className="number">
                      {currentSong?.id === song.id &&
                      playing
                        ? "♫"
                        : index + 1}
                    </span>

                    <div className="song-cover">
                      {song.thumbnail ? (
                        <img
                          src={song.thumbnail}
                          alt=""
                        />
                      ) : (
                        <span>♪</span>
                      )}
                    </div>

                    <div className="song-info">
                      <strong>
                        {song.title}
                      </strong>

                      <span>
                        {song.artist}
                      </span>
                    </div>

                    <div className="song-album">
                      {song.album || "Single"}
                    </div>

                    <span className="song-duration">
                      {song.duration || "--:--"}
                    </span>

                    <button
                      className="play-button"
                      onClick={() =>
                        playSong(song)
                      }
                      title="Play"
                    >
                      {currentSong?.id === song.id &&
                      playing
                        ? "❚❚"
                        : "▶"}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </section>

        {currentSong && (
          <div className="bottom-player">
            <div className="now-playing">
              <div className="player-cover">
                {currentSong.thumbnail && (
                  <img
                    src={currentSong.thumbnail}
                    alt=""
                  />
                )}
              </div>

              <div>
                <strong>
                  {currentSong.title}
                </strong>

                <span>
                  {currentSong.artist}
                </span>
              </div>
            </div>

            <div className="player-center">
              <div className="player-controls">
                <button
                  onClick={previousSong}
                  title="Previous"
                >
                  ⏮
                </button>

                <button
                  className="big-play"
                  onClick={togglePlay}
                >
                  {playing ? "❚❚" : "▶"}
                </button>

                <button
                  onClick={nextSong}
                  title="Next"
                >
                  ⏭
                </button>
              </div>

              <div className="player-line">
                <span>♪</span>

                <div className="line" />

                <span>
                  {currentSong.duration ||
                    "--:--"}
                </span>
              </div>
            </div>

            <div className="volume">
              <span>🔊</span>

              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) =>
                  changeVolume(
                    Number(e.target.value)
                  )
                }
              />
            </div>
          </div>
        )}
      </main>
    </>
  );
}
