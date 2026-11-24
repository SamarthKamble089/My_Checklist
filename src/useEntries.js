// src/useEntries.js — Firestore entries hook
import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export function useEntries(uid) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uid) return;

    const colRef = collection(db, "users", uid, "entries");
    const q = query(colRef);

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Sort in memory by date/time or createdAt so missing indexes never break retrieval
        docs.sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.timestamp || 0);
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.timestamp || 0);
          return tA - tB;
        });
        setEntries(docs);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore onSnapshot error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [uid]);

  async function addEntry(data) {
    try {
      await addDoc(collection(db, "users", uid, "entries"), {
        ...data,
        timestamp: Date.now(),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to addDoc in Firestore:", err);
      throw err;
    }
  }

  return { entries, loading, error, addEntry };
}
