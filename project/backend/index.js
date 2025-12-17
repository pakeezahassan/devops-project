import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Simple health check
app.get("/", (req, res) => {
  res.json({ message: "Backend API is running" });
});

// Example API route (you can expand this later)
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from backend API" });
});

app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});


