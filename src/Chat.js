import React, { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import axios from "axios";

function Chat() {

  const params = new URLSearchParams(window.location.search);
  const senderId = Number(params.get("userId"));

  const connectionRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);

  const [message, setMessage] = useState("");
  const [typingUser, setTypingUser] = useState(null);

  const [lastMessages, setLastMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});


  // Load users
  useEffect(() => {

axios.get("https://chatapp-backend-f7fmbvgragb8g8g5.centralus-01.azurewebsites.net/api/users")
      .then(res => setUsers(res.data))
      .catch(err => console.log(err));

  }, []);



  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);



  // SignalR connection
  useEffect(() => {

    const connection = new signalR.HubConnectionBuilder()
.withUrl("https://chatapp-backend-f7fmbvgragb8g8g5.centralus-01.azurewebsites.net/chatHub")
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    connection.start()
      .then(() => console.log("SignalR Connected"))
      .catch(err => console.log(err));


    // Receive message
    connection.on("ReceiveMessage", (sender, receiver, text, sentAt) => {

      setMessages(prev => [
        ...prev,
        {
          senderId: sender,
          receiverId: receiver,
          text,
          sentAt
        }
      ]);

      const otherUser = sender === senderId ? receiver : sender;

      // Update last message preview
      setLastMessages(prev => ({
        ...prev,
        [otherUser]: text
      }));

      // Increase unread if chat not open
      if (selectedUser?.id !== otherUser) {

        setUnreadCounts(prev => ({
          ...prev,
          [otherUser]: (prev[otherUser] || 0) + 1
        }));

      }

    });


    // Online user
    connection.on("UserOnline", (userId) => {

      setOnlineUsers(prev => [...new Set([...prev, userId])]);

    });


    // Offline user
    connection.on("UserOffline", (userId) => {

      setOnlineUsers(prev => prev.filter(id => id !== userId));

    });


    // Typing indicator
    connection.on("UserTyping", (userId) => {

      setTypingUser(userId);

      setTimeout(() => {
        setTypingUser(null);
      }, 2000);

    });

  }, [senderId, selectedUser]);



  // Load conversation
  const loadConversation = async (user) => {

    setSelectedUser(user);

    // Reset unread counter
    setUnreadCounts(prev => ({
      ...prev,
      [user.id]: 0
    }));

    const res = await axios.get(
      `http://localhost:5071/api/messages/conversation?user1=${senderId}&user2=${user.id}`
    );

    setMessages(res.data);

  };



  // Send message
  const sendMessage = async () => {

    if (!selectedUser || message.trim() === "") return;

    await connectionRef.current.invoke(
      "SendPrivateMessage",
      senderId,
      selectedUser.id,
      message
    );

    setMessage("");

  };



  return (

    <div style={{ display: "flex", height: "500px", fontFamily: "Arial" }}>

      {/* USERS */}
      <div style={{ width: "220px", borderRight: "1px solid #ccc", padding: "10px" }}>

        <h3>Users</h3>

        {users
          .filter(u => u.id !== senderId)
          .map(user => {

            const isOnline = onlineUsers.includes(user.id);

            return (

              <div
                key={user.id}
                onClick={() => loadConversation(user)}
                style={{
                  padding: "10px",
                  cursor: "pointer",
                  background: selectedUser?.id === user.id ? "#eee" : "white"
                }}
              >

                <div>
                  {isOnline ? "🟢" : "⚫"} {user.name}

                  {unreadCounts[user.id] > 0 && (
                    <span style={{
                      background: "red",
                      color: "white",
                      borderRadius: "12px",
                      padding: "2px 6px",
                      marginLeft: "8px",
                      fontSize: "12px"
                    }}>
                      {unreadCounts[user.id]}
                    </span>
                  )}

                </div>

                <div style={{
                  fontSize: "12px",
                  color: "gray"
                }}>
                  {lastMessages[user.id]}
                </div>

              </div>

            );

          })}

      </div>



      {/* CHAT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        <div style={{
          padding: "10px",
          borderBottom: "1px solid #ccc",
          background: "#f5f5f5"
        }}>
          <b>
            {selectedUser ? `Chat with ${selectedUser.name}` : "Select User"}
          </b>

          {typingUser === selectedUser?.id && (

            <div style={{ fontSize: "12px", fontStyle: "italic" }}>
              {selectedUser.name} is typing...
            </div>

          )}

        </div>



        {/* Messages */}
        <div style={{
          flex: 1,
          padding: "10px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          background: "#e5ddd5"
        }}>

          {messages.map((msg, index) => {

            const isSender = msg.senderId === senderId;

            return (

              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: isSender ? "flex-end" : "flex-start",
                  marginBottom: "8px"
                }}
              >

                <div style={{
                  background: isSender ? "#DCF8C6" : "white",
                  padding: "10px",
                  borderRadius: "10px",
                  maxWidth: "220px"
                }}>

                  <div>{msg.text}</div>

                  {msg.sentAt && (
                    <div style={{
                      fontSize: "10px",
                      textAlign: "right",
                      marginTop: "4px"
                    }}>
                      {new Date(msg.sentAt).toLocaleTimeString()}
                    </div>
                  )}

                </div>

              </div>

            );

          })}

          <div ref={messagesEndRef}></div>

        </div>



        {/* Input */}
        <div style={{ display: "flex", padding: "10px", borderTop: "1px solid #ccc" }}>

          <input
            style={{ flex: 1, padding: "8px" }}
            value={message}
            placeholder="Type message"
            onChange={(e) => {

              setMessage(e.target.value);

              if (selectedUser) {

                connectionRef.current.invoke(
                  "Typing",
                  senderId,
                  selectedUser.id
                );

              }

            }}
          />

          <button onClick={sendMessage}>
            Send
          </button>

        </div>

      </div>

    </div>

  );

}

export default Chat;