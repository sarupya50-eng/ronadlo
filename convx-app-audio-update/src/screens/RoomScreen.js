import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import { useAuth } from "../context/AuthContext";
import { connectSocket, disconnectSocket } from "../api/socket";
import { api, API_BASE_URL } from "../api/client";

const TABS = { CHAT: "chat", QUEUE: "queue" };

export default function RoomScreen({ route }) {
  const { roomId, roomName } = route.params;
  const { token, user } = useAuth();

  const [tab, setTab] = useState(TABS.CHAT);
  const [messages, setMessages] = useState([]);
  const [presence, setPresence] = useState([]);
  const [draft, setDraft] = useState("");

  const [queue, setQueue] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [playbackState, setPlaybackState] = useState(null);
  const [isBuffering, setIsBuffering] = useState(false);

  const socketRef = useRef(null);
  const listRef = useRef(null);
  const soundRef = useRef(null);
  const applyingRemoteUpdate = useRef(false);

  const loadQueue = useCallback(async () => {
    try {
      const items = await api.getQueue(roomId);
      setQueue(items);
    } catch (err) {
      console.warn("Failed to load queue", err.message);
    }
  }, [roomId]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const room = await api.getRoom(roomId);
        if (mounted) setMessages([...room.messages].reverse());
      } catch (err) {
        console.warn("Failed to load room history", err.message);
      }
      await loadQueue();
    })();

    const socket = connectSocket(token);
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("room:join", { roomId });
    });

    socket.on("chat:message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("presence:update", ({ presence }) => {
      setPresence(presence);
    });

    socket.on("playback:state", (state) => {
      applyingRemoteUpdate.current = true;
      setPlaybackState(state);
    });

    socket.on("error", ({ message }) => {
      console.warn("Socket error:", message);
    });

    return () => {
      mounted = false;
      socket.emit("room:leave", { roomId });
      disconnectSocket();
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, [roomId, token, loadQueue]);

  useEffect(() => {
    (async () => {
      if (!playbackState) return;
      const track = queue.find((q) => q.trackId === playbackState.trackId)?.track;
      if (!track) return;

      try {
        if (!soundRef.current) {
          const { sound } = await Audio.Sound.createAsync(
            { uri: `${API_BASE_URL}${track.fileUrl}` },
            { shouldPlay: playbackState.isPlaying, positionMillis: playbackState.positionMs || 0 }
          );
          soundRef.current = sound;
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isBuffering !== undefined) setIsBuffering(status.isBuffering);
          });
        } else if (applyingRemoteUpdate.current) {
          const status = await soundRef.current.getStatusAsync();
          const drift = Math.abs((status.positionMillis || 0) - (playbackState.positionMs || 0));
          if (drift > 1500) {
            await soundRef.current.setPositionAsync(playbackState.positionMs || 0);
          }
          if (playbackState.isPlaying) {
            await soundRef.current.playAsync();
          } else {
            await soundRef.current.pauseAsync();
          }
        }
      } catch (err) {
        console.warn("Playback error:", err.message);
      } finally {
        applyingRemoteUpdate.current = false;
      }
    })();
  }, [playbackState, queue]);

  const emitPlayback = (overrides) => {
    if (!socketRef.current || !playbackState) return;
    const next = { ...playbackState, ...overrides };
    socketRef.current.emit("playback:update", {
      roomId,
      trackId: next.trackId,
      positionMs: next.positionMs,
      isPlaying: next.isPlaying,
    });
  };

  const handlePlayTrack = async (queueItem) => {
    setPlaybackState({ trackId: queueItem.trackId, positionMs: 0, isPlaying: true, updatedAt: Date.now() });
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    socketRef.current?.emit("playback:update", {
      roomId,
      trackId: queueItem.trackId,
      positionMs: 0,
      isPlaying: true,
    });
  };

  const togglePlayPause = async () => {
    if (!soundRef.current || !playbackState) return;
    const status = await soundRef.current.getStatusAsync();
    const nowPlaying = !playbackState.isPlaying;
    if (nowPlaying) await soundRef.current.playAsync();
    else await soundRef.current.pauseAsync();
    emitPlayback({ isPlaying: nowPlaying, positionMs: status.positionMillis || 0 });
    setPlaybackState((prev) => ({ ...prev, isPlaying: nowPlaying }));
  };

  const sendMessage = () => {
    if (!draft.trim() || !socketRef.current) return;
    socketRef.current.emit("chat:message", { roomId, content: draft.trim() });
    setDraft("");
  };

  const handleUpload = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "audio/*" });
    if (result.canceled || !result.assets?.length) return;

    const file = result.assets[0];
    setUploading(true);
    try {
      const track = await api.uploadTrack(file.uri, file.name, file.mimeType || "audio/mpeg", file.name, token);
      await api.addToQueue(track.id, roomId, token);
      await loadQueue();
      Alert.alert("Uploaded", `"${track.title}" added to the queue`);
    } catch (err) {
      Alert.alert("Upload failed", err.message);
    } finally {
      setUploading(false);
    }
  };

  const currentTrack = playbackState ? queue.find((q) => q.trackId === playbackState.trackId)?.track : null;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <Text style={styles.title}>{roomName}</Text>
        <Text style={styles.presence}>
          {presence.length} online{presence.length ? `: ${presence.map((p) => p.username).join(", ")}` : ""}
        </Text>
      </View>

      {currentTrack && (
        <View style={styles.nowPlaying}>
          <View style={{ flex: 1 }}>
            <Text style={styles.nowPlayingTitle} numberOfLines={1}>
              {isBuffering ? "Buffering… " : "▸ "}
              {currentTrack.title}
            </Text>
            {currentTrack.artist ? <Text style={styles.nowPlayingArtist}>{currentTrack.artist}</Text> : null}
          </View>
          <TouchableOpacity style={styles.playPauseButton} onPress={togglePlayPause}>
            <Text style={styles.playPauseText}>{playbackState?.isPlaying ? "Pause" : "Play"}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === TABS.CHAT && styles.tabActive]} onPress={() => setTab(TABS.CHAT)}>
          <Text style={[styles.tabText, tab === TABS.CHAT && styles.tabTextActive]}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === TABS.QUEUE && styles.tabActive]} onPress={() => setTab(TABS.QUEUE)}>
          <Text style={[styles.tabText, tab === TABS.QUEUE && styles.tabTextActive]}>Queue</Text>
        </TouchableOpacity>
      </View>

      {tab === TABS.CHAT ? (
        <>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => (
              <View style={styles.messageRow}>
                <Text style={styles.messageAuthor}>
                  {item.user?.username ?? "unknown"}
                  {item.user?.id === user?.id ? " (you)" : ""}
                </Text>
                <Text style={styles.messageContent}>{item.content}</Text>
              </View>
            )}
          />
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Message the room..."
              placeholderTextColor="#888"
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <FlatList
            data={queue}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={<Text style={styles.empty}>Queue is empty — upload a track below.</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.queueItem} onPress={() => handlePlayTrack(item)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.queueTitle} numberOfLines={1}>{item.track.title}</Text>
                  <Text style={styles.queueMeta}>
                    {item.track.artist || "Unknown artist"} · added by {item.track.uploader?.username}
                  </Text>
                </View>
                {playbackState?.trackId === item.trackId && <Text style={styles.nowPlayingBadge}>▸ playing</Text>}
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.uploadButton} onPress={handleUpload} disabled={uploading}>
            <Text style={styles.uploadButtonText}>{uploading ? "Uploading…" : "+ Upload a track"}</Text>
          </TouchableOpacity>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b12" },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#1e1e28" },
  title: { color: "#fff", fontSize: 20, fontWeight: "700" },
  presence: { color: "#7a7a88", fontSize: 12, marginTop: 4 },

  nowPlaying: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#17171f",
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
  },
  nowPlayingTitle: { color: "#fff", fontWeight: "600", fontSize: 14 },
  nowPlayingArtist: { color: "#9a9aa8", fontSize: 12, marginTop: 2 },
  playPauseButton: { backgroundColor: "#7c5cff", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  playPauseText: { color: "#fff", fontWeight: "600", fontSize: 13 },

  tabRow: { flexDirection: "row", marginHorizontal: 16, marginTop: 14, backgroundColor: "#17171f", borderRadius: 10, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  tabActive: { backgroundColor: "#7c5cff" },
  tabText: { color: "#9a9aa8", fontWeight: "600", fontSize: 13 },
  tabTextActive: { color: "#fff" },

  messageRow: { marginBottom: 14 },
  messageAuthor: { color: "#7c5cff", fontSize: 12, fontWeight: "600", marginBottom: 2 },
  messageContent: { color: "#e5e5ea", fontSize: 15 },
  inputRow: { flexDirection: "row", padding: 12, borderTopWidth: 1, borderTopColor: "#1e1e28", gap: 8 },
  input: { flex: 1, backgroundColor: "#17171f", color: "#fff", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  sendButton: { backgroundColor: "#7c5cff", borderRadius: 10, paddingHorizontal: 18, justifyContent: "center" },
  sendButtonText: { color: "#fff", fontWeight: "600" },

  queueItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#17171f",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  queueTitle: { color: "#fff", fontSize: 15, fontWeight: "600" },
  queueMeta: { color: "#7a7a88", fontSize: 12, marginTop: 3 },
  nowPlayingBadge: { color: "#7c5cff", fontSize: 12, fontWeight: "600" },
  empty: { color: "#7a7a88", textAlign: "center", marginTop: 40 },
  uploadButton: { backgroundColor: "#7c5cff", margin: 16, borderRadius: 10, paddingVertical: 14 },
  uploadButtonText: { color: "#fff", textAlign: "center", fontWeight: "600" },
});
