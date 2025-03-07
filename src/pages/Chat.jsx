import React, { useState, useEffect } from 'react';
import { database } from '../firebase/firebase';
import { ref, onValue, push } from 'firebase/database';

function Chat({ chatId, userId, onEndChat }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const messagesRef = ref(database, `chats/${chatId}/messages`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      const loadedMessages = data ? Object.values(data) : [];
      setMessages(loadedMessages);
    });
    return () => unsubscribe();
  }, [chatId]);

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
    <div>
      <h2>Chat Room</h2>
      <button onClick={onEndChat}>End Chat</button>
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={msg.sender === userId ? 'sent' : 'received'}>
            {msg.text}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default Chat;