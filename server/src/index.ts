import "dotenv/config";
import express from "express";
import cors from "cors";
import guessRouter from "./routes/guess";
import celebrateRouter from "./routes/celebrate";
import wordRouter from "./routes/word";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" })); // base64 images can be large

app.use("/api/guess", guessRouter);
app.use("/api/celebrate", celebrateRouter);
app.use("/api/word", wordRouter);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`🎨 AI Charades server running on http://localhost:${PORT}`);
});
