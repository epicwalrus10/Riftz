import React, { useState, useEffect } from 'react';
import { auth } from '../firebase/firebase';
import { loginAnonymously, joinQueue } from '../firebase/auth';
import Chat from './Chat';

function Home() {
  const [user, setUser] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [error, setError] = useState(null); // Added for error handling

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      console.log('Auth state changed:', currentUser ? currentUser.uid : 'No user');
      setUser(currentUser);
      setError(null); // Clear any previous errors on auth change
    });
    return () => unsubscribe();
  }, []);

  // Handle joining the chat queue
  const handleJoinChat = async () => {
    try {
      setError(null); // Reset error state
      let currentUser = user;
      if (!currentUser) {
        console.log('Logging in anonymously...');
        currentUser = await loginAnonymously();
        setUser(currentUser);
      }
      console.log('Joining queue with user:', currentUser.uid);
      setIsWaiting(true);
      joinQueue(currentUser.uid, (newChatId) => {
        console.log('Paired! Assigned chatId:', newChatId);
        setChatId(newChatId);
        setIsWaiting(false);
      });
    } catch (err) {
      console.error('Error joining chat:', err.message);
      setError('Failed to join chat: ' + err.message);
      setIsWaiting(false);
    }
  };

  // Handle ending the chat
  const handleEndChat = () => {
    console.log('Ending chat, chatId:', chatId);
    setChatId(null);
    setError(null); // Clear error when ending chat
  };

  // Render states
  if (isWaiting) {
    return (
      <div>
        <p>Waiting for a match... Please wait while we pair you with someone.</p>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    );
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
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={handleJoinChat}>Join Chat</button>
    </div>
  );
}

export default Home;