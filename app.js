
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const authRouter = require('./routers/authRouter');
const appRouter = require('./routers/appRouter');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: [
            "http://localhost:5173",
            "https://ai-resume-analyzer-frontend-tt59.onrender.com"
        ],
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Middleware
// app.use(cors());
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://ai-resume-analyzer-frontend-tt59.onrender.com"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.io connection
io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Routes
app.use(authRouter);
app.use(appRouter);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});