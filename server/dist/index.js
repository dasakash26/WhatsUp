"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const conversation_routes_1 = __importDefault(require("./routes/conversation.routes"));
const message_routes_1 = __importDefault(require("./routes/message.routes"));
const secrets_1 = require("./utils/secrets");
const express_2 = require("@clerk/express");
const websocket_1 = __importDefault(require("./lib/websocket"));
const user_controller_1 = require("./controllers/user.controller");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
(0, websocket_1.default)(server);
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:5173",
        "https://whatsup-chat.onrender.com",
        "http://localhost:4173",
        "ws://whatsup-chat.onrender.com",
        "wss://whatsup-chat.onrender.com",
    ],
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/api/conversation", (0, express_2.requireAuth)(), conversation_routes_1.default);
app.use("/api/message", (0, express_2.requireAuth)(), message_routes_1.default);
app.get("/api/user/:userId", (0, express_2.requireAuth)(), user_controller_1.getUserFromId);
app.get("/", (req, res) => {
    res.send("Hello World!");
});
server.listen(secrets_1.PORT, () => {
    console.log(`> Server running on port ${secrets_1.PORT}`);
});
