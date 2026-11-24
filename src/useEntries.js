// src/useEntries.js — Firestore entries hook
import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export function useEntries(uid) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, "users", uid, "entries"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return unsub;
  }, [uid]);

  async function addEntry(data) {
    await addDoc(collection(db, "users", uid, "entries"), {
      ...data,
      createdAt: serverTimestamp(),
    });
  }

  return { entries, loading, addEntry };
}
