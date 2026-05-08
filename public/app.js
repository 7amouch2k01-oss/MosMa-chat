const socket = io();

// DOM Elements
const joinContainer = document.getElementById('join-container');
const chatMain = document.getElementById('chat-main');
const chatFormContainer = document.getElementById('chat-form-container');
const joinBtn = document.getElementById('join-btn');
const leaveBtn = document.getElementById('leave-btn');
const usernameInput = document.getElementById('username-input');
const roomSelect = document.getElementById('room-select');
const chatForm = document.getElementById('chat-form');
const chatMessages = document.getElementById('chat-messages');
const msgInput = document.getElementById('msg');
const currentRoomSpan = document.getElementById('current-room');

let currentUser = '';
let currentRoom = '';

// Format time
const formatTime = (dateString) => {
    const options = { hour: 'numeric', minute: 'numeric' };
    return new Date(dateString).toLocaleTimeString([], options);
};

// Join Room Event
joinBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const room = roomSelect.value;

    if (!username) {
        alert('Please enter a username');
        return;
    }

    currentUser = username;
    currentRoom = room;

    // UI transitions
    joinContainer.classList.add('hidden');
    chatMain.classList.remove('hidden');
    chatFormContainer.classList.remove('hidden');
    currentRoomSpan.innerText = `Room: ${room}`;

    // Join room via socket
    socket.emit('join_room', room);
});

// Leave Room Event
leaveBtn.addEventListener('click', () => {
    window.location.reload();
});

// Send Message Event
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();

    let msg = msgInput.value.trim();

    if (!msg) {
        return;
    }

    const messageData = {
        username: currentUser,
        content: msg,
        room: currentRoom,
        createdAt: new Date().toISOString()
    };

    // Emit message to server
    socket.emit('send_message', messageData);

    // Clear input
    msgInput.value = '';
    msgInput.focus();
});

// Receive previous messages
socket.on('previous_messages', (messages) => {
    chatMessages.innerHTML = '';
    messages.forEach(message => {
        outputMessage(message);
    });
    chatMain.scrollTop = chatMain.scrollHeight;
});

// Receive new message
socket.on('receive_message', (message) => {
    outputMessage(message);
    chatMain.scrollTop = chatMain.scrollHeight;
});

// Output message to DOM
function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    
    // Check if message is from current user
    if (message.username === currentUser) {
        div.classList.add('sent');
    } else {
        div.classList.add('received');
    }

    div.innerHTML = `
        <div class="message-meta">
            <span class="username">${message.username}</span>
            <span class="time">${formatTime(message.createdAt)}</span>
        </div>
        <div class="message-bubble">
            ${message.content}
        </div>
    `;

    chatMessages.appendChild(div);
}
