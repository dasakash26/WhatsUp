import express from "express";
import cors from "cors";
import conversationRoutes from "./routes/conversation.routes";
import messageRoutes from "./routes/message.routes";
import { PORT } from "./utils/secrets";
import { requireAuth } from "@clerk/express";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/conversation", requireAuth(), conversationRoutes);
app.use("/api/message", requireAuth(), messageRoutes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(PORT, () => {
  console.log(`> Server running on port ${PORT}`);
});
