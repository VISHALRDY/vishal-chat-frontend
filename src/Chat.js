import React, { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import axios from "axios";

const API = "https://chatapp-backend-f7fmbvgragb8g8g5.centralus-01.azurewebsites.net";

function Chat() {

  const senderId = Number(localStorage.getItem("userId"));
  const token = localStorage.getItem("token");

  if (!senderId || !token) {
    window.location.href = "/login";
  }

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


  // LOAD USERS
  useEffect(() => {

    axios.get(`${API}/api/users`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(res => setUsers(res.data))
    .catch(err => console.log(err));

  }, [token]);


  // AUTO SCROLL
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  // SIGNALR CONNECTION
  useEffect(() => {

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API}/chatHub?userId=${senderId}`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    connection.start()
      .then(() => console.log("SignalR Connected"))
      .catch(err => console.log(err));


    connection.on("ReceiveMessage", (sender, receiver, text, sentAt) => {

      const otherUser = sender === senderId ? receiver : sender;

      if (
        selectedUser &&
        (sender === selectedUser.id || receiver === selectedUser.id)
      ) {
        setMessages(prev => [
          ...prev,
          { senderId: sender, receiverId: receiver, text, sentAt }
        ]);
      }

      setLastMessages(prev => ({
        ...prev,
        [otherUser]: text
      }));

      if (selectedUser?.id !== otherUser) {
        setUnreadCounts(prev => ({
          ...prev,
          [otherUser]: (prev[otherUser] || 0) + 1
        }));
      }

    });


    connection.on("UserOnline", (userId) => {
      setOnlineUsers(prev => [...new Set([...prev, userId])]);
    });


    connection.on("UserOffline", (userId) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });


    connection.on("OnlineUsers", (users) => {
      setOnlineUsers(users);
    });


    connection.on("UserTyping", (userId) => {

      setTypingUser(userId);

      setTimeout(() => {
        setTypingUser(null);
      }, 2000);

    });

    return () => {
      connection.stop();
    };

  }, [senderId, token, selectedUser]);


  // LOAD CONVERSATION
  const loadConversation = async (user) => {

    setSelectedUser(user);

    setUnreadCounts(prev => ({
      ...prev,
      [user.id]: 0
    }));

    const res = await axios.get(
      `${API}/api/messages/conversation?user1=${senderId}&user2=${user.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    setMessages(res.data);

  };


  // SEND MESSAGE
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


  const logout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("name");

    window.location.href = "/login";

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

                <div style={{ fontSize: "12px", color: "gray" }}>
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
          background: "#f5f5f5",
          display: "flex",
          justifyContent: "space-between"
        }}>
          <b>
            {selectedUser ? `Chat with ${selectedUser.name}` : "Select User"}
          </b>

          <button onClick={logout}>Logout</button>

          {typingUser === selectedUser?.id && (
            <div style={{ fontSize: "12px", fontStyle: "italic" }}>
              {selectedUser.name} is typing...
            </div>
          )}

        </div>


        {/* MESSAGES */}
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


        {/* INPUT */}
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