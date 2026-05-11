const questionBank = window.__QUESTION_BANK__ || { subjects: {}, allQuestions: [] };

const STORAGE_KEY = "final-drill-lab-v1";

const defaultProgress = {
  mode: "subject-random",
  currentSubject: null,
  currentQuestionId: null,
  recentQueue: [],
  questionHistory: [],
  historyCursor: -1,
  wrongBook: [],
  stats: {},
  sequenceCursor: {},
  shuffledCursor: {},
  shuffledOrder: {},
  answerDrafts: {},
  activeView: "practice",
};

const state = loadProgress();

const subjectTabs = document.getElementById("subject-tabs");
const statsGrid = document.getElementById("stats-grid");
const wrongbookList = document.getElementById("wrongbook-list");
const questionMeta = document.getElementById("question-meta");
const questionTitle = document.getElementById("question-title");
const questionSection = document.getElementById("question-section");
const materialContent = document.getElementById("material-content");
const promptContent = document.getElementById("prompt-content");
const choiceWrapper = document.getElementById("choice-wrapper");
const optionsRaw = document.getElementById("options-raw");
const answerButtons = document.getElementById("answer-buttons");
const inputWrapper = document.getElementById("input-wrapper");
const subjectiveInput = document.getElementById("subjective-input");
const subjectiveActions = document.getElementById("subjective-actions");
const feedbackBox = document.getElementById("feedback-box");
const answerContent = document.getElementById("answer-content");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const revealBtn = document.getElementById("reveal-btn");
const markCorrectBtn = document.getElementById("mark-correct-btn");
const markWrongBtn = document.getElementById("mark-wrong-btn");
const clearWrongbookBtn = document.getElementById("clear-wrongbook");
const resetSubjectStatsBtn = document.getElementById("reset-subject-stats");
const modeButtons = Array.from(document.querySelectorAll(".mode-btn"));
const practiceView = document.getElementById("practice-view");
const ledgerView = document.getElementById("ledger-view");
const practiceViewBtn = document.getElementById("practice-view-btn");
const ledgerViewBtn = document.getElementById("ledger-view-btn");
const ledgerSummary = document.getElementById("ledger-summary");
const questionLedger = document.getElementById("question-ledger");
const imageZoom = document.getElementById("image-zoom");
const imageZoomImg = document.getElementById("image-zoom-img");
const imageZoomClose = document.getElementById("image-zoom-close");

let currentQuestion = null;
let answeredThisRound = false;
let autoNextTimer = null;

init();

function init() {
  const subjects = Object.keys(questionBank.subjects);
  if (!subjects.length) {
    questionTitle.textContent = "题库为空";
    questionMeta.textContent = "未找到可用数据";
    return;
  }

  if (!state.currentSubject || !questionBank.subjects[state.currentSubject]) {
    state.currentSubject = subjects[0];
  }

  renderSubjects();
  renderModeButtons();
  bindEvents();
  renderActiveView();
  openNextQuestion();
  renderStats();
  renderWrongbook();
  renderNavButtons();
}

function bindEvents() {
  prevBtn.addEventListener("click", () => goToPreviousQuestion());
  nextBtn.addEventListener("click", () => goToNextQuestion());
  revealBtn.addEventListener("click", () => revealAnswer(false));
  markCorrectBtn.addEventListener("click", () => selfMark(true));
  markWrongBtn.addEventListener("click", () => selfMark(false));
  practiceViewBtn.addEventListener("click", () => switchView("practice"));
  ledgerViewBtn.addEventListener("click", () => switchView("ledger"));
  imageZoom.addEventListener("click", closeImageZoom);
  imageZoomClose.addEventListener("click", closeImageZoom);
  imageZoomImg.addEventListener("click", (event) => event.stopPropagation());
  document.addEventListener("keydown", handleGlobalKeydown);
  [promptContent, optionsRaw, answerContent, materialContent].forEach((container) => {
    container.addEventListener("click", handleRichContentClick);
  });
  subjectiveInput.addEventListener("input", () => {
    if (!currentQuestion) return;
    state.answerDrafts[currentQuestion.id] = subjectiveInput.value;
    persist();
  });
  clearWrongbookBtn.addEventListener("click", () => {
    state.wrongBook = [];
    persist();
    renderWrongbook();
    renderStats();
    renderQuestionLedger();
  });
  resetSubjectStatsBtn.addEventListener("click", () => {
    resetCurrentSubjectProgress();
  });
  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      persist();
      renderModeButtons();
      openNextQuestion();
      renderStats();
      renderQuestionLedger();
    });
  });
}

function switchView(view) {
  state.activeView = view;
  persist();
  renderActiveView();
}

function renderActiveView() {
  const isLedger = state.activeView === "ledger";
  practiceView.classList.toggle("hidden", isLedger);
  ledgerView.classList.toggle("hidden", !isLedger);
  practiceViewBtn.classList.toggle("active", !isLedger);
  ledgerViewBtn.classList.toggle("active", isLedger);
  prevBtn.classList.toggle("hidden", isLedger);
  nextBtn.classList.toggle("hidden", isLedger);
  revealBtn.classList.toggle("hidden", isLedger);
  if (isLedger) {
    renderQuestionLedger();
  }
}

function renderSubjects() {
  subjectTabs.innerHTML = "";
  Object.keys(questionBank.subjects).forEach((subject) => {
    const button = document.createElement("button");
    button.className = `subject-tab ${subject === state.currentSubject ? "active" : ""}`;
    button.textContent = `${subject} · ${questionBank.subjects[subject].questions.length}`;
    button.addEventListener("click", () => {
      state.currentSubject = subject;
      persist();
      renderSubjects();
      openNextQuestion();
      renderStats();
      renderQuestionLedger();
      renderWrongbook();
    });
    subjectTabs.appendChild(button);
  });
}

function renderModeButtons() {
  modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.mode);
  });
}

function getCurrentSubjectQuestions({ filtered = false } = {}) {
  const questions = questionBank.subjects[state.currentSubject]?.questions || [];
  return filtered ? filterQuestionsByMode(questions) : questions;
}

function getProgressFor(id) {
  if (!state.stats[id]) {
    state.stats[id] = { seen: 0, correct: 0, wrong: 0, streak: 0, lastSeenAt: 0 };
  }
  return state.stats[id];
}

function resetCurrentSubjectProgress() {
  const subject = state.currentSubject;
  const subjectQuestionIds = new Set(getCurrentSubjectQuestions().map((question) => question.id));
  if (!subjectQuestionIds.size) return;

  state.wrongBook = state.wrongBook.filter((id) => !subjectQuestionIds.has(id));
  state.recentQueue = state.recentQueue.filter((id) => !subjectQuestionIds.has(id));
  state.questionHistory = state.questionHistory.filter((id) => !subjectQuestionIds.has(id));
  state.historyCursor = state.questionHistory.length - 1;

  Object.keys(state.stats).forEach((id) => {
    if (subjectQuestionIds.has(id)) {
      delete state.stats[id];
    }
  });

  Object.keys(state.answerDrafts).forEach((id) => {
    if (subjectQuestionIds.has(id)) {
      delete state.answerDrafts[id];
    }
  });

  delete state.sequenceCursor[subject];
  delete state.shuffledCursor[subject];
  delete state.shuffledOrder[subject];
  state.currentQuestionId = null;
  persist();
  openNextQuestion();
  renderStats();
  renderWrongbook();
  renderNavButtons();
}

function openQuestion(question, { recordSeen = true, pushHistory = true } = {}) {
  clearAutoNext();
  currentQuestion = question;
  answeredThisRound = false;
  if (!currentQuestion) {
    questionMeta.textContent = "当前模式没有可用题目";
    questionTitle.textContent = "换个模式或先积累错题";
    promptContent.innerHTML = "";
    choiceWrapper.classList.add("hidden");
    inputWrapper.classList.add("hidden");
    subjectiveActions.classList.add("hidden");
    feedbackBox.classList.add("hidden");
    answerContent.classList.add("hidden");
    materialContent.classList.add("hidden");
    materialContent.innerHTML = "";
    renderNavButtons();
    return;
  }

  if (state.currentSubject !== currentQuestion.subject) {
    state.currentSubject = currentQuestion.subject;
    renderSubjects();
  }

  if (pushHistory) {
    state.questionHistory = state.questionHistory.slice(0, state.historyCursor + 1);
    state.questionHistory.push(currentQuestion.id);
    state.historyCursor = state.questionHistory.length - 1;
  }

  state.currentQuestionId = currentQuestion.id;
  if (recordSeen) {
    const progress = getProgressFor(currentQuestion.id);
    progress.seen += 1;
    progress.lastSeenAt = Date.now();
    state.recentQueue = [currentQuestion.id, ...state.recentQueue.filter((id) => id !== currentQuestion.id)].slice(0, 8);
  }
  persist();

  questionMeta.textContent = `${currentQuestion.subject} · ${currentQuestion.source}`;
  const groupText = currentQuestion.group ? `${currentQuestion.group} · ` : "";
  questionTitle.textContent = `${groupText}${currentQuestion.label} ${currentQuestion.kind === "choice" ? "选择题" : "主观题"}`;
  questionSection.textContent = currentQuestion.section || "未标注题型";
  const choiceContent = currentQuestion.kind === "choice"
    ? splitChoiceContent(currentQuestion)
    : {
        promptHtml: `${currentQuestion.promptHtml || ""}${currentQuestion.optionsHtml || ""}`,
        optionsHtml: "",
      };
  const materialSplit = splitMaterialFromPrompt(choiceContent.promptHtml || "");
  materialContent.innerHTML = materialSplit.materialHtml
    ? `<p class="material-label">材料</p><div class="rich-block">${materialSplit.materialHtml}</div>`
    : "";
  materialContent.classList.toggle("hidden", !materialSplit.materialHtml);
  promptContent.innerHTML = materialSplit.promptHtml || "<p>题面缺失</p>";
  answerContent.innerHTML = buildAnswerPanel(currentQuestion);
  answerContent.classList.add("hidden");
  subjectiveInput.value = state.answerDrafts[currentQuestion.id] || "";
  feedbackBox.classList.add("hidden");
  feedbackBox.textContent = "";
  feedbackBox.className = "feedback-box hidden";

  if (currentQuestion.kind === "choice") {
    renderChoiceQuestion(currentQuestion, choiceContent.optionsHtml);
    choiceWrapper.classList.remove("hidden");
    inputWrapper.classList.add("hidden");
    subjectiveActions.classList.add("hidden");
  } else {
    choiceWrapper.classList.add("hidden");
    inputWrapper.classList.remove("hidden");
    subjectiveActions.classList.remove("hidden");
  }

  renderStats();
  renderQuestionLedger();
  renderWrongbook();
  renderNavButtons();
}

function openNextQuestion(forceQuestion = null) {
  const question = forceQuestion || chooseQuestion();
  openQuestion(question, { recordSeen: true, pushHistory: true });
}

function renderChoiceQuestion(question, optionsHtml) {
  const optionMap = getQuestionOptions(question, optionsHtml);
  const order = Object.keys(optionMap);
  optionsRaw.innerHTML = order.map((label) => optionMap[label]).filter(Boolean).join("");
  renderChoiceButtons(question, order);
}

function renderChoiceButtons(question, labels) {
  answerButtons.innerHTML = "";
  labels.forEach((label) => {
    const button = document.createElement("button");
    button.textContent = label;
    button.dataset.choiceLabel = label;
    button.addEventListener("click", () => gradeChoice(question, label));
    answerButtons.appendChild(button);
  });
}

function handleGlobalKeydown(event) {
  if (!currentQuestion) return;

  const target = event.target;
  const isEditable = isEditableTarget(target);
  const key = event.key;

  if (isEditable) {
    if ((key === "y" || key === "Y") && currentQuestion.kind !== "choice") {
      event.preventDefault();
      selfMark(true);
    } else if ((key === "n" || key === "N") && currentQuestion.kind !== "choice") {
      event.preventDefault();
      selfMark(false);
    }
    return;
  }

  if (key === "ArrowLeft") {
    event.preventDefault();
    goToPreviousQuestion();
    return;
  }

  if (key === "Escape" && !imageZoom.classList.contains("hidden")) {
    event.preventDefault();
    closeImageZoom();
    return;
  }

  if (key === "ArrowRight") {
    event.preventDefault();
    goToNextQuestion();
    return;
  }

  if (key === " " || key === "Spacebar") {
    event.preventDefault();
    goToNextQuestion();
    return;
  }

  if (currentQuestion.kind === "choice") {
    const mappedLabel = keyToChoiceLabel(key);
    if (mappedLabel) {
      event.preventDefault();
      gradeChoice(currentQuestion, mappedLabel);
    }
    return;
  }

  if (key === "y" || key === "Y") {
    event.preventDefault();
    selfMark(true);
    return;
  }

  if (key === "n" || key === "N") {
    event.preventDefault();
    selfMark(false);
  }
}

function isEditableTarget(target) {
  if (!target || !(target instanceof HTMLElement)) return false;
  return target.tagName === "TEXTAREA"
    || target.tagName === "INPUT"
    || target.isContentEditable;
}

function keyToChoiceLabel(key) {
  const normalized = String(key || "").toUpperCase();
  if (["A", "B", "C", "D"].includes(normalized)) {
    return normalized;
  }
  const numericMap = { "1": "A", "2": "B", "3": "C", "4": "D" };
  return numericMap[normalized] || "";
}

function gradeChoice(question, selected) {
  if (answeredThisRound) return;
  const answer = normalizeAnswer(question.answerText);
  const isCorrect = answer === selected;
  answeredThisRound = true;
  updateProgress(question.id, isCorrect);
    feedbackBox.className = `feedback-box ${isCorrect ? "correct" : "wrong"}`;
    feedbackBox.textContent = isCorrect ? `回答正确：${selected}` : `回答错误：你选了 ${selected}，正确答案是 ${answer || "未识别"}`;
  feedbackBox.classList.remove("hidden");
  revealAnswer(true);
  if (isCorrect) {
    queueAutoNext();
  }
}

function revealAnswer(fromScoring) {
  if (!currentQuestion) return;
  answerContent.classList.remove("hidden");
  if (!fromScoring && !answeredThisRound && currentQuestion.kind === "choice") {
    feedbackBox.className = "feedback-box wrong";
    feedbackBox.textContent = `正确答案：${normalizeAnswer(currentQuestion.answerText) || "未识别"}`;
    feedbackBox.classList.remove("hidden");
  }
}

function selfMark(isCorrect) {
  if (!currentQuestion || answeredThisRound) return;
  answeredThisRound = true;
  updateProgress(currentQuestion.id, isCorrect);
  feedbackBox.className = `feedback-box ${isCorrect ? "correct" : "wrong"}`;
  feedbackBox.textContent = isCorrect ? "已记为自评正确" : "已记为自评错误，并加入错题优先池";
  feedbackBox.classList.remove("hidden");
  revealAnswer(true);
  if (isCorrect) {
    queueAutoNext();
  }
}

function updateProgress(questionId, isCorrect) {
  const progress = getProgressFor(questionId);
  if (isCorrect) {
    progress.correct += 1;
    progress.streak = Math.max(0, progress.streak) + 1;
  } else {
    progress.wrong += 1;
    progress.streak = -1;
    if (!state.wrongBook.includes(questionId)) {
      state.wrongBook.unshift(questionId);
    }
  }
  persist();
  renderStats();
  renderQuestionLedger();
  renderWrongbook();
}

function buildAnswerPanel(question) {
  const parts = [];
  if (question.answerHtml) {
    parts.push(`<div class="rich-block"><p><strong>答案</strong></p>${question.answerHtml}</div>`);
  }
  if (question.explanationHtml) {
    parts.push(`<div class="rich-block"><p><strong>解析</strong></p>${question.explanationHtml}</div>`);
  }
  return parts.join("") || "<p>当前题目没有解析内容。</p>";
}

function chooseQuestion() {
  const subjectQuestions = getCurrentSubjectQuestions({ filtered: true });
  if (!subjectQuestions.length) return null;

  if (state.mode === "sequential") {
    const cursor = state.sequenceCursor[state.currentSubject] || 0;
    const question = subjectQuestions[cursor % subjectQuestions.length] || null;
    state.sequenceCursor[state.currentSubject] = (cursor + 1) % subjectQuestions.length;
    return question;
  }

  if (state.mode === "shuffled-cycle") {
    return chooseShuffledCycleQuestion(subjectQuestions);
  }

  let pool = subjectQuestions;
  if (state.mode === "wrong-only") {
    pool = subjectQuestions.filter((question) => state.wrongBook.includes(question.id));
  }
  if (!pool.length) return null;

  const weighted = pool.map((question) => {
    const progress = getProgressFor(question.id);
    let weight = 1;
    if (state.mode !== "subject-random") {
      weight += state.wrongBook.includes(question.id) ? 8 : 0;
    }
    if (state.mode === "wrong-priority") {
      weight += progress.wrong * 5;
    } else {
      weight += progress.wrong * 3;
    }
    weight += progress.seen === 0 ? 2 : 0;
    if (state.recentQueue.includes(question.id)) {
      weight *= 0.22;
    }
    return { question, weight: Math.max(weight, 0.1) };
  });

  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let cursor = Math.random() * total;
  for (const item of weighted) {
    cursor -= item.weight;
    if (cursor <= 0) return item.question;
  }
  return weighted[weighted.length - 1]?.question || null;
}

function queueAutoNext() {
  clearAutoNext();
  autoNextTimer = window.setTimeout(() => {
    autoNextTimer = null;
    goToNextQuestion();
  }, 900);
}

function clearAutoNext() {
  if (autoNextTimer) {
    window.clearTimeout(autoNextTimer);
    autoNextTimer = null;
  }
}

function renderStats() {
  const subjectQuestions = getCurrentSubjectQuestions({ filtered: true });
  const subjectStats = subjectQuestions.reduce(
    (acc, question) => {
      const progress = getProgressFor(question.id);
      acc.seen += progress.seen;
      acc.correct += progress.correct;
      acc.wrong += progress.wrong;
      return acc;
    },
    { seen: 0, correct: 0, wrong: 0 },
  );
  const accuracy = subjectStats.correct + subjectStats.wrong
    ? Math.round((subjectStats.correct / (subjectStats.correct + subjectStats.wrong)) * 100)
    : 0;

  statsGrid.innerHTML = [
    statCard("当前学科", state.currentSubject),
    statCard("题目总数", String(subjectQuestions.length)),
    statCard("出现次数", String(subjectStats.seen)),
    statCard("正确率", `${accuracy}%`),
    statCard("答对", String(subjectStats.correct)),
    statCard("答错", String(subjectStats.wrong)),
  ].join("");
}

function renderQuestionLedger() {
  if (!questionLedger || !ledgerSummary) return;
  const questions = getCurrentSubjectQuestions();
  const answered = questions.filter((question) => {
    const progress = getProgressFor(question.id);
    return progress.correct + progress.wrong > 0;
  }).length;
  const wrongCount = questions.filter((question) => state.wrongBook.includes(question.id)).length;
  const totalAttempts = questions.reduce((sum, question) => {
    const progress = getProgressFor(question.id);
    return sum + progress.correct + progress.wrong;
  }, 0);

  ledgerSummary.innerHTML = [
    `<span>题目 ${questions.length}</span>`,
    `<span>已答 ${answered}</span>`,
    `<span>错题 ${wrongCount}</span>`,
    `<span>作答 ${totalAttempts}</span>`,
  ].join("");

  questionLedger.innerHTML = "";
  questions.forEach((question, index) => {
    const progress = getProgressFor(question.id);
    const attempts = progress.correct + progress.wrong;
    const accuracy = attempts ? Math.round((progress.correct / attempts) * 100) : 0;
    const row = document.createElement("article");
    row.className = `ledger-row ${question.id === currentQuestion?.id ? "current" : ""}`;
    const preview = stripHtml(question.promptHtml).slice(0, 88) || question.label;
    row.innerHTML = `
      <div class="ledger-index">${index + 1}</div>
      <div class="ledger-main">
        <div class="ledger-title">
          <strong>${question.label}</strong>
          <span>${question.kind === "choice" ? "选择题" : "主观题"}</span>
          <span>${question.section || "未标注"}</span>
        </div>
        <p>${preview}${preview.length >= 88 ? "..." : ""}</p>
      </div>
      <div class="ledger-metrics">
        <span>见 ${progress.seen}</span>
        <span>对 ${progress.correct}</span>
        <span>错 ${progress.wrong}</span>
        <span>${accuracy}%</span>
        <span>${formatLastSeen(progress.lastSeenAt)}</span>
      </div>
    `;
    const jumpBtn = document.createElement("button");
    jumpBtn.className = "primary-btn";
    jumpBtn.textContent = "跳到此题";
    jumpBtn.addEventListener("click", () => {
      switchView("practice");
      openNextQuestion(question);
    });
    row.appendChild(jumpBtn);
    questionLedger.appendChild(row);
  });
}

function formatLastSeen(value) {
  if (!value) return "未练";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未练";
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function renderNavButtons() {
  prevBtn.disabled = state.historyCursor <= 0;
  nextBtn.disabled = !canGoNext();
}

function canGoNext() {
  if (state.historyCursor < state.questionHistory.length - 1) {
    return true;
  }
  const subjectQuestions = getCurrentSubjectQuestions({ filtered: true });
  if (!subjectQuestions.length) return false;
  if (state.mode === "wrong-only") {
    return subjectQuestions.some((question) => state.wrongBook.includes(question.id));
  }
  return true;
}

function goToPreviousQuestion() {
  if (state.historyCursor <= 0) return;
  clearAutoNext();
  state.historyCursor -= 1;
  const question = findQuestionById(state.questionHistory[state.historyCursor]);
  persist();
  openQuestion(question, { recordSeen: false, pushHistory: false });
}

function goToNextQuestion() {
  if (state.historyCursor < state.questionHistory.length - 1) {
    clearAutoNext();
    state.historyCursor += 1;
    const question = findQuestionById(state.questionHistory[state.historyCursor]);
    persist();
    openQuestion(question, { recordSeen: false, pushHistory: false });
    return;
  }
  openNextQuestion();
}

function statCard(label, value) {
  return `<div class="stat-card"><strong>${value}</strong><span>${label}</span></div>`;
}

function renderWrongbook() {
  const subjectQuestions = getCurrentSubjectQuestions({ filtered: true });
  const wrongQuestions = state.wrongBook
    .map((id) => subjectQuestions.find((question) => question.id === id))
    .filter(Boolean);

  if (!wrongQuestions.length) {
    wrongbookList.innerHTML = `<p class="muted">当前学科还没有错题。</p>`;
    return;
  }

  wrongbookList.innerHTML = "";
  wrongQuestions.slice(0, 40).forEach((question) => {
    const progress = getProgressFor(question.id);
    const item = document.createElement("div");
    item.className = "wrong-item";
    const preview = stripHtml(question.promptHtml).slice(0, 46) || question.label;
    item.innerHTML = `
      <p><strong>${question.label}</strong> · ${question.section || "未分类"}</p>
      <p class="muted">${preview}${preview.length >= 46 ? "..." : ""}</p>
      <p class="muted">错 ${progress.wrong} 次 / 对 ${progress.correct} 次</p>
    `;
    const actionBar = document.createElement("div");
    actionBar.className = "toolbar-actions";

    const jumpBtn = document.createElement("button");
    jumpBtn.className = "ghost-btn";
    jumpBtn.textContent = "立即重做";
    jumpBtn.addEventListener("click", () => openNextQuestion(question));

    const removeBtn = document.createElement("button");
    removeBtn.className = "ghost-btn";
    removeBtn.textContent = "移出错题本";
    removeBtn.addEventListener("click", () => {
      state.wrongBook = state.wrongBook.filter((id) => id !== question.id);
      persist();
      renderWrongbook();
      renderQuestionLedger();
    });

    actionBar.appendChild(jumpBtn);
    actionBar.appendChild(removeBtn);
    item.appendChild(actionBar);
    wrongbookList.appendChild(item);
  });
}

function normalizeAnswer(answerText) {
  return (answerText || "").replace(/[^A-Z]/gi, "").toUpperCase();
}

function chooseShuffledCycleQuestion(subjectQuestions) {
  const subject = state.currentSubject;
  const questionMap = new Map(subjectQuestions.map((question) => [question.id, question]));
  const currentIds = subjectQuestions.map((question) => question.id);
  const savedOrder = (state.shuffledOrder[subject] || []).filter((id) => questionMap.has(id));

  let order = savedOrder;
  if (order.length !== currentIds.length) {
    order = shuffleArray(currentIds);
    state.shuffledOrder[subject] = order;
    state.shuffledCursor[subject] = 0;
  }

  let cursor = state.shuffledCursor[subject] || 0;
  if (cursor >= order.length) {
    order = shuffleArray(currentIds);
    state.shuffledOrder[subject] = order;
    cursor = 0;
  }

  const question = questionMap.get(order[cursor]) || subjectQuestions[0] || null;
  state.shuffledCursor[subject] = cursor + 1;
  return question;
}

function filterQuestionsByMode(questions) {
  if (state.mode === "choice-only") {
    return questions.filter((question) => question.kind === "choice");
  }
  return questions;
}

function shuffleArray(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getQuestionOptions(question, optionsHtml) {
  const labels = question.optionLabels?.length ? question.optionLabels : ["A", "B", "C", "D"];
  const blocks = extractOptionBlocks(optionsHtml || "");
  const orderedLabels = mergeOptionLabels(labels, Object.keys(blocks));
  return orderedLabels.reduce((result, label) => {
    result[label] = blocks[label] || `<p>${label}.</p>`;
    return result;
  }, {});
}

function mergeOptionLabels(primaryLabels, parsedLabels) {
  const seen = new Set();
  return [...primaryLabels, ...parsedLabels]
    .filter((label) => ["A", "B", "C", "D", "E", "F"].includes(label))
    .filter((label) => {
      if (seen.has(label)) return false;
      seen.add(label);
      return true;
    })
    .sort((a, b) => a.localeCompare(b));
}

function extractOptionBlocks(optionsHtml) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = optionsHtml || "";
  return Array.from(wrapper.children).reduce((result, node) => {
    const html = node.outerHTML || "";
    const text = stripHtml(html);
    const match = text.match(/^\s*([A-D])\s*[\.．、]/);
    if (match) {
      result[match[1]] = html;
    }
    return result;
  }, {});
}

function splitChoiceContent(question) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `${question.promptHtml || ""}${question.optionsHtml || ""}`;
  const promptBlocks = [];
  const optionBlocks = {};

  Array.from(wrapper.children).forEach((node) => {
    if (node.tagName !== "P") {
      const html = node.outerHTML || "";
      if (hasVisibleContent(html)) {
        promptBlocks.push(html);
      }
      return;
    }

    const { prefixHtml, options } = splitChoiceParagraph(node.outerHTML || "");
    if (hasVisibleContent(prefixHtml)) {
      promptBlocks.push(prefixHtml);
    }
    options.forEach(({ label, html }) => {
      if (!optionBlocks[label] || stripHtml(html).length > stripHtml(optionBlocks[label]).length) {
        optionBlocks[label] = html;
      }
    });
  });

  const optionHtml = ["A", "B", "C", "D", "E", "F"].map((label) => optionBlocks[label]).filter(Boolean).join("");
  return {
    promptHtml: promptBlocks.join("") || question.promptHtml || "",
    optionsHtml: optionHtml || question.optionsHtml || "",
  };
}

function handleRichContentClick(event) {
  const image = event.target?.closest?.("img");
  if (!image) return;
  openImageZoom(image);
}

function openImageZoom(image) {
  imageZoomImg.src = image.currentSrc || image.src;
  imageZoomImg.alt = image.alt || "";
  imageZoom.classList.remove("hidden");
}

function closeImageZoom() {
  imageZoom.classList.add("hidden");
  imageZoomImg.removeAttribute("src");
}

function splitChoiceParagraph(blockHtml) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = blockHtml;
  const paragraph = wrapper.firstElementChild;
  if (!paragraph) {
    return { prefixHtml: blockHtml, options: [] };
  }

  const innerHtml = unwrapSpanTags(paragraph.innerHTML || "");
  const matches = Array.from(innerHtml.matchAll(/(^|[\s>])([A-D])\s*[\.．、]/g));
  if (!matches.length) {
    return { prefixHtml: blockHtml, options: [] };
  }

  const optionStarts = matches
    .map((match) => {
      const label = match[2];
      const index = match.index + match[1].length;
      return { label, index };
    })
    .filter(({ index }) => index >= 0);

  if (!optionStarts.length) {
    return { prefixHtml: blockHtml, options: [] };
  }

  const prefix = innerHtml.slice(0, optionStarts[0].index).trim();
  const options = optionStarts.map((item, idx) => {
    const end = idx + 1 < optionStarts.length ? optionStarts[idx + 1].index : innerHtml.length;
    const html = `<p>${innerHtml.slice(item.index, end).trim()}</p>`;
    return { label: item.label, html };
  });

  return {
    prefixHtml: prefix ? `<p>${prefix}</p>` : "",
    options,
  };
}

function unwrapSpanTags(html) {
  return (html || "").replace(/<\/?span[^>]*>/g, "");
}

function splitMaterialFromPrompt(promptHtml) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = promptHtml || "";
  const blocks = Array.from(wrapper.children);
  if (blocks.length < 2) {
    return { materialHtml: "", promptHtml };
  }

  const questionIndex = blocks.findIndex((node, index) => {
    if (index === 0) return false;
    const text = stripHtml(node.outerHTML || "");
    return /^\s*(?:[\(（]\s*)?\d+\s*[\.．、]/.test(text)
      || /^(What|Which|Why|How|Who|When|Where)\b/i.test(text);
  });
  if (questionIndex > 0) {
    const materialHtml = blocks.slice(0, questionIndex).map((node) => node.outerHTML).join("");
    const questionHtml = blocks.slice(questionIndex).map((node) => node.outerHTML).join("");
    if (stripHtml(materialHtml).length >= 120) {
      return { materialHtml, promptHtml: questionHtml };
    }
  }

  const firstText = stripHtml(blocks[0].outerHTML || "");
  const hasMaterialLead = firstText.length >= 80
    && /(材料|阅读|回答下列问题|请回答|如图|下图|根据下列|据图)/.test(firstText);
  if (hasMaterialLead) {
    return {
      materialHtml: blocks[0].outerHTML,
      promptHtml: blocks.slice(1).map((node) => node.outerHTML).join("") || promptHtml,
    };
  }

  return { materialHtml: "", promptHtml };
}

function hasVisibleContent(html) {
  if (!html) return false;
  return /<(img|table)\b/i.test(html) || Boolean(stripHtml(html));
}

function stripHtml(rawHtml) {
  const div = document.createElement("div");
  div.innerHTML = rawHtml || "";
  return div.textContent?.replace(/\s+/g, " ").trim() || "";
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return { ...structuredClone(defaultProgress), ...(saved || {}) };
  } catch (error) {
    return structuredClone(defaultProgress);
  }
}

function findQuestionById(id) {
  return questionBank.allQuestions.find((question) => question.id === id) || null;
}
