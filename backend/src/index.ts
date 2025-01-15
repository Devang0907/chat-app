import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  socket: WebSocket;
  room: string;
  username: string;
  dp: string; // Display Picture URL
}

let allSocket: User[] = [];

wss.on("connection", (socket) => {
  socket.on("message", (message) => {
    const parsedMessage = JSON.parse(message.toString());

    if (parsedMessage.type === "join") {
      const { roomId, username, dp } = parsedMessage.payload;
      // Add user to the list with room, username, and dp
      allSocket.push({
        socket,
        room: roomId,
        username,
        dp,
      });
      console.log(`User ${username} joined room ${roomId} with DP: ${dp}`);
    }

    if (parsedMessage.type === "chat") {
      let currentRoom: string | null = null;
      let senderUsername: string | null = null;
      let senderDp: string | null = null;

      // Find the current room, username, and DP of the sender
      for (let i = 0; i < allSocket.length; i++) {
        if (allSocket[i].socket === socket) {
          currentRoom = allSocket[i].room;
          senderUsername = allSocket[i].username;
          senderDp = allSocket[i].dp;
          break;
        }
      }

      if (currentRoom && senderUsername && senderDp) {
        // Broadcast the message to all users in the same room except the sender
        allSocket.forEach((user) => {
          if (user.room === currentRoom && user.socket !== socket) {
            user.socket.send(
              JSON.stringify({
                text: parsedMessage.payload.message,
                username: senderUsername,
                dp: senderDp,
              })
            );
          }
        });
      }
    }
  });

  socket.on("close", () => {
    // Remove the user from the list when they disconnect
    allSocket = allSocket.filter((user) => user.socket !== socket);
    console.log("A user disconnected.");
  });
});
