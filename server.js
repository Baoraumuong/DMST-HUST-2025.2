import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // phục vụ file HTML tĩnh

// CORS – cho phép mọi nguồn (nếu cần gọi từ domain khác)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash"; 

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Thiếu nội dung tin nhắn" });
  }

  if (!API_KEY) {
    console.error("❌ Thiếu GEMINI_API_KEY trong biến môi trường");
    return res.status(500).json({ error: "Server chưa cấu hình API key" });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: "Bạn là gia sư toán học. Giải thích rõ ràng, ngắn gọn bằng tiếng Việt." }]
          },
          contents: [{ role: "user", parts: [{ text: message }] }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return res.status(response.status).json({ error: data.error?.message || "Lỗi từ Gemini" });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Xin lỗi, tôi chưa hiểu câu hỏi.";

    res.json({ reply });
  } catch (error) {
    console.error("Internal error:", error);
    res.status(500).json({ error: "Lỗi kết nối đến Gemini" });
  }
});

// Fallback: nếu không có file index.html trong thư mục public
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server chạy tại http://localhost:${PORT}`);
  console.log(`📁 Mở trình duyệt: http://localhost:${PORT}`);
});