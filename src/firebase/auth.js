import { auth, database } from "./firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { ref, set, onValue, remove, push, off, get } from "firebase/database";

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
    console.log("Auth state changed:", user ? user.uid : "No user");
    if (user) {
      callback(user);
    } else {
      callback(null);
    }
  });
};

// Join the chat queue and handle pairing with detailed debugging
export const joinQueue = (userId, onPaired) => {
  const queueRef = ref(database, "queue");
  const userQueueRef = ref(database, `queue/${userId}`);

  console.log(`[DEBUG] ${userId}: Starting joinQueue`);

  // Add user to queue with a timestamp
  set(userQueueRef, { joinedAt: Date.now() })
    .then(() => {
      console.log(`[DEBUG] ${userId}: Successfully added to queue at ${Date.now()}`);
    })
    .catch((error) => {
      console.error(`[DEBUG] ${userId}: Failed to add to queue:`, error.message);
    });

  // Listen for-queue changes
  const handleQueueChange = (snapshot) => {
    const queue = snapshot.val();
    console.log(`[DEBUG] ${userId}: Queue snapshot at ${Date.now()}:`, queue ? Object.keys(queue) : "Empty");

    if (!queue) {
      console.log(`[DEBUG] ${userId}: Queue is empty`);
      return;
    }

    const usersInQueue = Object.keys(queue);
    if (usersInQueue.length >= 2) {
      const sortedUsers = usersInQueue.sort(); // Sort for consistent leader
      console.log(`[DEBUG] ${userId}: Queue has ${usersInQueue.length} users:`, sortedUsers);

      if (userId === sortedUsers[0]) {
        // Leader creates the chat
        const user1 = sortedUsers[0];
        const user2 = sortedUsers[1];
        const chatId = push(ref(database, "chats")).key;
        console.log(`[DEBUG] ${userId}: Leader initiating pairing for ${user1} and ${user2} with chatId: ${chatId}`);

        Promise.all([
          set(ref(database, `chats/${chatId}/users/${user1}`), true),
          set(ref(database, `chats/${chatId}/users/${user2}`), true),
          remove(ref(database, `queue/${user1}`)),
          remove(ref(database, `queue/${user2}`)),
        ])
          .then(() => {
            console.log(`[DEBUG] ${userId}: Chat ${chatId} created and users removed from queue`);
            if (user1 === userId || user2 === userId) {
              console.log(`[DEBUG] ${userId}: Leader calling onPaired with chatId: ${chatId}`);
              onPaired(chatId);
              off(queueRef, "value", handleQueueChange);
              console.log(`[DEBUG] ${userId}: Stopped queue listener after pairing`);
            }
          })
          .catch((error) => {
            console.error(`[DEBUG] ${userId}: Failed to set up chat:`, error.message);
          });
      } else {
        // Follower waits for chat assignment
        off(queueRef, "value", handleQueueChange); // Stop queue listener immediately
        console.log(`[DEBUG] ${userId}: Stopped queue listener for follower`);
        const chatCheckRef = ref(database, "chats");
        console.log(`[DEBUG] ${userId}: Follower starting chat listener`);

        // Immediate check for existing chat
        get(chatCheckRef).then((snapshot) => {
          const chats = snapshot.val();
          console.log(`[DEBUG] ${userId}: Initial chats snapshot at ${Date.now()}:`, chats ? Object.keys(chats) : "No chats");
          if (chats) {
            for (const [id, chatData] of Object.entries(chats)) {
              const users = chatData.users || {};
              console.log(`[DEBUG] ${userId}: Checking chat ${id} users:`, Object.keys(users));
              if (users[userId]) {
                console.log(`[DEBUG] ${userId}: Found in chat ${id} (initial check), calling onPaired`);
                onPaired(id);
                return; // Exit early if found
              }
            }
          }
        }).catch((error) => {
          console.error(`[DEBUG] ${userId}: Initial chat check failed:`, error.message);
        });

        // Continuous listener for new chats
        const checkChat = onValue(chatCheckRef, (chatSnapshot) => {
          const chats = chatSnapshot.val();
          console.log(`[DEBUG] ${userId}: Chats snapshot at ${Date.now()}:`, chats ? Object.keys(chats) : "No chats");
          if (chats) {
            for (const [id, chatData] of Object.entries(chats)) {
              const users = chatData.users || {};
              console.log(`[DEBUG] ${userId}: Checking chat ${id} users:`, Object.keys(users));
              if (users[userId]) {
                console.log(`[DEBUG] ${userId}: Found in chat ${id}, calling onPaired`);
                onPaired(id);
                off(chatCheckRef, "value", checkChat);
                console.log(`[DEBUG] ${userId}: Stopped chat listener after pairing`);
                break;
              }
            }
          }
        });

        // Fallback timeout if chat isn’t detected within 10 seconds
        setTimeout(() => {
          off(chatCheckRef, "value", checkChat);
          console.log(`[DEBUG] ${userId}: Timeout - No chat found after 10s`);
        }, 10000);
      }
    }
  };

  console.log(`[DEBUG] ${userId}: Starting queue listener`);
  onValue(queueRef, handleQueueChange);
};