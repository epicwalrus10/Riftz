import React, { useState, useEffect } from 'react';
import { database } from '../firebase/firebase';
import { ref, onValue, push } from 'firebase/database';

function Chat({ chatId, userId, onEndChat }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Fetch and listen for messages in real-time
  useEffect(() => {
    const messagesRef = ref(database, `chats/${chatId}/messages`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      const loadedMessages = data
        ? Object.entries(data).map(([key, value]) => ({ id: key, ...value }))
        : [];
      setMessages(loadedMessages);
    }, (error) => {
      console.error("Error fetching messages:", error);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [chatId]);

  // Send a new message
  const sendMessage = () => {
    if (newMessage.trim() === '') return;
    const messagesRef = ref(database, `chats/${chatId}/messages`);
    push(messagesRef, {
      text: newMessage,
      sender: userId,
      timestamp: Date.now(),
    });
    setNewMessage('');
  };

  return (
    <div className="chat-container">
      <h2>Chat Room</h2>
      <button className="end-chat-button" onClick={onEndChat}>End Chat</button>
      <div className="message-list">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.sender === userId ? 'sent' : 'received'}`}
          >
            {msg.text}
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default Chat;