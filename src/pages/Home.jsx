import React, { useState, useEffect } from "react";
import { loginAnonymously, monitorAuthState, joinQueue } from "../firebase/auth";

function Home() {
  const [user, setUser] = useState(null);
  const [chatId, setChatId] = useState(null);

  useEffect(() => {
    monitorAuthState((currentUser) => {
      setUser(currentUser);
    });
  }, []);

  const handleJoinChat = async () => {
    let currentUser = user;
    if (!currentUser) {
      currentUser = await loginAnonymously();
      setUser(currentUser);
    }
    joinQueue(currentUser.uid, (newChatId) => {
      setChatId(newChatId);
      console.log("Paired! Chat ID:", newChatId);
    });
    console.log("Joining chat...");
  };

  if (chatId) {
    return (
      <div>
        <h1>Paired!</h1>
        <p>Chat ID: {chatId}</p>
        {/* We'll replace this with Chat.jsx later */}
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome to Riftz</h1>
      <p>An Omegle-inspired anonymous chat app.</p>
      {user ? (
        <p>Logged in as anonymous user: {user.uid}</p>
      ) : (
        <p>Not logged in yet.</p>
      )}
      <button onClick={handleJoinChat}>Join Chat</button>
    </div>
  );
}

export default Home;