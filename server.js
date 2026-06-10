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
    if (url.pathname === "/api/grade-subjective") {
      await handleGradeSubjective(request, response);
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
  setCorsHeaders(response);
  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }
  const body = await readJsonBody(request);
  const apiKey = String(body.apiKey || "").trim() || DEEPSEEK_API_KEY;
  if (!apiKey) {
    sendJson(response, 400, { error: "请先在网页左侧 AI 设置中填写 DeepSeek API Key。" });
    return;
  }
  const question = sanitizeQuestion(body.question || {});
  if (!question.id || !question.promptText) {
    sendJson(response, 400, { error: "题目信息不完整。" });
    return;
  }

  const upstreamResponse = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        {
          role: "system",
          content: [
            "你是一名高中老师，正在给高二学生讲期末题。",
            "解释要直白、简单，默认学生只掌握高中课内知识。",
            "不要使用大学、竞赛或超纲方法；如果原题只能用图判断，要直接说明需要看图。",
            "少用术语，必须用术语时先用一句话解释它是什么意思。",
            "每一步都说清楚为什么这么做，不要跳步。",
            "必须按以下结构输出：",
            "1. 先看什么",
            "2. 一步一步做",
            "3. 选项为什么对/错（选择题逐项分析；非选择题写“不适用”）",
            "4. 容易错在哪里",
            "5. 最后答案",
            "不要编造题目中没有的信息。",
          ].join("\n"),
        },
        {
          role: "user",
          content: buildPrompt(question),
        },
      ],
      thinking: { type: "enabled" },
      reasoning_effort: "high",
      stream: true,
    }),
  });

  if (!upstreamResponse.ok) {
    const payload = await upstreamResponse.json().catch(() => null);
    sendJson(response, upstreamResponse.status, {
      error: payload?.error?.message || "DeepSeek 请求失败。",
    });
    return;
  }

  response.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  });
  if (!upstreamResponse.body) {
    response.write("data: {\"error\":\"DeepSeek 未返回流式响应。\"}\n\n");
    response.end();
    return;
  }
  for await (const chunk of upstreamResponse.body) {
    response.write(chunk);
  }
  response.end();
}

async function handleGradeSubjective(request, response) {
  setCorsHeaders(response);
  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }
  const body = await readJsonBody(request);
  const apiKey = String(body.apiKey || "").trim() || DEEPSEEK_API_KEY;
  if (!apiKey) {
    sendJson(response, 400, { error: "请先在网页左侧 AI 设置中填写 DeepSeek API Key。" });
    return;
  }
  const question = sanitizeQuestion(body.question || {});
  const studentAnswer = truncate(String(body.studentAnswer || "").trim(), 8000);
  if (!question.id || !question.promptText) {
    sendJson(response, 400, { error: "题目信息不完整。" });
    return;
  }
  if (question.kind === "choice") {
    sendJson(response, 400, { error: "自动批改只用于主观题。" });
    return;
  }
  if (!studentAnswer) {
    sendJson(response, 400, { error: "请先在作答区输入答案。" });
    return;
  }

  const upstreamResponse = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: buildGradingMessages(question, studentAnswer),
      thinking: { type: "enabled" },
      reasoning_effort: "high",
      stream: false,
      max_tokens: 2200,
    }),
  });

  const payload = await upstreamResponse.json().catch(() => null);
  if (!upstreamResponse.ok) {
    sendJson(response, upstreamResponse.status, {
      error: payload?.error?.message || "DeepSeek 请求失败。",
    });
    return;
  }

  const grading = payload?.choices?.[0]?.message?.content?.trim();
  if (!grading) {
    sendJson(response, 502, { error: "DeepSeek 未返回批改内容。" });
    return;
  }

  sendJson(response, 200, {
    grading,
    score: extractScore(grading),
    isCorrect: inferGradeCorrectness(grading),
    model: payload.model || DEEPSEEK_MODEL,
    usage: payload.usage || null,
  });
}

function sanitizeQuestion(question) {
  return {
    id: String(question.id || ""),
    subject: String(question.subject || ""),
    source: String(question.source || ""),
    label: String(question.label || ""),
    section: String(question.section || ""),
    kind: String(question.kind || ""),
    promptText: String(question.promptText || ""),
    materialText: String(question.materialText || ""),
    promptHtml: String(question.promptHtml || ""),
    materialHtml: String(question.materialHtml || ""),
    optionsHtml: String(question.optionsHtml || ""),
    imageRefs: Array.isArray(question.imageRefs)
      ? question.imageRefs.map((item) => ({
          src: String(item.src || ""),
          alt: String(item.alt || ""),
        }))
      : [],
    options: Array.isArray(question.options)
      ? question.options.map((option) => ({
          label: String(option.label || ""),
          text: String(option.text || ""),
        }))
      : [],
    answerText: String(question.answerText || ""),
    answerHtml: String(question.answerHtml || ""),
    existingExplanationText: String(question.existingExplanationText || ""),
    explanationHtml: String(question.explanationHtml || ""),
  };
}

function buildPrompt(question) {
  const optionText = question.options.length
    ? question.options.map((option) => `${option.label}. ${option.text || "见题图/原题"}`).join("\n")
    : "无标准选项。";

  return [
    `题目 ID：${question.id}`,
    `学科：${question.subject}`,
    question.source ? `来源：${question.source}` : "",
    question.label ? `题号：${question.label}` : "",
    `题型：${question.kind === "choice" ? "选择题" : "主观题"}`,
    `栏目：${question.section || "未标注"}`,
    "",
    question.materialText ? `材料：\n${question.materialText}\n` : "",
    `题面：\n${question.promptText}`,
    question.imageRefs.length
      ? `\n图片/图表引用：\n${question.imageRefs.map((item, index) => `${index + 1}. ${item.alt ? `${item.alt}：` : ""}${item.src}`).join("\n")}`
      : "",
    question.promptHtml ? `\n题目原始 HTML（用于保留公式、表格和图片位置）：\n${question.promptHtml}` : "",
    question.materialHtml ? `\n材料原始 HTML：\n${question.materialHtml}` : "",
    "",
    `选项：\n${optionText}`,
    question.optionsHtml ? `\n选项原始 HTML：\n${question.optionsHtml}` : "",
    "",
    `标准答案：${question.answerText || "未提供"}`,
    question.answerHtml ? `\n标准答案 HTML：\n${question.answerHtml}` : "",
    question.existingExplanationText ? `\n原题已有解析/答案补充：\n${question.existingExplanationText}` : "",
    question.explanationHtml ? `\n解析 HTML：\n${question.explanationHtml}` : "",
  ].filter(Boolean).join("\n");
}

function buildGradingMessages(question, studentAnswer) {
  return [
    {
      role: "system",
      content: [
        "你是一名高中老师，正在批改高二期末题库中的主观题。",
        "批改要直白、简单，基于高中课内知识。",
        "必须严格对照标准答案，不要因为表达不同就轻易判错，但不能放过关键概念、数值、单位、方向、步骤错误。",
        "如果题目包含多个小问，要逐小问批改。",
        "如果学生答案为空、跑题或只写无关内容，直接给低分。",
        "输出必须使用 Markdown，并按以下结构：",
        "## 总评",
        "- 得分：X/100",
        "- 判定：正确/基本正确/部分正确/错误",
        "## 逐点批改",
        "逐条说明学生答案哪里对、哪里错、缺了什么。",
        "## 按标准答案应这样写",
        "给出适合背诵的标准作答。",
        "## 下次注意",
        "用一两句话指出最该改的点。",
        "不要编造题目中没有的信息。",
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        buildPrompt(question),
        "",
        `学生答案：\n${studentAnswer}`,
      ].join("\n"),
    },
  ];
}

function extractScore(text) {
  const scoreMatch = String(text || "").match(/得分[：:\s]*([0-9]{1,3})(?:\s*\/\s*100)?/);
  if (!scoreMatch) return null;
  const score = Number(scoreMatch[1]);
  return Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : null;
}

function inferGradeCorrectness(text) {
  const score = extractScore(text);
  if (score !== null) return score >= 80;
  if (/判定[：:\s]*(正确|基本正确)/.test(String(text || ""))) return true;
  if (/判定[：:\s]*(错误|部分正确)/.test(String(text || ""))) return false;
  return null;
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let data = "";
    request.on("data", (chunk) => {
      data += chunk;
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
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  });
  response.end(JSON.stringify(body));
}

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
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
