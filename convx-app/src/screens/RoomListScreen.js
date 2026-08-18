import React, { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function RoomListScreen({ navigation }) {
  const { token, user, logout } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");

  const loadRooms = useCallback(async () => {
    try {
      const data = await api.listRooms();
      setRooms(data);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRooms();
    }, [loadRooms])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRooms();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!newRoomName.trim()) return;
    try {
      const room = await api.createRoom({ name: newRoomName.trim() }, token);
      setNewRoomName("");
      await loadRooms();
      navigation.navigate("Room", { roomId: room.id, roomName: room.name });
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const handleOpen = async (room) => {
    try {
      await api.joinRoom(room.id, token);
      navigation.navigate("Room", { roomId: room.id, roomName: room.name });
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rooms</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Log out ({user?.username})</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.createRow}>
        <TextInput
          style={styles.input}
          placeholder="New room name"
          placeholderTextColor="#888"
          value={newRoomName}
          onChangeText={setNewRoomName}
        />
        <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={<Text style={styles.empty}>No rooms yet — create one above.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.roomCard} onPress={() => handleOpen(item)}>
            <Text style={styles.roomName}>{item.name}</Text>
            {item.description ? <Text style={styles.roomDesc}>{item.description}</Text> : null}
            <Text style={styles.roomMeta}>
              {item._count?.members ?? 0} members · by {item.owner?.username}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b12", paddingTop: 60, paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: "700", color: "#fff" },
  logout: { color: "#9a9aa8", fontSize: 12 },
  createRow: { flexDirection: "row", marginBottom: 20, gap: 8 },
  input: {
    flex: 1,
    backgroundColor: "#17171f",
    color: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  createButton: {
    backgroundColor: "#7c5cff",
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  createButtonText: { color: "#fff", fontWeight: "600" },
  roomCard: {
    backgroundColor: "#17171f",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  roomName: { color: "#fff", fontSize: 17, fontWeight: "600" },
  roomDesc: { color: "#b3b3c0", marginTop: 4 },
  roomMeta: { color: "#7a7a88", marginTop: 8, fontSize: 12 },
  empty: { color: "#7a7a88", textAlign: "center", marginTop: 40 },
});
