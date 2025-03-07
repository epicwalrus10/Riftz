import { auth, database } from "./firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { ref, set, onValue, remove, push, off } from "firebase/database";

// Anonymous login function
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

// Monitor authentication state changes
export const monitorAuthState = (callback) => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      callback(user);
    } else {
      callback(null);
    }
  });
};

// Join the chat queue and handle pairing
export const joinQueue = (userId, onPaired) => {
  const queueRef = ref(database, "queue");
  const userQueueRef = ref(database, `queue/${userId}`);

  // Add user to queue with a timestamp for better tracking
  set(userQueueRef, { joinedAt: Date.now() });

  // Define the queue listener function
  const handleQueueChange = (snapshot) => {
    const queue = snapshot.val();
    if (!queue) return;

    const usersInQueue = Object.keys(queue);
    if (usersInQueue.length >= 2 && usersInQueue.includes(userId)) {
      // Pair the first two users
      const user1 = usersInQueue[0];
      const user2 = usersInQueue[1];

      // Generate a unique chat ID
      const chatId = push(ref(database, "chats")).key;

      // Set up the chat room for both users
      set(ref(database, `chats/${chatId}/users/${user1}`), true);
      set(ref(database, `chats/${chatId}/users/${user2}`), true);

      // Remove paired users from the queue
      remove(ref(database, `queue/${user1}`));
      remove(ref(database, `queue/${user2}`));

      // Trigger callback if the current user is paired
      if (user1 === userId || user2 === userId) {
        onPaired(chatId);
        // Stop listening to queue changes after pairing
        off(queueRef, "value", handleQueueChange);
      }
    }
  };

  // Attach the listener to the queue
  // NOTE: This listener is removed after pairing to prevent multiple active listeners
  onValue(queueRef, handleQueueChange);
};