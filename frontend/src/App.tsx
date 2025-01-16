import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const [roomId, setRoomId] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [dp, setDp] = useState<string>("");
  const [joined, setJoined] = useState<boolean>(false);
  const [messages, setMessages] = useState<
    { text: string; sent: boolean; username: string; timestamp: string; dp: string }[]
  >([]);
  const [input, setInput] = useState<string>("");

  const wsRef = useRef<WebSocket | null>(null);

  const preBuiltDps = [
    "/images/dp1.jpg",
    "/images/dp2.jpg",
    "/images/dp3.jpg",
    "/images/dp4.jpg",
  ];

  const getCurrentTimestamp = () => {
    const now = new Date();
    return now.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  useEffect(() => {
    if (!joined) return;

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

const ws = new WebSocket(backendUrl);


    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "join",
          payload: {
            roomId,
            username,
            dp,
          },
        })
      );
    };

    ws.onmessage = (event) => {
      const messageData = JSON.parse(event.data);
      setMessages((msgs) => [
        ...msgs,
        {
          text: messageData.text,
          sent: false,
          username: messageData.username || "Unknown",
          dp: messageData.dp || "/images/dp1.jpg", // Default DP if not provided
          timestamp: getCurrentTimestamp(),
        },
      ]);
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed.");
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [joined, roomId, username, dp]);

  const handleJoin = () => {
    if (roomId.trim() && username.trim() && dp) {
      setJoined(true);
    }
  };

  const sendMessage = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && input.trim()) {
      const messageObj = {
        type: "chat",
        payload: {
          message: input,
          username,
          dp,
        },
      };
      wsRef.current.send(JSON.stringify(messageObj));
      setMessages((msgs) => [
        ...msgs,
        {
          text: input,
          sent: true,
          username,
          dp,
          timestamp: getCurrentTimestamp(),
        },
      ]);
      setInput(""); // Clear input after sending
    }
  };

  if (!joined) {
    return (
      <div className="h-screen flex flex-col justify-center items-center bg-gray-900 text-gray-200">
        <div className="p-6 bg-gray-800 rounded-md shadow-md">
          <h1 className="text-lg font-semibold mb-4">Enter Room ID, Username and Set DP</h1>
          <input
            className="w-full p-2 mb-4 border border-gray-700 bg-gray-700 text-gray-200 rounded-md"
            type="text"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <input
            className="w-full p-2 mb-4 border border-gray-700 bg-gray-700 text-gray-200 rounded-md"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <select
            className="w-full p-2 mb-4 border border-gray-700 bg-gray-700 text-gray-200 rounded-md"
            value={dp}
            onChange={(e) => setDp(e.target.value)}
          >
            <option value="">Select Display Picture</option>
            {preBuiltDps.map((dpUrl, index) => (
              <option key={index} value={dpUrl}>
                {`DP ${index + 1}`}
              </option>
            ))}
          </select>
          <button
            className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-500 transition"
            onClick={handleJoin}
          >
            Join Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-200">
      <div className="flex items-center justify-between p-4 bg-gray-800 shadow-md">
        <h1 className="text-lg font-medium">Room ID: {roomId}</h1>
        <button
          className="text-sm text-red-400 underline hover:text-red-300 transition"
          onClick={() => setJoined(false)}
        >
          Leave Room
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.sent ? "justify-end" : "justify-start"
            }`}
          >
            <div>
              <img
                src={msg.dp}
                alt="dp"
                className="w-8 h-8 rounded-full object-cover mr-3"
              />
              <div className="inline-block">
                <span
                  className={`px-4 py-2 rounded-lg text-sm block ${
                    msg.sent
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-200"
                  }`}
                >
                  {msg.text}
                </span>
                <span className="text-xs text-gray-400 block mt-1">
                  {msg.username} | {msg.timestamp}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-gray-800 flex items-center space-x-2 border-t border-gray-700">
        <input
          className="flex-1 p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md"
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-500 transition"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
