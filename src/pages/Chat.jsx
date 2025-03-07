import React, { useState, useEffect, useRef } from 'react';
import { database } from '../firebase/firebase';
import { ref, onValue, push } from 'firebase/database';

function Chat({ chatId, userId, onEndChat }) {
  const [messages, setMessages] = useState([]); // Store chat messages
  const [newMessage, setNewMessage] = useState(''); // Input for new message
  const [error, setError] = useState(null); // Error state for feedback
  const messagesEndRef = useRef(null); // Ref to auto-scroll to latest message

  // Fetch and sync messages in real-time
  useEffect(() => {
    if (!chatId || !userId) {
      console.error('Missing chatId or userId:', { chatId, userId });
      setError('Invalid chat session');
      return;
    }

    const messagesRef = ref(database, `chats/${chatId}/messages`);
    console.log(`Listening to messages at: chats/${chatId}/messages`);

    const unsubscribe = onValue(
      messagesRef,
      (snapshot) => {
        const data = snapshot.val();
        console.log(`Received messages for chat ${chatId}:`, data);
        const loadedMessages = data
          ? Object.entries(data).map(([key, value]) => ({
              id: key,
              ...value,
            }))
          : [];
        setMessages(loadedMessages);
        setError(null); // Clear error on successful fetch
      },
      (error) => {
        console.error('Error syncing messages:', error.message);
        setError('Failed to load messages: ' + error.message);
      }
    );

    // Cleanup listener on unmount or chatId change
    return () => {
      console.log(`Unsubscribing from chat ${chatId}`);
      unsubscribe();
    };
  }, [chatId, userId]);

  // Auto-scroll to the latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Send a new message
  const sendMessage = () => {
    if (newMessage.trim() === '') {
      console.log('Empty message ignored');
      return;
    }

    const messagesRef = ref(database, `chats/${chatId}/messages`);
    push(messagesRef, {
      text: newMessage,
      sender: userId,
      timestamp: Date.now(),
    })
      .then(() => {
        console.log('Message sent successfully:', newMessage);
      })
      .catch((error) => {
        console.error('Failed to send message:', error.message);
        setError('Failed to send message: ' + error.message);
      });
    setNewMessage('');
  };

  // Handle Enter key press to send message
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <h2>Chat Room</h2>
      <button className="end-chat-button" onClick={onEndChat}>
        End Chat
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div className="message-list">
        {messages.length === 0 ? (
          <p>No messages yet. Start chatting!</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${msg.sender === userId ? 'sent' : 'received'}`}
            >
              <span>{msg.text}</span>
              <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
            </div>
          ))
        )}
        <div ref={messagesEndRef} /> {/* Anchor for scrolling */}
      </div>
      <div className="input-area">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={!!error} // Disable input if there’s an error
        />
        <button onClick={sendMessage} disabled={!!error}>
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;