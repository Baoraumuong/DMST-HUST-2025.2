import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = "gemini-2.5-flash";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

function getErrorMessage(data, fallback) {
  return data?.error?.message || data?.error || fallback;
}

app.post("/api/chat", async (req, res) => {
  const { message } = req.body || {};

  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: "Thiếu nội dung tin nhắn" });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY");
    return res.status(500).json({ error: "Server chưa cấu hình API key" });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: "Bạn là gia sư toán học. Giải thích rõ ràng, ngắn gọn bằng tiếng Việt."
              }
            ]
          },
          contents: [
            {
              role: "user",
              parts: [{ text: String(message).trim() }]
            }
          ]
        })
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return res.status(response.status).json({
        error: getErrorMessage(data, "Lỗi từ Gemini")
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Xin lỗi, tôi chưa hiểu câu hỏi.";

    return res.json({ reply });
  } catch (error) {
    console.error("Internal error:", error);
    return res.status(500).json({ error: "Lỗi kết nối đến Gemini" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
