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

  // Add user to queue with a timestamp
  set(userQueueRef, { joinedAt: Date.now() })
    .then(() => {
      console.log(`User ${userId} added to queue`);
    })
    .catch((error) => {
      console.error(`Failed to add ${userId} to queue:`, error);
    });

  // Listen for queue changes
  const handleQueueChange = (snapshot) => {
    const queue = snapshot.val();
    if (!queue) {
      console.log("Queue is empty");
      return;
    }

    const usersInQueue = Object.keys(queue);
    console.log("Current queue:", usersInQueue);

    if (usersInQueue.length >= 2) {
      // Only the user with the lowest ID (first in queue) initiates pairing
      const sortedUsers = usersInQueue.sort(); // Sort to ensure consistency
      if (userId === sortedUsers[0]) {
        const user1 = sortedUsers[0];
        const user2 = sortedUsers[1];

        // Generate a single chatId for the pair
        const chatId = push(ref(database, "chats")).key;
        console.log(`Pairing ${user1} and ${user2} with chatId: ${chatId}`);

        // Set up the chat room
        Promise.all([
          set(ref(database, `chats/${chatId}/users/${user1}`), true),
          set(ref(database, `chats/${chatId}/users/${user2}`), true),
          remove(ref(database, `queue/${user1}`)),
          remove(ref(database, `queue/${user2}`)),
        ])
          .then(() => {
            console.log(`Chat ${chatId} created, users removed from queue`);
            // Notify this user (first in queue)
            if (user1 === userId || user2 === userId) {
              onPaired(chatId);
            }
          })
          .catch((error) => {
            console.error("Failed to set up chat:", error);
          });
      } else {
        // Other users wait for the chatId to be assigned
        const chatCheckRef = ref(database, "chats");
        const checkChat = onValue(chatCheckRef, (chatSnapshot) => {
          const chats = chatSnapshot.val();
          if (chats) {
            Object.entries(chats).forEach(([id, chatData]) => {
              const users = chatData.users || {};
              if (users[userId]) {
                console.log(`User ${userId} found in chat ${id}`);
                onPaired(id);
                off(chatCheckRef, "value", checkChat); // Stop listening
                off(queueRef, "value", handleQueueChange); // Stop queue listener
              }
            });
          }
        });
      }
    }
  };

  onValue(queueRef, handleQueueChange);
};