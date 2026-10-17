"use client";
import { Heart, Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, Music2, ListMusic, Volume2, Home as HomeIcon, Search, Library, Clock3, Sparkles, Disc3, MoreHorizontal, Headphones, ChevronRight, ChevronLeft } from "lucide-react";

import { FormEvent, useEffect, useRef, useState } from "react";
import YouTube, { YouTubePlayer } from "react-youtube";
import "./home.css";

type Song = {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  thumbnail: string | null;
  duration: string | null;
};

const featured = [
  {
    title: "Believer",
    artist: "Imagine Dragons",
    image:
      "https://yt3.googleusercontent.com/weYQWfEwWNPOuAm34geXN1LkSYPlsJay78NnQgHC3PKsyZcdvBHIsMtqoFh3rioA4XgMdHMQd3h6vH6mbA=w500-h500-l90-rj",
  },
  {
    title: "Blinding Lights",
    artist: "The Weeknd",
    image:
      "https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg",
  },
  {
    title: "Starboy",
    artist: "The Weeknd",
    image:
      "https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg",
  },
  {
    title: "Heat Waves",
    artist: "Glass Animals",
    image:
      "https://i.ytimg.com/vi/mRD0-GxqHVo/hqdefault.jpg",
  },
  {
    title: "Levitating",
    artist: "Dua Lipa",
    image:
      "https://i.ytimg.com/vi/TUVcZfQe-Kw/hqdefault.jpg",
  },
  {
    title: "As It Was",
    artist: "Harry Styles",
    image:
      "https://i.ytimg.com/vi/H5v3kku4y6Q/hqdefault.jpg",
  },
  {
    title: "Watermelon Sugar",
    artist: "Harry Styles",
    image:
      "https://i.ytimg.com/vi/E07s5ZYygMg/hqdefault.jpg",
  },
  {
    title: "Sunflower",
    artist: "Post Malone, Swae Lee",
    image:
      "https://i.ytimg.com/vi/ApXoWvfEYVU/hqdefault.jpg",
  },
  {
    title: "Circles",
    artist: "Post Malone",
    image:
      "https://i.ytimg.com/vi/wXhTHyIgQ_U/hqdefault.jpg",
  },
  {
    title: "Stay",
    artist: "The Kid LAROI, Justin Bieber",
    image:
      "https://i.ytimg.com/vi/kTJczUoc26U/hqdefault.jpg",
  },
  {
    title: "Say So",
    artist: "Doja Cat",
    image:
      "https://i.ytimg.com/vi/pok8H_KF1FA/hqdefault.jpg",
  },
  {
    title: "Peaches",
    artist: "Justin Bieber",
    image:
      "https://i.ytimg.com/vi/tQ0yjYUFKAE/hqdefault.jpg",
  },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [playing, setPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const playingRef = useRef(false);
  const seekingRef = useRef(false);
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const liked = likedSongs.map((item) => item.id);
  const [contextList, setContextList] = useState<Song[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const lastEndRef = useRef(0);
  const nextSongRef = useRef<(auto?: boolean) => void>(() => {});
  const [queue, setQueue] = useState<Song[]>([]);
  const [draggedQueueIndex, setDraggedQueueIndex] = useState<number | null>(null);
  const [showQueue, setShowQueue] = useState(false);
  const [activeView, setActiveView] = useState<"home" | "search" | "liked" | "library" | "recent" | "made" | "albums">("home");
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const [activePlaylist, setActivePlaylist] = useState<string | null>(null);
  const [selectedAtmosphere, setSelectedAtmosphere] = useState("Night Drive");
  const [atmosphereSongs, setAtmosphereSongs] = useState<Record<string, Song[]>>({});
  const [atmosphereLoading, setAtmosphereLoading] = useState(false);

  const atmosphereData = [
    {
      name: "Night Drive",
      icon: "☾",
      description: "Dark & atmospheric",
      query: "night drive"
    },
    {
      name: "Energy",
      icon: "ϟ",
      description: "Powerful & upbeat",
      query: "high energy"
    },
    {
      name: "Chill",
      icon: "☁",
      description: "Smooth & relaxed",
      query: "chill relaxing"
    },
    {
      name: "Trending",
      icon: "✦",
      description: "Popular right now",
      query: "trending"
    }
  ];

  async function selectAtmosphere(name: string, queryText: string) {
    setSelectedAtmosphere(name);
    setAtmosphereLoading(true);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(queryText)}`
      );

      const data = await response.json();

      if (response.ok) {
        const results: Song[] = (data.results || []).slice(0, 8);

        setAtmosphereSongs((old) => ({ ...old, [name]: results }));
      }
    } catch {
      console.error("Atmosphere search failed");
    } finally {
      setAtmosphereLoading(false);
    }
  }

  /* ---------- HOME helpers ---------- */

  const [greeting, setGreeting] = useState("Welcome back");
  const [loadingCard, setLoadingCard] = useState<string | null>(null);
  const popularRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();

    setGreeting(
      hour < 5
        ? "Late night listening"
        : hour < 12
        ? "Good morning"
        : hour < 17
        ? "Good afternoon"
        : hour < 21
        ? "Good evening"
        : "Late night listening"
    );

    // Fill the atmosphere section on first load so Home never looks empty
    selectAtmosphere("Night Drive", "night drive");
  }, []);

  async function playFeatured(item: { title: string; artist: string }) {
    if (loadingCard) return;

    setLoadingCard(item.title);
    setQuery(item.title);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(`${item.title} ${item.artist}`)}`
      );

      const data = await response.json();
      const results: Song[] = data.results || [];

      if (results.length > 0) {
        setSongs(results);
        playSong(results[0], results);
      }
    } catch (error) {
      console.error("Failed to play song:", error);
    } finally {
      setLoadingCard(null);
    }
  }

  function scrollPopular(direction: 1 | -1) {
    popularRef.current?.scrollBy({
      left: direction * 640,
      behavior: "smooth",
    });
  }

  const [playlists, setPlaylists] = useState<
    { name: string; songs: Song[] }[]
  >([]);

  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [songForPlaylist, setSongForPlaylist] = useState<Song | null>(null);
  const [selectedPlaylistSongs, setSelectedPlaylistSongs] = useState<string[]>([]);
  const [showMovePlaylist, setShowMovePlaylist] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [optionsSong, setOptionsSong] = useState<Song | null>(null);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [volume, setVolume] = useState(0.8);
  const [progress, setProgress] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [duration, setDuration] = useState(0);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsError, setLyricsError] = useState(false);
  const [lyricsPosition, setLyricsPosition] = useState({
    x: 30,
    y: 120,
  });
  const [draggingLyrics, setDraggingLyrics] = useState(false);
  const [resizingPanel, setResizingPanel] = useState<string | null>(null);

  const resizeRef = useRef({
    panel: "",
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startLeft: 0,
    startTop: 0,
    direction: "",
  });

  function startPanelResize(
    e: React.PointerEvent,
    panel: "lyrics" | "queue",
    direction: string
  ) {
    e.preventDefault();
    e.stopPropagation();

    const element = e.currentTarget.parentElement;
    if (!element) return;

    const rect = element.getBoundingClientRect();

    resizeRef.current = {
      panel,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
      startLeft: rect.left,
      startTop: rect.top,
      direction,
    };

    setResizingPanel(panel);

    const move = (event: PointerEvent) => {
      const r = resizeRef.current;

      let width = r.startWidth;
      let height = r.startHeight;
      let left = r.startLeft;
      let top = r.startTop;

      const dx = event.clientX - r.startX;
      const dy = event.clientY - r.startY;

      if (r.direction.includes("e")) {
        width = r.startWidth + dx;
      }

      if (r.direction.includes("w")) {
        width = r.startWidth - dx;
        left = r.startLeft + dx;
      }

      if (r.direction.includes("s")) {
        height = r.startHeight + dy;
      }

      if (r.direction.includes("n")) {
        height = r.startHeight - dy;
        top = r.startTop + dy;
      }

      width = Math.max(300, Math.min(width, window.innerWidth * 0.9));
      height = Math.max(260, Math.min(height, window.innerHeight * 0.85));

      const target = document.querySelector(
        r.panel === "lyrics" ? ".lyrics-panel" : ".queue-panel"
      ) as HTMLElement | null;

      if (!target) return;

        target.style.width = `${width}px`;
        target.style.height = `${height}px`;

        if (r.panel === "queue") {
          target.style.right = "650px";
          target.style.left = "auto";
          target.style.top = "auto";
          target.style.bottom = "105px";
        } else {
          target.style.right = "auto";
          target.style.bottom = "auto";
          target.style.left = `${left}px`;
          target.style.top = `${top}px`;

          setLyricsPosition({
            x: left,
            y: top,
          });
        }
    };

    const stop = () => {
      setResizingPanel(null);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  }

  const lyricsDrag = useRef({
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
  });
  const [lyrics, setLyrics] = useState<string[]>([
  ]);

  const LYRIC_OFFSET = 2.5; // seconds — increase if lyrics still show early
  const [syncedLyrics, setSyncedLyrics] = useState<
    { time: number; text: string }[]
  >([]);
  const [activeLyric, setActiveLyric] = useState(-1);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const visualProgressRef = useRef(0);
  const lastSyncTimeRef = useRef(0);
  const lastSyncAtRef = useRef(0);
  const lyricRefs = useRef<(HTMLDivElement | null)[]>([]);


  async function search(e?: FormEvent) {
    e?.preventDefault();

    if (!query.trim()) return;

    setSearching(true);
    setSearchError("");

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}`
      );

      const data = await response.json();

      if (response.ok) {
        setSongs(data.results || []);
      } else {
        setSongs([]);
        setSearchError(
          data?.error || "Search failed. Please try again in a moment."
        );
      }
    } catch {
      console.error("Search failed");
      setSearchError("Couldn't reach the server. Check your connection.");
    } finally {
      setSearching(false);
      setHasSearched(true);
    }
  }

  function playSong(song: Song, list?: Song[]) {
    // Remember which list the song was played from so Next / Previous /
    // Shuffle work no matter where the user started playing
    if (list && list.length > 0) {
      setContextList(list);
    }

    if (currentSong?.id === song.id) {
      setPlaying((value) => !value);
      return;
    }

    setCurrentSong(song);
    setPlaying(true);

    setRecentlyPlayed((old) => [
      song,
      ...old.filter((item) => item.id !== song.id),
    ].slice(0, 20));

    const detected = detectAtmosphere(song);
    const atmosphere = typeof detected === "string"
      ? detected
      : detected.atmosphere;

    setAtmosphereSongs((old) => {
      const existing: Song[] = old[atmosphere] || [];

      return {
        ...old,
        [atmosphere]: [
          song,
          ...existing.filter((item: Song) => item.id !== song.id),
        ].slice(0, 12),
      };
    });
  }


  /* =========================================================
     AURALIS — SMART ATMOSPHERE DETECTION
  ========================================================= */

  const [atmosphereReason, setAtmosphereReason] = useState(
    "Ready for your next vibe"
  );

  function detectAtmosphere(song: Song) {
    const text =
      `${song.title} ${song.artist} ${song.album || ""}`.toLowerCase();

    const scores = {
      "Night Drive": 0,
      Energy: 0,
      Chill: 0,
      Trending: 0,
    };

    const reasons: Record<string, string[]> = {
      "Night Drive": [],
      Energy: [],
      Chill: [],
      Trending: [],
    };

    const add = (
      atmosphere: keyof typeof scores,
      points: number,
      reason: string
    ) => {
      scores[atmosphere] += points;
      reasons[atmosphere].push(reason);
    };

    const nightWords = [
      ["phonk", 5, "phonk"],
      ["drift", 4, "drift"],
      ["bass", 3, "heavy bass"],
      ["dark", 4, "dark"],
      ["night", 4, "night"],
      ["midnight", 5, "midnight"],
      ["slowed", 4, "slowed"],
      ["aggressive", 4, "aggressive"],
      ["shadow", 3, "dark atmosphere"],
      ["nightcore", 4, "nightcore"],
    ];

    const energyWords = [
      ["party", 5, "party"],
      ["dance", 4, "dance"],
      ["club", 5, "club"],
      ["remix", 3, "remix"],
      ["edm", 5, "EDM"],
      ["house", 4, "house"],
      ["energy", 5, "high energy"],
      ["hype", 5, "hype"],
      ["workout", 4, "workout"],
      ["festival", 5, "festival"],
      ["beat", 2, "strong beat"],
    ];

    const chillWords = [
      ["chill", 5, "chill"],
      ["lofi", 5, "lo-fi"],
      ["lo-fi", 5, "lo-fi"],
      ["relax", 5, "relaxed"],
      ["acoustic", 4, "acoustic"],
      ["calm", 5, "calm"],
      ["sleep", 5, "sleep"],
      ["ambient", 5, "ambient"],
      ["soft", 3, "soft"],
      ["slow", 3, "slow"],
      ["piano", 3, "piano"],
      ["rain", 4, "rainy atmosphere"],
    ];

    const trendingWords = [
      ["viral", 5, "viral"],
      ["trending", 6, "trending"],
      ["hits", 3, "popular"],
      ["hit", 3, "popular"],
      ["top", 2, "popular"],
      ["2026", 2, "new release"],
    ];

    for (const [word, points, reason] of nightWords) {
      if (text.includes(word as string)) {
        add("Night Drive", points as number, reason as string);
      }
    }

    for (const [word, points, reason] of energyWords) {
      if (text.includes(word as string)) {
        add("Energy", points as number, reason as string);
      }
    }

    for (const [word, points, reason] of chillWords) {
      if (text.includes(word as string)) {
        add("Chill", points as number, reason as string);
      }
    }

    for (const [word, points, reason] of trendingWords) {
      if (text.includes(word as string)) {
        add("Trending", points as number, reason as string);
      }
    }

    let selected = "Trending";
    let highest = scores.Trending;

    for (const name of ["Night Drive", "Energy", "Chill"] as const) {
      if (scores[name] > highest) {
        selected = name;
        highest = scores[name];
      }
    }

    if (highest === 0) {
      return {
        atmosphere: "Trending",
        reason: "Auralis is exploring what's popular for you",
      };
    }

    const selectedReasons = reasons[selected];

    return {
      atmosphere: selected,
      reason:
        selectedReasons.length > 0
          ? `Detected from ${selectedReasons.slice(0, 2).join(" + ")}`
          : "Matched to your current song",
    };
  }

  useEffect(() => {
    if (!currentSong) {
      setAtmosphereReason("Ready for your next vibe");
      return;
    }

    const detected = detectAtmosphere(currentSong);

    setAtmosphereReason(detected.reason);

    if (detected.atmosphere !== selectedAtmosphere) {
      const atmosphere = atmosphereData.find(
        (item) => item.name === detected.atmosphere
      );

      if (atmosphere) {
        selectAtmosphere(atmosphere.name, atmosphere.query);
      }
    }
  }, [currentSong?.id]);


  function createPlaylist() {
    const name = playlistName.trim();

    if (!name) return;

    setPlaylists((old) => {
      if (old.some((playlist) => playlist.name === name)) return old;
      return [...old, { name, songs: [] }];
    });

    setPlaylistName("");
    setShowCreatePlaylist(false);
  }

  function toggleLike(song: Song) {
    setLikedSongs((old) =>
      old.some((item) => item.id === song.id)
        ? old.filter((item) => item.id !== song.id)
        : [song, ...old]
    );
  }

  function addToQueue(song: Song) {
    setQueue((old) => {
      if (old.some((item) => item.id === song.id)) {
        return old;
      }

      return [...old, song];
    });
  }

  function removeFromQueue(id: string) {
    setQueue((old) => old.filter((song) => song.id !== id));
  }

  function clearQueue() {
    setQueue([]);
  }

  function restartCurrent() {
    const player = playerRef.current;

    if (player) {
      player.seekTo(0, true);
      player.playVideo();
    }

    setPlaying(true);
  }

  function pickNeighbour(direction: 1 | -1): Song | null {
    const list = contextList.length > 0 ? contextList : songs;

    if (!currentSong || list.length === 0) return null;

    if (shuffle && direction === 1 && list.length > 1) {
      let candidate = list[Math.floor(Math.random() * list.length)];

      while (candidate.id === currentSong.id) {
        candidate = list[Math.floor(Math.random() * list.length)];
      }

      return candidate;
    }

    const index = list.findIndex((s) => s.id === currentSong.id);

    if (index === -1) return list[0];

    return list[(index + direction + list.length) % list.length];
  }

  function goToSong(song: Song) {
    if (currentSong?.id === song.id) {
      restartCurrent();
    } else {
      playSong(song);
    }
  }

  // auto = true when the song ended by itself (not a button click)
  function nextSong(auto = false) {
    if (auto && repeat) {
      restartCurrent();
      return;
    }

    if (queue.length > 0) {
      const [next, ...remaining] = queue;

      setQueue(remaining);
      goToSong(next);
      return;
    }

    const next = pickNeighbour(1);

    if (next) {
      goToSong(next);
    } else if (auto) {
      setPlaying(false);
    }
  }

  function previousSong() {
    const player = playerRef.current;

    // Like Spotify: restart the song if it's already past 3 seconds
    if (player && player.getCurrentTime() > 3) {
      player.seekTo(0, true);
      return;
    }

    const previous = pickNeighbour(-1);

    if (previous) {
      goToSong(previous);
    }
  }

  // Song ended — guarded so the YouTube "ended" event and the background
  // watchdog can't both fire and skip two songs
  function handleEnded() {
    const now = Date.now();

    if (now - lastEndRef.current < 2500) return;

    lastEndRef.current = now;
    nextSongRef.current(true);
  }

  // Always point at the latest closure (queue, shuffle, repeat, lists)
  nextSongRef.current = nextSong;

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  /* ---------- PERSISTENCE (localStorage) ---------- */

  useEffect(() => {
    try {
      const read = (key: string) => {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      };

      const savedLiked = read("auralis:liked");
      const savedPlaylists = read("auralis:playlists");
      const savedRecent = read("auralis:recent");
      const prefs = read("auralis:prefs");

      if (Array.isArray(savedLiked)) setLikedSongs(savedLiked);
      if (Array.isArray(savedPlaylists)) setPlaylists(savedPlaylists);
      if (Array.isArray(savedRecent)) setRecentlyPlayed(savedRecent);

      if (prefs && typeof prefs === "object") {
        if (typeof prefs.volume === "number") setVolume(prefs.volume);
        if (typeof prefs.shuffle === "boolean") setShuffle(prefs.shuffle);
        if (typeof prefs.repeat === "boolean") setRepeat(prefs.repeat);
      }
    } catch {
      // corrupted storage — start fresh
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
      localStorage.setItem("auralis:liked", JSON.stringify(likedSongs));
      localStorage.setItem("auralis:playlists", JSON.stringify(playlists));
      localStorage.setItem("auralis:recent", JSON.stringify(recentlyPlayed));
      localStorage.setItem(
        "auralis:prefs",
        JSON.stringify({ volume, shuffle, repeat })
      );
    } catch {
      // storage full or blocked — ignore
    }
  }, [hydrated, likedSongs, playlists, recentlyPlayed, volume, shuffle, repeat]);

  // Keyboard shortcuts: Space = play/pause, Shift+→ / Shift+← = next / previous
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (typing) return;

      if (event.code === "Space" && currentSong) {
        event.preventDefault();
        setPlaying((value) => !value);
      }

      if (event.shiftKey && event.code === "ArrowRight") {
        nextSongRef.current(false);
      }

      if (event.shiftKey && event.code === "ArrowLeft") {
        previousSong();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentSong, contextList, songs]);

  useEffect(() => {
    seekingRef.current = seeking;
  }, [seeking]);

  // Background-tab-safe watchdog: rAF is throttled/paused when the tab
  // is hidden, but setInterval keeps firing (throttled to ~1/sec), so
  // this catches song-end even while the user is on another tab.
  useEffect(() => {
    const interval = setInterval(() => {
      const player = playerRef.current;
      if (!player || !playingRef.current) return;

      const time = player.getCurrentTime();
      const dur = player.getDuration();

      if (
        Number.isFinite(time) &&
        Number.isFinite(dur) &&
        dur > 0 &&
        time >= dur - 0.4
      ) {
        handleEnded();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSong]);

  useEffect(() => {
    setProgress(0);
    setDuration(0);

    let frame = 0;
    let lastRealSync = 0;
    const REAL_SYNC_INTERVAL = 250;

    const sync = () => {
      const player = playerRef.current;

      if (!player) {
        frame = requestAnimationFrame(sync);
        return;
      }

      const now = performance.now();

      if (now - lastRealSync >= REAL_SYNC_INTERVAL) {
        lastRealSync = now;

        const time = player.getCurrentTime();
        const realDuration = player.getDuration();

        if (Number.isFinite(realDuration) && realDuration > 0) {
          setDuration(realDuration);
        }

        if (Number.isFinite(time)) {
          setProgress(time);
          visualProgressRef.current = time;
          lastSyncTimeRef.current = time;
          lastSyncAtRef.current = now;

          if (syncedLyrics.length > 0) {
            let active = -1;

            for (let i = 0; i < syncedLyrics.length; i++) {
              if (time >= syncedLyrics[i].time) {
                active = i;
              } else {
                break;
              }
            }

            setActiveLyric(active);
          }
        }
      } else if (playingRef.current && !seekingRef.current) {
        const elapsed = (now - lastSyncAtRef.current) / 1000;
        const interpolated = lastSyncTimeRef.current + elapsed;
        visualProgressRef.current = interpolated;
        setProgress(interpolated);
      }

      frame = requestAnimationFrame(sync);
    };

    frame = requestAnimationFrame(sync);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [currentSong, syncedLyrics]);

  // Keep the active lyric centered while the song plays
  useEffect(() => {
    if (activeLyric < 0) return;

    const element = lyricRefs.current[activeLyric];
    if (!element) return;

    element.scrollIntoView({
      behavior: "instant",
      block: "center",
    });
  }, [activeLyric]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    if (playing) {
      player.playVideo();
    } else {
      player.pauseVideo();
    }
  }, [playing]);


  useEffect(() => {
    if (!currentSong || !showLyrics) return;

    const song = currentSong;
    let cancelled = false;

    setLyrics([]);
    setSyncedLyrics([]);
    setActiveLyric(-1);

    async function loadLyrics() {
      setLyricsLoading(true);
      setLyricsError(false);

      try {
        const cleanTitle = song.title
          .replace(/\([^)]*\)/g, "")
          .replace(/\[[^\]]*\]/g, "")
          .replace(/official video/gi, "")
          .replace(/official audio/gi, "")
          .replace(/lyrics?/gi, "")
          .replace(/x\s+.*$/i, "")
          .trim();

        const durationSeconds = (() => {
          if (!song.duration) return null;
          const parts = song.duration.split(":").map(Number);
          if (parts.some((p) => Number.isNaN(p))) return null;
          if (parts.length === 2) return parts[0] * 60 + parts[1];
          if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
          return null;
        })();

        const response = await fetch(
          `/api/lyrics?track=${encodeURIComponent(
            cleanTitle
          )}&artist=${encodeURIComponent(song.artist)}${
            durationSeconds ? `&duration=${durationSeconds}` : ""
          }`
        );

        const data = await response.json();

        if (cancelled) return;

        if (
          (Array.isArray(data.lyrics) && data.lyrics.length > 0) ||
          (typeof data.syncedLyrics === "string" && data.syncedLyrics.trim().length > 0)
        ) {
          setLyrics(
            Array.isArray(data.lyrics) ? data.lyrics : []
          );

            // Parse synced LRC lyrics from the API
            if (typeof data.syncedLyrics === "string") {
              const parsed = data.syncedLyrics
                .split(/\r?\n/)
                .map((line: string) => {
                  const match = line.match(
                    /^\[(\d+):(\d+(?:\.\d+)?)\](?:\s*)(.*)$/
                  );

                  if (!match) return null;

                  return {
                    time:
                      Number(match[1]) * 60 +
                      Number(match[2]),
                    text: match[3].trim(),
                  };
                })
                .filter(
                  (
                    item: { time: number; text: string } | null
                  ): item is { time: number; text: string } =>
                    item !== null && item.text.length > 0
                );

              console.log("PARSED LYRICS", parsed.slice(0, 5));
              setSyncedLyrics(parsed);
              setActiveLyric(-1);
            } else {
              setSyncedLyrics([]);
              setActiveLyric(-1);
            }

          setLyricsError(false);
        } else {
          setLyrics([
            "No lyrics found for this song.",
            "Try another version of the track.",
          ]);
          setLyricsError(true);
        }
      } catch (error) {
        console.error("Lyrics loading failed:", error);

        if (!cancelled) {
          setLyricsError(true);
          setLyrics([
            "Couldn't load lyrics.",
            "Please try again.",
          ]);
        }
      } finally {
        if (!cancelled) {
          setLyricsLoading(false);
        }
      }
    }

    loadLyrics();

    return () => {
      cancelled = true;
    };
  }, [currentSong, showLyrics]);

  function startLyricsDrag(
    e: React.PointerEvent<HTMLDivElement>
  ) {
    if ((e.target as HTMLElement).closest(".lyrics-close")) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const panel = document.querySelector(
      ".lyrics-panel"
    ) as HTMLElement | null;

    if (!panel) return;

    const rect = panel.getBoundingClientRect();

    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = rect.left;
    const startTop = rect.top;

    setDraggingLyrics(true);

    const move = (event: PointerEvent) => {
      const x = startLeft + event.clientX - startX;
      const y = startTop + event.clientY - startY;

      panel.style.left = `${x}px`;
      panel.style.top = `${y}px`;
      panel.style.right = "auto";
      panel.style.bottom = "auto";
    };

    const stop = () => {
      const finalRect = panel.getBoundingClientRect();

      setLyricsPosition({
        x: finalRect.left,
        y: finalRect.top,
      });

      setDraggingLyrics(false);

      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
  }

  function moveQueueItem(from: number, to: number) {
    if (from === to || from < 0 || to < 0) return;

    setQueue((old) => {
      if (from >= old.length || to >= old.length) return old;

      const updated = [...old];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);

      return updated;
    });
  }

  return (

    <main>

      {optionsSong && (
        <div
          className="options-backdrop"
          onClick={() => setOptionsSong(null)}
        >
          <div
            className="song-options-menu"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="options-title">
              <strong>{optionsSong.title}</strong>
              <span>{optionsSong.artist}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                playSong(optionsSong);
                setOptionsSong(null);
              }}
            >
              ▶ Play
            </button>

            <button
              type="button"
              onClick={() => {
                if (!queue.some((item) => item.id === optionsSong.id)) {
                  addToQueue(optionsSong);
                }
                setShowQueue(true);
                setOptionsSong(null);
              }}
            >
              ＋ Add to queue
            </button>

            <button
              type="button"
              onClick={() => {
                setSongForPlaylist(optionsSong);
                setShowAddToPlaylist(true);
                setOptionsSong(null);
              }}
            >
              ♫ Add to playlist
            </button>

            <button
              type="button"
              onClick={() => {
                toggleLike(optionsSong);
                setOptionsSong(null);
              }}
            >
              {liked.includes(optionsSong.id) ? "♥ Unlike" : "♡ Like"}
            </button>

            <button
              type="button"
              onClick={() => setOptionsSong(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showAddToPlaylist && songForPlaylist && (
        <div
          className="options-backdrop"
          onClick={() => {
            setShowAddToPlaylist(false);
            setSongForPlaylist(null);
          }}
        >
          <div
            className="playlist-picker"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="options-title">
              <strong>Add to playlist</strong>
              <span>{songForPlaylist.title}</span>
            </div>

            {playlists.length > 0 ? (
              playlists.map((playlist) => (
                <button
                  type="button"
                  key={playlist.name}
                  onClick={() => {
                    setPlaylists((old) =>
                      old.map((item) => {
                        if (item.name !== playlist.name) return item;

                        if (
                          item.songs.some(
                            (song) => song.id === songForPlaylist.id
                          )
                        ) {
                          return item;
                        }

                        return {
                          ...item,
                          songs: [...item.songs, songForPlaylist],
                        };
                      })
                    );

                    setShowAddToPlaylist(false);
                    setSongForPlaylist(null);
                  }}
                >
                  ♫ {playlist.name}
                  <span>{playlist.songs.length} songs</span>
                </button>
              ))
            ) : (
              <div className="playlist-picker-empty">
                No playlists yet.
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setShowAddToPlaylist(false);
                setSongForPlaylist(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

        <aside className="auralis-sidebar-v2">

          <div className="as-brand">
            <div className="as-brand-mark">A</div>

            <div className="as-brand-text">
              <strong>AURALIS</strong>
              <span>MUSIC</span>
            </div>

            <div className="as-brand-dot" />
          </div>


          <div className="as-section-label">
            <span>DISCOVER</span>
            <i />
          </div>

          <nav className="as-nav">

            <button
              className={`as-nav-item ${activeView === "home" ? "active" : ""}`}
              onClick={() => setActiveView("home")}
            >
              <span className="as-icon">
                <HomeIcon size={19} strokeWidth={1.8} />
              </span>

              <span>Home</span>

              {activeView === "home" && (
                <span className="as-active-dot" />
              )}
            </button>


            <button
              className={`as-nav-item ${activeView === "search" ? "active" : ""}`}
              onClick={() => setActiveView("search")}
            >
              <span className="as-icon">
                <Search size={19} strokeWidth={1.8} />
              </span>

              <span>Search</span>

              {activeView === "search" && (
                <span className="as-active-dot" />
              )}
            </button>


            <button
              className={`as-nav-item ${activeView === "liked" ? "active" : ""}`}
              onClick={() => setActiveView("liked")}
            >
              <span className="as-icon">
                <Heart size={19} strokeWidth={1.8} />
              </span>

              <span>Liked Songs</span>

              {liked.length > 0 && (
                <small>{liked.length}</small>
              )}
            </button>


            <button
              className={`as-nav-item ${activeView === "library" ? "active" : ""}`}
              onClick={() => setActiveView("library")}
            >
              <span className="as-icon">
                <Library size={19} strokeWidth={1.8} />
              </span>

              <span>Library</span>
            </button>

          </nav>


          <div className="as-separator" />


          <div className="as-section-label">
            <span>YOUR MUSIC</span>
            <i />
          </div>

          <nav className="as-nav">

            <button
              className={`as-nav-item ${activeView === "recent" ? "active" : ""}`}
              onClick={() => setActiveView("recent")}
            >
              <span className="as-icon">
                <Clock3 size={19} strokeWidth={1.8} />
              </span>

              <span>Recently Played</span>
            </button>


            <button
              className={`as-nav-item ${activeView === "made" ? "active" : ""}`}
              onClick={() => setActiveView("made")}
            >
              <span className="as-icon">
                <Sparkles size={19} strokeWidth={1.8} />
              </span>

              <span>Made For You</span>
            </button>


            <button
              className={`as-nav-item ${activeView === "albums" ? "active" : ""}`}
              onClick={() => setActiveView("albums")}
            >
              <span className="as-icon">
                <Disc3 size={19} strokeWidth={1.8} />
              </span>

              <span>Artists</span>
            </button>

          </nav>


          <div className="as-grow" />


          {currentSong && (
            <div
              className="as-now-playing"
              onClick={() => setPlaying(!playing)}
            >

              <div className="as-now-art">

                {currentSong.thumbnail ? (
                  <img
                    src={currentSong.thumbnail}
                    alt=""
                  />
                ) : (
                  <span>A</span>
                )}

                {playing && (
                  <div className="as-now-bars">
                    <i />
                    <i />
                    <i />
                  </div>
                )}

              </div>


              <div className="as-now-info">
                <strong>{currentSong.title}</strong>
                <span>{currentSong.artist}</span>
              </div>


              <ChevronRight
                className="as-now-arrow"
                size={18}
              />

            </div>
          )}


          <div className="as-profile">

            <div className="as-profile-avatar">
              A
            </div>

            <div className="as-profile-info">
              <strong>Auralis Music</strong>
              <span>Premium listening</span>
            </div>

            <MoreHorizontal
              className="as-profile-menu"
              size={18}
            />

          </div>

        </aside>


      <section className="content">
        <header className="topbar">
          <div>
            <div className="eyebrow">AURALIS MUSIC ENGINE</div>
            <h1>Premium sound.</h1>
            <p className="subtitle">
              Discover music without limits.
            </p>
          </div>


        </header>

        {activeView === "home" && (
          <section className="hx-hero">
            <div className="hx-hero-glow" />

            <div className="hx-hero-copy">
              <span className="hx-eyebrow">✦ {greeting}</span>

              <h2>
                Your music.
                <br />
                <em>Your atmosphere.</em>
              </h2>

              <p>
                {currentSong
                  ? `Now ${playing ? "playing" : "paused"}: ${currentSong.title} — ${currentSong.artist}`
                  : "Pick a vibe, search a song, or jump into what's popular right now."}
              </p>

              <div className="hx-hero-actions">
                <button
                  type="button"
                  className="hx-btn hx-btn-primary"
                  onClick={() => {
                    if (currentSong) {
                      setPlaying((value) => !value);
                    } else {
                      playFeatured(featured[0]);
                    }
                  }}
                >
                  {currentSong && playing ? (
                    <Pause size={18} fill="currentColor" />
                  ) : (
                    <Play size={18} fill="currentColor" />
                  )}
                  {currentSong
                    ? playing
                      ? "Pause"
                      : "Resume"
                    : "Play something"}
                </button>

                <button
                  type="button"
                  className="hx-btn hx-btn-ghost"
                  onClick={() => setActiveView("search")}
                >
                  <Search size={17} />
                  Search songs
                </button>
              </div>
            </div>

            <div className="hx-hero-art">
              <div className={`hx-disc ${playing ? "spin" : ""}`}>
                {currentSong?.thumbnail ? (
                  <img src={currentSong.thumbnail} alt="" />
                ) : (
                  <span>A</span>
                )}
                <i className="hx-disc-hole" />
              </div>
            </div>
          </section>
        )}

        {activeView === "search" && (
          <section className="search-page">
            <div className="search-page-heading">
              <span className="section-label">AURALIS SEARCH</span>
              <h2>Find your music</h2>
              <p>Search millions of songs and discover your next favorite sound.</p>
            </div>

            <form className="search-page-bar" onSubmit={search}>
              <span>⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What do you want to listen to?"
              />
              <button type="submit" disabled={searching}>
                {searching ? "Searching…" : "Search"}
              </button>
            </form>

            {searchError && (
              <div className="hx-note hx-note-error" role="alert">
                {searchError}
              </div>
            )}

            {!searchError && !searching && hasSearched && songs.length === 0 && (
              <div className="hx-note">
                No songs found for “{query}”. Try a different spelling or artist.
              </div>
            )}
          </section>
        )}

        {activeView === "search" && songs.length > 0 && (
          <section className="section">
            <div className="section-heading">
              <div>
                <span className="section-label">SEARCH RESULTS</span>
                <h2>Results for “{query}”</h2>
              </div>
              <span>{songs.length} songs</span>
            </div>

            <div className="song-list">
              {songs.map((song, index) => (
                <div
                  className={`song-row ${
                    currentSong?.id === song.id ? "selected" : ""
                  }`}
                  key={song.id}
                >
                  <span className="song-number">{index + 1}</span>

                  <div
                    className="song-cover"
                    onClick={() => playSong(song, songs)}
                  >
                    {song.thumbnail && (
                      <img src={song.thumbnail} alt="" />
                    )}

                    <div className="cover-play">
                      {currentSong?.id === song.id && playing
                        ? "Ⅱ"
                        : "▶"}
                    </div>
                  </div>

                  <div
                    className="song-info"
                    onClick={() => playSong(song, songs)}
                  >
                    <strong>{song.title}</strong>
                    <span>{song.artist}</span>
                  </div>

                  <div className="song-album">
                    {song.album || "Single"}
                  </div>

                  <div className="song-duration">
                    {song.duration || "--:--"}
                  </div>

                  <button
                      type="button"
                      className={`queue-add ${
                        queue.some((item) => item.id === song.id)
                          ? "queue-added"
                          : ""
                      }`}
                      title={
                        queue.some((item) => item.id === song.id)
                          ? "Already in queue"
                          : "Add to queue"
                      }
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        if (!queue.some((item) => item.id === song.id)) {
                          addToQueue(song);
                        }
                        setShowQueue(true);
                      }}
                    >
                      {queue.some((item) => item.id === song.id) ? "✓" : "＋"}
                    </button>

                  <button
                    className={`like ${
                      liked.includes(song.id) ? "liked" : ""
                    }`}
                    onClick={() => toggleLike(song)}
                  >
                    {liked.includes(song.id) ? "♥" : "♡"}
                  </button>

                  <button
                    type="button"
                    className="song-options"
                    title="More options"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setOptionsSong(song);
                    }}
                  >
                    ⋮
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeView === "liked" && (
          <section className="library-page">
            <div className="library-hero">
              <div className="library-icon">♥</div>
              <div>
                <span className="section-label">YOUR MUSIC</span>
                <h1>Liked Songs</h1>
                <p>{liked.length} songs you love</p>
              </div>
            </div>

            {liked.length > 0 ? (
              <div className="library-list">
                {likedSongs
                  .map((song, index) => (
                    <div className="library-song" key={song.id}>
                      <span className="library-number">
                        {index + 1}
                      </span>

                      <div className="library-cover">
                        {song.thumbnail && (
                          <img src={song.thumbnail} alt="" />
                        )}
                      </div>

                      <button
                        className="library-info"
                        onClick={() => playSong(song, likedSongs)}
                      >
                        <strong>{song.title}</strong>
                        <span>{song.artist}</span>
                      </button>

                      <span className="library-duration">
                        {song.duration || "--:--"}
                      </span>

                      <button
                        className="library-heart liked"
                        onClick={() => toggleLike(song)}
                      >
                        ♥
                      </button>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="library-empty">
                <div>♡</div>
                <h2>No liked songs yet</h2>
                <p>Tap the heart on a song to save it here.</p>
              </div>
            )}
          </section>
        )}

        {activeView === "recent" && (
          <section className="library-page">
            <div className="library-heading">
              <span className="section-label">YOUR MUSIC</span>
              <h1>Recently Played</h1>
              <p>Your latest listening history.</p>
            </div>

            {recentlyPlayed.length > 0 ? (
              <div className="library-list">
                {recentlyPlayed.map((song, index) => (
                  <div className="library-song" key={song.id}>
                    <span className="library-number">
                      {index + 1}
                    </span>

                    <div className="library-cover">
                      {song.thumbnail && (
                        <img src={song.thumbnail} alt="" />
                      )}
                    </div>

                    <button
                      className="library-info"
                      onClick={() => playSong(song, recentlyPlayed)}
                    >
                      <strong>{song.title}</strong>
                      <span>{song.artist}</span>
                    </button>

                    <span className="library-duration">
                      {song.duration || "--:--"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="library-empty">
                <div>♫</div>
                <h2>Nothing played yet</h2>
                <p>Start listening and your recent songs will appear here.</p>
              </div>
            )}
          </section>
        )}

        {activeView === "library" && activePlaylist && (
          <section className="library-page">
            <button
              className="playlist-back"
              onClick={() => {
  setActivePlaylist(null);
  setActiveView("library");
}}
            >
              ← Back to Library
            </button>

            {(() => {
              const playlist = playlists.find(
                (item) => item.name === activePlaylist
              );

              if (!playlist) return null;

              return (
                <>
                  <div className="library-hero">
                    <div className="library-icon">♫</div>
                    <div>
                      <span className="section-label">PLAYLIST</span>
                      <h1>{playlist.name}</h1>
                      <p>{playlist.songs.length} songs</p>
                    </div>
                  </div>

                  {playlist.songs.length > 0 ? (
                    <>
                      <div className="playlist-toolbar">
                        <label className="playlist-select-all">
                          <input
                            type="checkbox"
                            checked={
                              selectedPlaylistSongs.length ===
                              playlist.songs.length
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPlaylistSongs(
                                  playlist.songs.map((song) => song.id)
                                );
                              } else {
                                setSelectedPlaylistSongs([]);
                              }
                            }}
                          />
                          <span>Select all</span>
                        </label>

                        {selectedPlaylistSongs.length > 0 && (
                          <div className="playlist-bulk-actions">
                            <button
                              type="button"
                              onClick={() => {
                                setShowRemoveConfirm(true);
                              }}
                            >
                              🗑 Remove
                            </button>

                            <button
                              type="button"
                              onClick={() => setShowMovePlaylist(true)}
                            >
                              📂 Move to playlist
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const first = playlist.songs.find((song) =>
                                  selectedPlaylistSongs.includes(song.id)
                                );

                                setSongForPlaylist(first || null);
                                setShowAddToPlaylist(true);
                              }}
                            >
                              ＋ Add songs
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="library-list">
                      {playlist.songs.map((song, index) => (
                        <div className="library-song" key={song.id}>
                          <input
                            type="checkbox"
                            className="playlist-song-checkbox"
                            checked={selectedPlaylistSongs.includes(song.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPlaylistSongs((old) => [
                                  ...old,
                                  song.id,
                                ]);
                              } else {
                                setSelectedPlaylistSongs((old) =>
                                  old.filter((id) => id !== song.id)
                                );
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />

                          <span className="library-number">
                            {index + 1}
                          </span>

                          <div className="library-cover">
                            {song.thumbnail && (
                              <img src={song.thumbnail} alt="" />
                            )}
                          </div>

                          <button
                            className="library-info"
                            onClick={() => playSong(song, playlist.songs)}
                          >
                            <strong>{song.title}</strong>
                            <span>{song.artist}</span>
                          </button>

                          <span className="library-duration">
                            {song.duration || "--:--"}
                          </span>


                        </div>
                      ))}
                      </div>
                    </>
                  ) : (
                    <div className="library-empty">
                      <div>♫</div>
                      <h2>This playlist is empty</h2>
                      <p>Search for songs and add them to this playlist.</p>
                    </div>
                  )}
                </>
              );
            })()}
          </section>
        )}

        {activeView === "library" && !activePlaylist && (
          <section className="library-page">
            <div className="library-heading">
              <span className="section-label">YOUR MUSIC</span>
              <h1>Library</h1>
              <p>Your music, all in one place.</p>
            </div>

            <div className="playlist-actions">
              <button
                className="create-playlist-button"
                onClick={() => setShowCreatePlaylist(true)}
              >
                ＋ Create Playlist
              </button>
            </div>

            {playlists.length > 0 && (
              <div className="playlist-section">
                <span className="section-label">YOUR PLAYLISTS</span>

                <div className="playlist-grid">
                  {playlists.map((playlist) => (
                    <button
                      className="playlist-card"
                      key={playlist.name}
                      onClick={() => setActivePlaylist(playlist.name)}
                    >
                      <div className="playlist-icon">♫</div>
                      <strong>{playlist.name}</strong>
                      <span>{playlist.songs.length} songs</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {playlists.length === 0 && (
              <div className="hx-note">
                No playlists yet. Create one, then add songs from the ⋮ menu on
                any song.
              </div>
            )}

            {likedSongs.length > 0 && (
              <div className="playlist-section">
                <span className="section-label">QUICK ACCESS</span>

                <div className="playlist-grid">
                  <button
                    className="playlist-card"
                    onClick={() => setActiveView("liked")}
                  >
                    <div className="playlist-icon">♥</div>
                    <strong>Liked Songs</strong>
                    <span>{likedSongs.length} songs</span>
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {activeView === "albums" &&
          (() => {
            const pool = [
              ...likedSongs,
              ...recentlyPlayed,
              ...playlists.flatMap((playlist) => playlist.songs),
            ];

            const byArtist = new Map<string, Song[]>();

            for (const item of pool) {
              const list = byArtist.get(item.artist) || [];

              if (!list.some((existing) => existing.id === item.id)) {
                list.push(item);
              }

              byArtist.set(item.artist, list);
            }

            const artists = Array.from(byArtist.entries()).sort(
              (a, b) => b[1].length - a[1].length
            );

            return (
              <section className="library-page">
                <div className="library-heading">
                  <span className="section-label">YOUR MUSIC</span>
                  <h1>Artists</h1>
                  <p>Everyone you've listened to, in one place.</p>
                </div>

                {artists.length > 0 ? (
                  <div className="playlist-grid">
                    {artists.map(([artist, tracks]) => (
                      <button
                        className="playlist-card"
                        key={artist}
                        onClick={() => playSong(tracks[0], tracks)}
                      >
                        <div className="playlist-icon">
                          {artist.charAt(0).toUpperCase()}
                        </div>
                        <strong>{artist}</strong>
                        <span>
                          {tracks.length} song{tracks.length === 1 ? "" : "s"}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="library-empty">
                    <div>♫</div>
                    <h2>No artists yet</h2>
                    <p>Play or like some songs and your artists will show up here.</p>
                  </div>
                )}
              </section>
            );
          })()}

        {(activeView === "home" || activeView === "made") && (
          <>
            {activeView === "made" && (
              <div className="library-heading">
                <span className="section-label">YOUR MUSIC</span>
                <h1>Made For You</h1>
                <p>Pick a vibe and Auralis finds the songs.</p>
              </div>
            )}

            {activeView === "home" && recentlyPlayed.length > 0 && (
              <section className="section hx-section">
                <div className="section-heading">
                  <div>
                    <span className="section-label">JUMP BACK IN</span>
                    <h2>Recently played</h2>
                  </div>
                  <button
                    type="button"
                    className="hx-link"
                    onClick={() => setActiveView("recent")}
                  >
                    See all →
                  </button>
                </div>

                <div className="hx-quick-grid">
                  {recentlyPlayed.slice(0, 6).map((song) => (
                    <button
                      type="button"
                      key={song.id}
                      className={`hx-quick ${
                        currentSong?.id === song.id ? "active" : ""
                      }`}
                      onClick={() => playSong(song, recentlyPlayed)}
                    >
                      <span className="hx-quick-art">
                        {song.thumbnail ? (
                          <img src={song.thumbnail} alt="" />
                        ) : (
                          <span>♫</span>
                        )}
                      </span>

                      <span className="hx-quick-text">
                        <b>{song.title}</b>
                        <small>{song.artist}</small>
                      </span>

                      <span className="hx-quick-play">
                        {currentSong?.id === song.id && playing ? (
                          <Pause size={16} fill="currentColor" />
                        ) : (
                          <Play size={16} fill="currentColor" />
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {activeView === "home" && (
            <section className="section hx-section">
          <div className="section-heading">
            <div>
              <span className="section-label">DISCOVER</span>
              <h2>Popular right now</h2>
            </div>

            <div className="hx-arrows">
              <button
                type="button"
                aria-label="Scroll left"
                onClick={() => scrollPopular(-1)}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                aria-label="Scroll right"
                onClick={() => scrollPopular(1)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="hx-carousel" ref={popularRef}>
            {featured.map((item, index) => (
              <div className="hx-card" key={item.title}>
                <button
                  type="button"
                  className={`hx-card-art ${
                    loadingCard === item.title ? "loading" : ""
                  }`}
                  aria-label={`Play ${item.title} by ${item.artist}`}
                  onClick={() => playFeatured(item)}
                >
                  <img
                    src={item.image}
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />

                  <span className="hx-rank">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="hx-card-play">
                    {loadingCard === item.title ? (
                      <span className="hx-spinner" />
                    ) : (
                      <Play size={22} fill="currentColor" />
                    )}
                  </span>
                </button>

                <strong>{item.title}</strong>
                <span>{item.artist}</span>
              </div>
            ))}
          </div>
        </section>
            )}

        <section className="section">
          <div className="section-heading">
            <div>
              <span className="section-label">MADE FOR YOU</span>
              <h2>Pick your atmosphere</h2>
            </div>
          </div>

          <div className="mood-grid">
            {[
              {
                name: "Night Drive",
                icon: "☾",
                subtitle: "Late night energy",
                className: "night",
              },
              {
                name: "Energy",
                icon: "ϟ",
                subtitle: "Turn it up",
                className: "energy",
              },
              {
                name: "Chill",
                icon: "☁",
                subtitle: "Slow everything down",
                className: "chill",
              },
              {
                name: "Trending",
                icon: "↗",
                subtitle: "What's hot right now",
                className: "trending",
              },
            ].map((mood) => {
              const tracks = atmosphereSongs[mood.name] || [];
              const featuredSong = tracks[0];

              return (
                <button
                  key={mood.name}
                  type="button"
                  className={`mood-card ${mood.className} ${
                    tracks.length ? "has-songs" : "empty"
                  }`}
                  onClick={() => {
                    if (tracks.length) {
                      playSong(tracks[0], tracks);
                    } else {
                      selectAtmosphere(
                        mood.name,
                        mood.name === "Night Drive"
                          ? "night drive"
                          : mood.name === "Energy"
                          ? "energetic upbeat"
                          : mood.name === "Chill"
                          ? "chill relaxing"
                          : "trending music"
                      );
                    }
                  }}
                >
                  <span className="mood-icon">{mood.icon}</span>

                  <div className="mood-card-content">
                    <b>{mood.name}</b>
                    <small>
                      {featuredSong
                        ? `${tracks.length} song${tracks.length === 1 ? "" : "s"} • ${featuredSong.title}`
                        : mood.subtitle}
                    </small>
                  </div>

                  <span className="mood-arrow">›</span>
                </button>
              );
            })}
          </div>

          <div className="atmosphere-results">
            <div className="section-heading atmosphere-results-heading">
              <div>
                <span className="section-label">YOUR ATMOSPHERE</span>
                <h2>{selectedAtmosphere}</h2>
                <div className="atmosphere-detected">
                  <span className="atmosphere-detected-dot" />
                  {atmosphereReason}
                </div>
              </div>
              <span>
                {atmosphereLoading
                  ? "Finding your vibe..."
                  : `${(atmosphereSongs[selectedAtmosphere] || []).length} songs`}
              </span>
            </div>

            {atmosphereLoading ? (
              <div className="atmosphere-loading">
                <span className="atmosphere-spinner" />
                <span>Finding songs for this atmosphere...</span>
              </div>
            ) : (atmosphereSongs[selectedAtmosphere] || []).length > 0 ? (
              <div className="atmosphere-song-grid">
                {(atmosphereSongs[selectedAtmosphere] || []).map((song: Song) => (
                  <button
                    type="button"
                    className={`atmosphere-song ${
                      currentSong?.id === song.id ? "playing" : ""
                    }`}
                    key={song.id}
                    onClick={() => playSong(song, atmosphereSongs[selectedAtmosphere] || [])}
                  >
                    <div className="atmosphere-song-cover">
                      {song.thumbnail ? (
                        <img src={song.thumbnail} alt="" />
                      ) : (
                        <span>♫</span>
                      )}
                      <span className="atmosphere-song-play">
                        {currentSong?.id === song.id && playing ? "Ⅱ" : "▶"}
                      </span>
                    </div>

                    <div className="atmosphere-song-info">
                      <b>{song.title}</b>
                      <small>{song.artist}</small>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="atmosphere-empty">
                Choose an atmosphere to discover songs.
              </div>
            )}
          </div>
        </section>
          </>
        )}

      </section>

      {showRemoveConfirm && activePlaylist && (
        <div
          className="confirm-modal-backdrop"
          onClick={() => setShowRemoveConfirm(false)}
        >
          <div
            className="confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-modal-icon">⚠</div>

            <h2>Remove songs?</h2>

            <p>
              Are you sure you want to remove{" "}
              <strong>{selectedPlaylistSongs.length} song(s)</strong>{" "}
              from <strong>{activePlaylist}</strong>?
            </p>

            <div className="confirm-modal-actions">
              <button
                type="button"
                className="confirm-cancel"
                onClick={() => setShowRemoveConfirm(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="confirm-remove"
                onClick={() => {
                  setPlaylists((old) =>
                    old.map((item) =>
                      item.name === activePlaylist
                        ? {
                            ...item,
                            songs: item.songs.filter(
                              (song) =>
                                !selectedPlaylistSongs.includes(song.id)
                            ),
                          }
                        : item
                    )
                  );

                  setSelectedPlaylistSongs([]);
                  setShowRemoveConfirm(false);
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreatePlaylist && (
        <div className="playlist-modal-backdrop">
          <div className="playlist-modal">
            <span className="section-label">YOUR MUSIC</span>

            <h2>Create Playlist</h2>

            <input
              autoFocus
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  createPlaylist();
                }
              }}
              placeholder="Playlist name"
            />

            <div className="playlist-modal-actions">
              <button
                onClick={() => {
                  setShowCreatePlaylist(false);
                  setPlaylistName("");
                }}
              >
                Cancel
              </button>

              <button
                className="primary"
                onClick={createPlaylist}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showMovePlaylist && activePlaylist && (
        <div
          className="options-backdrop"
          onClick={() => setShowMovePlaylist(false)}
        >
          <div
            className="song-options-menu playlist-picker"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="options-title">
              <strong>Move songs</strong>
              <span>
                {selectedPlaylistSongs.length} selected
              </span>
            </div>

            {playlists
              .filter((playlist) => playlist.name !== activePlaylist)
              .map((targetPlaylist) => (
                <button
                  key={targetPlaylist.name}
                  type="button"
                  onClick={() => {
                    const confirmed = window.confirm(
                      `Move ${selectedPlaylistSongs.length} song(s) to "${targetPlaylist.name}"?`
                    );

                    if (!confirmed) return;

                    const currentPlaylist = playlists.find(
                      (p) => p.name === activePlaylist
                    );

                    const movingSongs =
                      currentPlaylist?.songs.filter((song) =>
                        selectedPlaylistSongs.includes(song.id)
                      ) || [];

                    setPlaylists((old) =>
                      old.map((item) => {
                        if (item.name === activePlaylist) {
                          return {
                            ...item,
                            songs: item.songs.filter(
                              (song) =>
                                !selectedPlaylistSongs.includes(song.id)
                            ),
                          };
                        }

                        if (item.name === targetPlaylist.name) {
                          const existing = new Set(
                            item.songs.map((song) => song.id)
                          );

                          return {
                            ...item,
                            songs: [
                              ...item.songs,
                              ...movingSongs.filter(
                                (song) => !existing.has(song.id)
                              ),
                            ],
                          };
                        }

                        return item;
                      })
                    );

                    setSelectedPlaylistSongs([]);
                    setShowMovePlaylist(false);
                  }}
                >
                  📂 {targetPlaylist.name}
                </button>
              ))}

            <button
              type="button"
              onClick={() => setShowMovePlaylist(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showLyrics && currentSong && (
        <div
          className="lyrics-panel"
          style={{
            position: "fixed",
            left: `${lyricsPosition.x}px`,
            top: `${lyricsPosition.y}px`,
            right: "auto",
            bottom: "auto",
          }}
        >
          <div
            className="lyrics-header"
            onPointerDown={(e) => {
              if ((e.target as HTMLElement).closest("button")) return;
              startLyricsDrag(e);
            }}
            style={{
              cursor: draggingLyrics ? "grabbing" : "grab",
              touchAction: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
          >
            <div>
              <span className="lyrics-label">
                NOW PLAYING
              </span>

              <h3>Lyrics</h3>

              <p>
                {currentSong.title}
              </p>
            </div>

          </div>

          <div className="lyrics-body">
            {lyricsLoading ? (
              <div className="lyrics-loading">
                <span className="lyrics-spinner" />
                Finding lyrics...
              </div>
            ) : lyricsError ? (
              <div className="lyrics-empty">
                Unable to load lyrics.
              </div>
            ) : lyrics.length ? (
                (syncedLyrics.length ? syncedLyrics : lyrics.map((text) => ({
                  time: 0,
                  text,
                }))).map((line, index) => (
                  <div
                      ref={(element) => {
                        lyricRefs.current[index] = element;
                      }}
                    key={`${line.text}-${index}`}
                    className={`lyrics-line ${
                      index === activeLyric ? "lyrics-active" : ""
                    }`}
                  >
                    {line.text}
                  </div>
                ))
            ) : (
              <div className="lyrics-empty">
                No lyrics available.
              </div>
            )}
          </div>

          {[
            ["n", "ns-resize"],
            ["s", "ns-resize"],
            ["e", "ew-resize"],
            ["w", "ew-resize"],
            ["ne", "nesw-resize"],
            ["sw", "nesw-resize"],
            ["nw", "nwse-resize"],
            ["se", "nwse-resize"],
          ].map(([direction, cursor]) => (
            <div
              key={direction}
              className={`panel-resize-handle resize-${direction}`}
              style={{
                cursor,
                zIndex: 20,
              }}
              onPointerDown={(e) =>
                startPanelResize(e, "lyrics", direction)
              }
            />
          ))}

          <div className="lyrics-footer">
            <button
              className={`lyrics-like ${
                liked.includes(currentSong.id)
                  ? "liked"
                  : ""
              }`}
              onClick={() =>
                toggleLike(currentSong)
              }
            >
              {liked.includes(currentSong.id)
                ? "♥ Liked"
                : "♡ Like"}
            </button>

            <span>✦ Auralis</span>
          </div>
        </div>
      )}

      {showQueue && (
        <div className="queue-panel">
          {[
            ["n", "ns-resize"],
            ["s", "ns-resize"],
            ["e", "ew-resize"],
            ["w", "ew-resize"],
            ["ne", "nesw-resize"],
            ["sw", "nesw-resize"],
            ["nw", "nwse-resize"],
            ["se", "nwse-resize"],
          ].map(([direction, cursor]) => (
            <div
              key={direction}
              className={`panel-resize-handle resize-${direction}`}
              style={{ cursor }}
              onPointerDown={(e) =>
                startPanelResize(
                  e,
                  "queue",
                  direction
                )
              }
            />
          ))}

          <div className="queue-header">
            <div>
              <span className="queue-label">PLAYING NEXT</span>
              <h3>Queue</h3>
            </div>

            <button
              className="queue-close"
              onClick={() => setShowQueue(false)}
            >
              ×
            </button>
          </div>

          <div className="queue-list">
            {queue.length > 0 ? (
              queue.map((song, index) => (
                <div
                  key={song.id}
                  className={`queue-item ${
                    draggedQueueIndex === index ? "dragging" : ""
                  }`}
                  draggable
                  onDragStart={() => setDraggedQueueIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();

                    if (draggedQueueIndex !== null) {
                      moveQueueItem(draggedQueueIndex, index);
                    }

                    setDraggedQueueIndex(null);
                  }}
                  onDragEnd={() => setDraggedQueueIndex(null)}
                >
                  <span className="queue-drag">⠿</span>

                  <span className="queue-number">
                    {index + 1}
                  </span>

                  <div className="queue-cover">
                    {song.thumbnail && (
                      <img src={song.thumbnail} alt="" />
                    )}
                  </div>

                  <button
                    className="queue-info"
                    onClick={(e) => {
                      e.stopPropagation();
                      playSong(song);
                      setShowQueue(false);
                    }}
                  >
                    <strong>{song.title}</strong>
                    <span>{song.artist}</span>
                  </button>

                  <span className="queue-duration">
                    {song.duration || "--:--"}
                  </span>

                  <button
                    className="queue-remove"
                    onClick={() => removeFromQueue(song.id)}
                    aria-label="Remove from queue"
                  >
                    ×
                  </button>
                </div>
              ))
            ) : (
              <div className="queue-empty">
                <div className="queue-empty-icon">☷</div>
                <strong>Your queue is empty</strong>
                <span>Add songs to build your queue.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {currentSong && (
        <>
          <YouTube
            videoId={currentSong.id}
            opts={{
              height: "0",
              width: "0",
              playerVars: {
                autoplay: 1,
                controls: 0,
                playsinline: 1,
              },
            }}
            onReady={(event) => {
              playerRef.current = event.target;

              event.target.setVolume(volume * 100);
              setDuration(event.target.getDuration());

              if (playing) {
                event.target.playVideo();
              }
            }}
            onStateChange={(event) => {
              if (event.data === 1) {
                setPlaying(true);
              }

              if (event.data === 2) {
                setPlaying(false);
              }

              if (event.data === 0) {
                handleEnded();
              }
            }}
            onError={(event) => {
              if (event.data === 150 || event.data === 101) {
                console.warn(
                  "Non-embeddable YouTube video, moving to next result:",
                  currentSong?.title
                );
                setPlaying(false);

                setTimeout(() => {
                  nextSongRef.current(false);
                }, 150);

                return;
              }

              console.warn("YouTube player error:", event.data);
              setPlaying(false);
            }}
          />

        <div className="player">
          <div className="player-song">
            <div className={`player-cover ${playing ? "playing" : ""}`}>
              {currentSong.thumbnail && (
                <img src={currentSong.thumbnail} alt="" />
              )}
            </div>

            <div className="player-song-info">
              <strong>{currentSong.title}</strong>
              <span>{currentSong.artist}</span>
            </div>

            <button
              className={`player-like ${liked.includes(currentSong.id) ? "active" : ""}`}
              onClick={() => toggleLike(currentSong)}
              aria-label="Like"
            >
              <Heart size={18} fill={liked.includes(currentSong.id) ? "currentColor" : "none"} />
            </button>
          </div>

          <div className="player-center">
            <div className="player-buttons">
              <button
                className={`shuffle-button ${shuffle ? "active" : ""}`}
                onClick={() => setShuffle((v) => !v)}
                aria-label="Shuffle"
              >
                <Shuffle size={16} />
              </button>

              <button onClick={previousSong} aria-label="Previous">
                <SkipBack size={18} fill="currentColor" />
              </button>

              <button
                className="play-button"
                onClick={() => setPlaying(!playing)}
                aria-label="Play/Pause"
              >
                {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
              </button>

              <button onClick={() => nextSong(false)} aria-label="Next">
                <SkipForward size={18} fill="currentColor" />
              </button>

              <button
                className={`repeat-button ${repeat ? "active" : ""}`}
                onClick={() => setRepeat((v) => !v)}
                aria-label="Repeat"
              >
                <Repeat size={16} />
              </button>
            </div>

            <div className="progress">
              <span>
                {Math.floor(progress / 60)}:
                {String(Math.floor(progress % 60)).padStart(2, "0")}
              </span>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${duration > 0 ? Math.min(100, (progress / duration) * 100) : 0}%`,
                  }}
                />

                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={progress}
                  onPointerDown={() => {
                    setSeeking(true);
                  }}
                  onPointerUp={() => {
                    const player = playerRef.current;

                    if (player) {
                      const time = player.getCurrentTime();

                      if (Number.isFinite(time)) {
                        lastSyncTimeRef.current = time;
                        lastSyncAtRef.current = performance.now();
                        visualProgressRef.current = time;
                        setProgress(time);
                      }
                    }

                    setSeeking(false);
                  }}
                  onPointerCancel={() => setSeeking(false)}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    const player = playerRef.current;

                    if (!player || !duration) return;

                    setProgress(value);

                    if (value >= duration - 0.5) {
                      player.seekTo(duration, true);

                      setTimeout(() => {
                        nextSongRef.current(false);
                      }, 200);

                      return;
                    }

                    player.seekTo(value, true);

                    lastSyncTimeRef.current = value;
                    lastSyncAtRef.current = performance.now();
                    visualProgressRef.current = value;
                  }}
                />
              </div>

              <span>
                {Math.floor(duration / 60)}:
                {String(Math.floor(duration % 60)).padStart(2, "0")}
              </span>
            </div>
          </div>

          <div className="player-actions">
            <button
              className={`lyrics-button ${showLyrics ? "active" : ""}`}
              onClick={() => setShowLyrics((value) => !value)}
            >
              <Music2 size={14} /> Lyrics
            </button>

            <button
              type="button"
              className={`lyrics-button queue-toggle ${showQueue ? "active" : ""}`}
              onClick={() => setShowQueue(!showQueue)}
              aria-label="Toggle queue"
              aria-expanded={showQueue}
            >
              <ListMusic size={16} />
              <span>Queue</span>
              {queue.length > 0 && (
                <b className="queue-count">{queue.length}</b>
              )}
            </button>
          </div>


              

          <div className="player-volume">
            <Volume2 size={18} />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => {
                const value = Number(e.target.value);
                setVolume(value);

                const player = playerRef.current;
                if (player) {
                  player.setVolume(value * 100);
                }
              }}
            />

          

              


              <div
                className={`sound-visualizer ${playing ? "playing" : ""}`}
                aria-label="Audio visualizer"
              >
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
</div>


        </div>
        </>
      )}
    </main>
  );
}
