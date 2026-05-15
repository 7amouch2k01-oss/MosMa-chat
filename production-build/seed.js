const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Post = require('./models/Post');

// ─── Fake User Data ────────────────────────────────────────────────────────────
const FAKE_USERS = [
    {
        username: 'alex_nova',
        email: 'alex.nova@nexchat.demo',
        password: 'demo1234',
        avatarColor: '#6366f1',
        status: '🚀 Building the future, one line at a time.',
        tag: '1337',
    },
    {
        username: 'sofia_v',
        email: 'sofia.v@nexchat.demo',
        password: 'demo1234',
        avatarColor: '#ec4899',
        status: '🎨 Designer & dreamer. Coffee ☕ fueled creativity.',
        tag: '2048',
    },
    {
        username: 'marcus_k',
        email: 'marcus.k@nexchat.demo',
        password: 'demo1234',
        avatarColor: '#10b981',
        status: '🌍 Traveling the world, coding along the way.',
        tag: '3072',
    },
    {
        username: 'priya_dev',
        email: 'priya.dev@nexchat.demo',
        password: 'demo1234',
        avatarColor: '#f59e0b',
        status: '🤖 AI Engineer | Python lover | Tea > Coffee',
        tag: '4096',
    },
    {
        username: 'luna_art',
        email: 'luna.art@nexchat.demo',
        password: 'demo1234',
        avatarColor: '#8b5cf6',
        status: '🌙 Digital artist. Night owl. Stars and pixels.',
        tag: '5120',
    },
];

// ─── High-quality Unsplash image URLs (nature, tech, lifestyle, art) ──────────
const POST_IMAGES = [
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80',   // Code on screen
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80',   // Mountains
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80',   // Starry mountain
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',   // Laptop coding
    'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=800&q=80',   // Book & coffee
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',   // Sunrise hike
    'https://images.unsplash.com/photo-1555066931-4365d14431b9?w=800&q=80',      // Code terminal
    'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&q=80',      // Code dark
    'https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?w=800&q=80',   // Countryside
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',   // Concert lights
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',   // City workout
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',      // Artistic swirl
];

// ─── Post content templates ───────────────────────────────────────────────────
const POSTS = [
    // alex_nova
    { userIdx: 0, content: "Just shipped v2.0 of my side project 🚀 Three months of late nights finally paying off. The feature I'm most proud of? Real-time collaboration. Check it out!", imageUrl: POST_IMAGES[0] },
    { userIdx: 0, content: "Hot take: the best code is the code you delete. Spent today refactoring 800 lines down to 200 and it's significantly faster. Simplicity wins every time. 🧹" },
    { userIdx: 0, content: "Weekend hiking trip was exactly what I needed to reset my brain. Nothing like mountains to give you perspective on a stubborn bug you've been staring at all week 😄", imageUrl: POST_IMAGES[1] },
    { userIdx: 0, content: "PSA: If you're still not using TypeScript in 2026, you're writing bugs for fun. The type safety alone saves me hours every sprint. #Dev #TypeScript" },

    // sofia_v
    { userIdx: 1, content: "New UI design exploration 🎨 Mixing glassmorphism with bold typography. What do you think — too much or just enough?", imageUrl: POST_IMAGES[11] },
    { userIdx: 1, content: "Design principle I live by: *every pixel has a purpose*. Cluttered UI is a sign of unresolved thinking, not creativity. Less is always more. ✨" },
    { userIdx: 1, content: "Finally tried that new coffee place downtown. Aesthetic was 10/10, latte art was 10/10, WiFi... was 2/10. Why do beautiful cafes never have good internet 😭", imageUrl: POST_IMAGES[4] },
    { userIdx: 1, content: "Working on a design system from scratch this month. 47 components and counting 🔥 Consistency is the secret weapon of great products." },

    // marcus_k
    { userIdx: 2, content: "Coding from a café in Lisbon today 🇵🇹 The work from anywhere lifestyle never gets old. All I need is good internet and great coffee.", imageUrl: POST_IMAGES[3] },
    { userIdx: 2, content: "Caught this sunrise on my morning run. This is why I set the alarm for 5:30am 🌅 Your future self will thank your present self.", imageUrl: POST_IMAGES[5] },
    { userIdx: 2, content: "Travel tip: learn at least 10 words in the local language. The locals appreciate it enormously and your entire experience changes. 🌍" },
    { userIdx: 2, content: "Night owls vs morning birds debate aside — I think *consistent* sleep matters more than the time. Been tracking sleep for 3 months and the data doesn't lie." },

    // priya_dev
    { userIdx: 3, content: "My ML model finally hit 94% accuracy after 2 weeks of tuning hyperparameters 🎉 The breakthrough? Switching from Adam to AdamW optimizer. Sometimes the smallest change makes all the difference.", imageUrl: POST_IMAGES[7] },
    { userIdx: 3, content: "Tea recommendation thread 🍵\n1. Darjeeling First Flush\n2. Gyokuro Green\n3. Silver Needle White\nStop drinking bad tea. Life's too short." },
    { userIdx: 3, content: "Gave a talk at our internal AI summit today about ethical considerations in LLM fine-tuning. The conversation around AI safety is more important than ever. We need more voices in this space." },
    { userIdx: 3, content: "Just discovered you can run LLaMA3 locally on a MacBook M3 with full GPU acceleration. The future of private AI is here and it's genuinely impressive 🤖", imageUrl: POST_IMAGES[6] },

    // luna_art
    { userIdx: 4, content: "New piece finished 🌙 Spent 14 hours on this one. Created entirely in Procreate with a custom brush set I've been building for a year.", imageUrl: POST_IMAGES[2] },
    { userIdx: 4, content: "Art tip: the most important skill isn't how to draw — it's knowing *when to stop*. Overworked pieces lose their soul. Learn to feel when it's done." },
    { userIdx: 4, content: "Live music + art = my soul food 🎵 Went to an ambient electronic show last night and the visuals were absolutely otherworldly.", imageUrl: POST_IMAGES[9] },
    { userIdx: 4, content: "Digital art vs traditional art debate is pointless. Both are just tools. The only thing that matters is the vision behind the work. 🎨" },
];

// ─── Comment templates ─────────────────────────────────────────────────────────
const COMMENT_POOL = [
    "This is incredible! 🔥",
    "Absolutely love this.",
    "You always inspire me 💯",
    "This is exactly what I needed to see today.",
    "How long did this take you?",
    "The detail here is insane 👀",
    "Been following your work for a while — this is your best yet.",
    "Real talk, this hits different.",
    "Saving this for later!",
    "Can you share more about your process?",
    "This made my day honestly 😊",
    "Goals 🙌",
    "Why is this not getting more attention?!",
    "So well done. The attention to detail 👏",
    "This is the kind of content NexChat needs more of!",
    "🤯🤯🤯",
    "Okay but this is genuinely great.",
    "Finally someone said it.",
    "Shared this with my whole team. Thank you!",
    "Next level stuff right here 🚀",
];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomSubset = (arr, min, max) => {
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

async function seed() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chat-app');
    console.log('✅ MongoDB Connected');

    // Remove old fake accounts
    const fakeEmails = FAKE_USERS.map(u => u.email);
    await User.deleteMany({ email: { $in: fakeEmails } });
    console.log('🗑️  Cleared old fake users');

    // Create users (bcrypt handled by pre-save hook)
    const createdUsers = [];
    for (const userData of FAKE_USERS) {
        const user = new User(userData);
        await user.save();
        createdUsers.push(user);
        console.log(`👤 Created: ${user.username} #${user.tag}`);
    }

    // Remove old fake posts
    const fakeUserIds = createdUsers.map(u => u._id);
    await Post.deleteMany({ user: { $in: fakeUserIds } });
    console.log('🗑️  Cleared old fake posts');

    // Create posts
    const createdPosts = [];
    for (const postData of POSTS) {
        const author = createdUsers[postData.userIdx];
        const post = await Post.create({
            user: author._id,
            content: postData.content,
            imageUrl: postData.imageUrl || null,
            visibility: 'public',
        });
        createdPosts.push(post);
        console.log(`📝 Post by ${author.username}: "${postData.content.substring(0, 40)}..."`);
    }

    // Add likes — each user likes a random subset of posts (not their own)
    for (const post of createdPosts) {
        const others = createdUsers.filter(u => !u._id.equals(post.user));
        const likers = getRandomSubset(others, 1, others.length);
        post.likes = likers.map(u => u._id);

        // Add 1-3 comments from random other users
        const commenters = getRandomSubset(others, 1, Math.min(3, others.length));
        post.comments = commenters.map(u => ({
            user: u._id,
            username: u.username,
            text: getRandom(COMMENT_POOL),
        }));

        await post.save();
    }

    console.log('\n🎉 Seed complete!');
    console.log(`   👥 ${createdUsers.length} fake users created`);
    console.log(`   📝 ${createdPosts.length} posts created with likes & comments`);
    console.log('\n   Demo accounts (password: demo1234):');
    createdUsers.forEach(u => console.log(`   • ${u.username} — ${u.email}`));

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
