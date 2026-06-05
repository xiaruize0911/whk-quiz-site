#!/usr/bin/env node

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
loadDotEnv(path.join(ROOT, ".env"));

const PORT = Number(process.env.PORT || 8767);
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-pro";
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    if (url.pathname === "/api/explain") {
      await handleExplain(request, response);
      return;
    }
    serveStatic(url.pathname, response);
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Server error" });
  }
});

server.listen(PORT, () => {
  console.log(`Quiz site running at http://127.0.0.1:${PORT}/`);
  console.log("DeepSeek explain endpoint:", DEEPSEEK_API_KEY ? "enabled" : "missing DEEPSEEK_API_KEY");
});

async function handleExplain(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }
  if (!DEEPSEEK_API_KEY) {
    sendJson(response, 500, { error: "服务端缺少 DEEPSEEK_API_KEY 环境变量。" });
    return;
  }

  const body = await readJsonBody(request);
  const question = sanitizeQuestion(body.question || {});
  if (!question.id || !question.promptText) {
    sendJson(response, 400, { error: "题目信息不完整。" });
    return;
  }

  const upstreamResponse = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        {
          role: "system",
          content: [
            "你是一名严谨的高中期末题库讲解老师。",
            "请用中文给学生讲清楚本题。",
            "必须按以下结构输出：",
            "1. 解题思路",
            "2. 详细解析",
            "3. 选项分析（若是选择题，逐项分析 A/B/C/D；若没有某个选项，说明题目不是标准选择题）",
            "4. 易错点",
            "5. 最终答案",
            "不要编造题目中没有的信息；若题目依赖图片但图片内容不足，请明确说明需结合题图判断。",
          ].join("\n"),
        },
        {
          role: "user",
          content: buildPrompt(question),
        },
      ],
      thinking: { type: "enabled" },
      reasoning_effort: "high",
      stream: false,
      max_tokens: 2400,
    }),
  });

  const payload = await upstreamResponse.json().catch(() => null);
  if (!upstreamResponse.ok) {
    sendJson(response, upstreamResponse.status, {
      error: payload?.error?.message || "DeepSeek 请求失败。",
    });
    return;
  }

  const explanation = payload?.choices?.[0]?.message?.content?.trim();
  if (!explanation) {
    sendJson(response, 502, { error: "DeepSeek 未返回解析内容。" });
    return;
  }

  sendJson(response, 200, {
    explanation,
    model: payload.model || DEEPSEEK_MODEL,
    usage: payload.usage || null,
  });
}

function sanitizeQuestion(question) {
  return {
    id: String(question.id || ""),
    subject: String(question.subject || ""),
    section: String(question.section || ""),
    kind: String(question.kind || ""),
    promptText: truncate(String(question.promptText || ""), 8000),
    materialText: truncate(String(question.materialText || ""), 6000),
    options: Array.isArray(question.options)
      ? question.options.slice(0, 8).map((option) => ({
          label: String(option.label || ""),
          text: truncate(String(option.text || ""), 2000),
        }))
      : [],
    answerText: truncate(String(question.answerText || ""), 2000),
    existingExplanationText: truncate(String(question.existingExplanationText || ""), 4000),
  };
}

function buildPrompt(question) {
  const optionText = question.options.length
    ? question.options.map((option) => `${option.label}. ${option.text || "见题图/原题"}`).join("\n")
    : "无标准选项。";

  return [
    `题目 ID：${question.id}`,
    `学科：${question.subject}`,
    `题型：${question.kind === "choice" ? "选择题" : "主观题"}`,
    `栏目：${question.section || "未标注"}`,
    "",
    question.materialText ? `材料：\n${question.materialText}\n` : "",
    `题面：\n${question.promptText}`,
    "",
    `选项：\n${optionText}`,
    "",
    `标准答案：${question.answerText || "未提供"}`,
    question.existingExplanationText ? `\n原题已有解析/答案补充：\n${question.existingExplanationText}` : "",
  ].filter(Boolean).join("\n");
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let data = "";
    request.on("data", (chunk) => {
      data += chunk;
      if (data.length > 256 * 1024) {
        reject(new Error("Request body too large"));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    request.on("error", reject);
  });
}

function serveStatic(pathname, response) {
  const safePath = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  const filePath = path.normalize(path.join(ROOT, safePath));
  if (!filePath.startsWith(ROOT)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500);
      response.end(error.code === "ENOENT" ? "Not found" : "Server error");
      return;
    }
    response.writeHead(200, { "Content-Type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream" });
    response.end(content);
  });
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function truncate(value, maxLength) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) return;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  });
}
