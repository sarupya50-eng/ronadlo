import React, { useEffect, useRef, useState } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useAuth } from "../context/AuthContext";
import { connectSocket, disconnectSocket } from "../api/socket";
import { api } from "../api/client";

export default function RoomScreen({ route }) {
  const { roomId, roomName } = route.params;
  const { token, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [presence, setPresence] = useState([]);
  const [draft, setDraft] = useState("");
  const socketRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const room = await api.getRoom(roomId);
        if (mounted) setMessages([...room.messages].reverse());
      } catch (err) {
        console.warn("Failed to load room history", err.message);
      }
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

    socket.on("error", ({ message }) => {
      console.warn("Socket error:", message);
    });

    return () => {
      mounted = false;
      socket.emit("room:leave", { roomId });
      disconnectSocket();
    };
  }, [roomId, token]);

  const sendMessage = () => {
    if (!draft.trim() || !socketRef.current) return;
    socketRef.current.emit("chat:message", { roomId, content: draft.trim() });
    setDraft("");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{roomName}</Text>
        <Text style={styles.presence}>
          {presence.length} online{presence.length ? `: ${presence.map((p) => p.username).join(", ")}` : ""}
        </Text>
      </View>

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b12" },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#1e1e28" },
  title: { color: "#fff", fontSize: 20, fontWeight: "700" },
  presence: { color: "#7a7a88", fontSize: 12, marginTop: 4 },
  messageRow: { marginBottom: 14 },
  messageAuthor: { color: "#7c5cff", fontSize: 12, fontWeight: "600", marginBottom: 2 },
  messageContent: { color: "#e5e5ea", fontSize: 15 },
  inputRow: { flexDirection: "row", padding: 12, borderTopWidth: 1, borderTopColor: "#1e1e28", gap: 8 },
  input: {
    flex: 1,
    backgroundColor: "#17171f",
    color: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendButton: { backgroundColor: "#7c5cff", borderRadius: 10, paddingHorizontal: 18, justifyContent: "center" },
  sendButtonText: { color: "#fff", fontWeight: "600" },
});
