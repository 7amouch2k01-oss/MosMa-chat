# 🚀 Chat App — Full Premium Upgrade Plan

## Current State
- Basic chat with rooms, auth (register/login), Socket.IO real-time messaging
- 4 themes (ocean, sunset, neon, aurora) with CSS variable switching
- Messages stored in MongoDB, 50-message history per room

---

## 🎨 Theme Overhaul — "Animated Premium Colors"

Replace static color swaps with **living, animated gradient themes** using:
- CSS `@property` for animatable custom properties
- Multi-stop gradient backgrounds with `background-size: 400% 400%` + `animation`
- Glassmorphism panels (`backdrop-filter: blur`)
- Neon glow effects on interactive elements

### New Theme Palette
| Theme | Vibe | Colors |
|-------|------|--------|
| **Cosmic** (default) | Deep space purple-blue | `#0d0221 → #7b2ff7 → #00d4ff` |
| **Ember** | Volcanic orange-red | `#1a0500 → #ff4500 → #ff9500` |
| **Cyber** | Matrix green-teal | `#000a00 → #00ff88 → #00cfff` |
| **Rose Gold** | Luxury pink-gold | `#1a0a0f → #e91e8c → #ffd700` |

**All themes** will have:
- Animated gradient mesh background (continuously shifting)
- Glassmorphism sidebar + chat header (`backdrop-filter: blur(20px)`)
- Glow pulses on the active send button
- Smooth 600ms cross-fade when switching themes

---

## ✨ New Features (12 Total)

### 1. 🔔 Toast Notifications System
**What:** Animated pop-up toasts for events (user joined, friend request, new DM, errors)  
**Where:** Top-right corner, stacked, auto-dismiss after 3–4s with a progress bar  
**Stack:** Pure CSS + React state (no extra library)

---

### 2. ⌨️ Typing Indicators
**What:** "Alice is typing..." animated 3-dot bubble shown below the messages  
**Backend:** Socket.IO events: `typing_start` / `typing_stop`  
**Frontend:** Debounced emit on input `onChange`  
**Style:** Animated pulse dots with accent color glow

---

### 3. 😀 Emoji Picker
**What:** Emoji button beside message input opens a categorized emoji panel  
**Stack:** `emoji-picker-react` package  
**Integration:** Inserts emoji at cursor position

---

### 4. 📎 Message Reactions
**What:** Hover a message → see reaction bar (👍 ❤️ 😂 🔥 😮) → click to react/un-react  
**Backend:** `reactions` field on Message model (Map of emoji → array of userIds)  
**Socket event:** `message_reaction` broadcast to room  
**Style:** Floating pill reactions below each message bubble with count

---

### 5. 👤 User Profile Panel
**What:** Click your avatar in the header → slide-in panel from the right  
**Shows:** Username, email, member since, total messages count, friends count  
**Style:** Glass card with animated gradient border, edit avatar color

---

### 6. 🔍 Message Search Bar
**What:** Search icon in chat header expands a search input  
**Scope:** Client-side real-time filter on loaded messages  
**Extras:** Jump-to-message highlight, result count badge  
**Style:** Highlighted matching text in yellow/accent, smooth expand animation

---

### 7. 🏷️ Message Status Indicators
**What:** Sent ✓ / Delivered ✓✓ on own messages  
**Backend:** Socket.IO `send_message` acknowledgement callback  
**Style:** Checkmarks in timestamp row that animate on state change

---

### 8. 👥 Friend System — Invite, Accept & Decline
**What:** Full friend management system  
**Flow:**
- Search for users by username → Send friend request
- Recipient gets a real-time toast notification with **Accept / Decline** buttons
- Accepted → both appear in each other's Friends list in the sidebar
- Declined → silent dismiss

**Backend:**
- New `Friendship` model: `{ requester, recipient, status: 'pending' | 'accepted' | 'declined' }`
- REST routes: `POST /api/friends/request`, `PUT /api/friends/accept`, `PUT /api/friends/decline`, `DELETE /api/friends/remove`, `GET /api/friends`
- Socket event: `friend_request` pushed to recipient in real-time

**Frontend:**
- Friends section in sidebar with online indicators
- Pending requests counter badge on Friends tab
- Animated friend-request toast card

---

### 9. 💬 Private Direct Messaging (DMs)
**What:** Click a friend from the Friends list → open a private 1-on-1 chat  
**Backend:**
- DM rooms are auto-created as a `Room` with `type: 'dm'`, `participants: [userId1, userId2]`
- All existing message infrastructure reused
- New route: `POST /api/rooms/dm` — gets or creates DM room between two users

**Frontend:**
- Friends list in sidebar acts as DM entry points
- DM conversations shown separately from group rooms
- Unread DM badge counter on sidebar friend avatar

---

### 10. 🟢 Online Presence & User Status
**What:** Show who is online/offline across the app  
**Backend:** Track connected socket IDs per userId in a Map; broadcast `user_online` / `user_offline` events  
**Frontend:**
- Green dot on friend avatars when online
- "Online" / "Last seen X ago" in profile panel and DM header
- Online count shown in room header

---

### 11. 🔎 User Discovery Search
**What:** A dedicated search tab/panel — type a username to find any registered user  
**Backend:** `GET /api/users/search?q=username` — case-insensitive prefix search  
**Frontend:**
- Search input at top of a new "Discover" section in sidebar
- Results show avatar, username, online status, and an **Add Friend** / **Message** button
- Smooth results list animation

---

### 12. 👁️ Room Members Panel with Social Actions
**What:** Click "Users in Room" → slide-open panel listing all current room members  
**Shows per member:** Avatar, username, online dot, role (creator vs member)  
**Actions:**
- **Add Friend** (if not already friends)
- **Send DM**
- **View Profile** (read-only for other users)

---

## 📁 Files to Change / Create

### Backend
| File | Action | Change |
|------|--------|--------|
| `models/Message.js` | Edit | Add `reactions` (Map), `readBy` array |
| `models/User.js` | Edit | Add `messageCount`, `avatarColor`, `status` |
| `models/Room.js` | Edit | Add `type` field (`'group'` or `'dm'`), `participants` |
| `models/Friendship.js` | **NEW** | Friendship model with requester/recipient/status |
| `server.js` | Edit | Add `typing_start/stop`, `message_reaction`, `friend_request`, `user_online/offline`, DM socket events |
| `routes/friendRoutes.js` | **NEW** | REST routes for friend CRUD |
| `routes/userRoutes.js` | **NEW** | User search route |
| `controllers/friendController.js` | **NEW** | Friend request logic |
| `controllers/userController.js` | **NEW** | User search logic |

### Frontend
| File | Action | Change |
|------|--------|--------|
| `src/index.css` | Edit | New premium token system, animated gradient base |
| `src/components/Chat.css` | Edit | Full glassmorphism redesign, 4 new animated themes |
| `src/components/Chat.jsx` | Edit | All features wired in, layout restructured |
| `src/components/Toast.jsx` | **NEW** | Stacked toast notification system |
| `src/components/EmojiPicker.jsx` | **NEW** | Emoji panel wrapper |
| `src/components/ProfilePanel.jsx` | **NEW** | User profile slide-in |
| `src/components/FriendsList.jsx` | **NEW** | Friends sidebar section with online dots, DM button |
| `src/components/FriendRequest.jsx` | **NEW** | Incoming request toast card (Accept/Decline) |
| `src/components/UserSearch.jsx` | **NEW** | Discover users search panel |
| `src/components/MembersPanel.jsx` | **NEW** | Room members slide-out panel |
| `src/components/DirectMessage.jsx` | **NEW** | DM conversation view |
| `src/components/Login.jsx` | Edit | Premium theme + animation polish |
| `src/components/Register.jsx` | Edit | Premium theme + animation polish |

---

## 🗂️ Implementation Order

| Step | Feature | Scope |
|------|---------|-------|
| 1 | **Theme & CSS Overhaul** | `index.css` + `Chat.css` |
| 2 | **Toast System** | Frontend only |
| 3 | **Typing Indicators** | Backend + Frontend |
| 4 | **Online Presence** | Backend + Frontend |
| 5 | **User Discovery Search** | Backend + Frontend |
| 6 | **Friend System** | Backend + Frontend + Toasts |
| 7 | **Private DMs** | Backend + Frontend |
| 8 | **Room Members Panel** | Frontend + social actions |
| 9 | **Emoji Picker** | Frontend only |
| 10 | **Message Reactions** | Backend + Frontend |
| 11 | **Message Search Bar** | Frontend only |
| 12 | **Message Status** | Backend + Frontend |
| 13 | **User Profile Panel** | Frontend mostly |
| 14 | **Login/Register Polish** | Frontend |

> [!NOTE]
> All features are backwards-compatible. Existing messages, rooms, and users in MongoDB are unaffected.

> [!IMPORTANT]
> Say **"start"** when you're happy with this plan and I'll implement everything in order, file by file.
