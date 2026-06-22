const MODEL = "gemini-2.5-flash";

function getErrorMessage(data, fallback) {
  return data?.error?.message || data?.error || fallback;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body || {};

  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: "Thiếu nội dung tin nhắn" });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Server chưa cấu hình GEMINI_API_KEY"
    });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
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
      return res.status(response.status).json({
        error: getErrorMessage(data, "Lỗi từ Gemini")
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Xin lỗi, tôi chưa hiểu câu hỏi.";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Lỗi kết nối đến Gemini"
    });
  }
}
