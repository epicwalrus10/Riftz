import React, { useState, useEffect } from 'react';
import { auth } from '../firebase/firebase';
import { loginAnonymously, joinQueue } from '../auth';
import Chat from './Chat';

function Home() {
  const [user, setUser] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);

  useEffect(() => {
    // Set the current user when auth state changes
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleJoinChat = async () => {
    let currentUser = user;
    if (!currentUser) {
      currentUser = await loginAnonymously();
      setUser(currentUser);
    }
    setIsWaiting(true);
    joinQueue(currentUser.uid, (newChatId) => {
      setChatId(newChatId);
      setIsWaiting(false);
    });
  };

  const handleEndChat = () => {
    setChatId(null); // Return to home screen
  };

  if (isWaiting) {
    return <p>Waiting for a match...</p>;
  }

  if (chatId) {
    return <Chat chatId={chatId} userId={user.uid} onEndChat={handleEndChat} />;
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