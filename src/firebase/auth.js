import { auth, database } from "./firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { ref, set, onValue, remove, push } from "firebase/database";

export const loginAnonymously = async () => {
  try {
    const result = await signInAnonymously(auth);
    console.log("Logged in as:", result.user.uid);
    return result.user;
  } catch (error) {
    console.error("Anonymous login failed:", error.code, error.message);
    throw error;
  }
};

export const monitorAuthState = (callback) => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      callback(user);
    } else {
      callback(null);
    }
  });
};

export const joinQueue = (userId, onPaired) => {
  const queueRef = ref(database, "queue");
  const userQueueRef = ref(database, `queue/${userId}`);

  // Add user to queue
  set(userQueueRef, true);

  // Listen for queue changes
  onValue(queueRef, (snapshot) => {
    const queue = snapshot.val();
    if (!queue) return;

    const usersInQueue = Object.keys(queue);
    if (usersInQueue.length >= 2 && usersInQueue.includes(userId)) {
      // Pair the first two users (including this user if present)
      const user1 = usersInQueue[0];
      const user2 = usersInQueue[1];

      // Create a unique chat ID
      const chatId = push(ref(database, "chats")).key;

      // Set up the chat room
      set(ref(database, `chats/${chatId}/users/${user1}`), true);
      set(ref(database, `chats/${chatId}/users/${user2}`), true);

      // Remove paired users from queue
      remove(ref(database, `queue/${user1}`));
      remove(ref(database, `queue/${user2}`));

      // Callback with chat ID if this user is paired
      if (user1 === userId || user2 === userId) {
        onPaired(chatId);
      }
    }
  });
};