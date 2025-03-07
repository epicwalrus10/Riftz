import { useState } from "react";

function useChat() {
  const [messages, setMessages] = useState([]);
  return { messages, setMessages }; // Placeholder
}

export default useChat;