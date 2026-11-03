const questionBank = window.__QUESTION_BANK__ || { subjects: {}, allQuestions: [] };

const STORAGE_KEY = "g3-midterm-drill-lab-v1";
const API_KEY_STORAGE_KEY = "final-drill-lab-deepseek-api-key";
const ANALYSIS_VERSION = "20261103h";
const analysisBundles = {};
let mathQueue = Promise.resolve();

// The copied answer list is plain text, so write formulas the way they are typed: \(x^{2}\le 1\) → x²≤1.
const PLAIN_COMMANDS = {
  le: "≤", ge: "≥", ne: "≠", approx: "≈", pm: "±", times: "×", div: "÷", cdot: "·", in: "∈", notin: "∉",
  cap: "∩", cup: "∪", subseteq: "⊆", subsetneq: "⊊", subsetneqq: "⫋", complement: "∁", varnothing: "∅",
  forall: "∀", exists: "∃", neg: "¬", land: "∧", lor: "∨", infty: "∞", because: "∵", therefore: "∴",
  to: "→", Rightarrow: "⇒", Leftrightarrow: "⇔", uparrow: "↑", downarrow: "↓", rightleftharpoons: "⇌",
  triangle: "△", angle: "∠", circ: "°", cdots: "…", perp: "⊥", parallel: "∥", alpha: "α", beta: "β",
  gamma: "γ", theta: "θ", lambda: "λ", mu: "μ", pi: "π", rho: "ρ", varphi: "φ", omega: "ω",
  varepsilon: "ε", eta: "η", Delta: "Δ", Omega: "Ω", sim: "~", propto: "∝",
};
const PLAIN_SCRIPTS = {
  "^": Object.fromEntries([..."0123456789+-"].map((ch, i) => [ch, "⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻"[i]])),
  _: Object.fromEntries([..."0123456789+-"].map((ch, i) => [ch, "₀₁₂₃₄₅₆₇₈₉₊₋"[i]])),
};
const LOCAL_AI_EXPLAIN_ENDPOINT = window.location.protocol === "file:"
  ? "http://127.0.0.1:8767/api/explain"
  : "/api/explain";
const LOCAL_AI_GRADE_ENDPOINT = window.location.protocol === "file:"
  ? "http://127.0.0.1:8767/api/grade-subjective"
  : "/api/grade-subjective";
const DEEPSEEK_CHAT_ENDPOINT = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-v4-pro";
const DAY_MS = 24 * 60 * 60 * 1000;
// Wait before each spaced review once a wrong-book question is answered
// correctly while due; the last step clears it from the wrong book.
const REVIEW_INTERVALS = [DAY_MS, 3 * DAY_MS];
const REVIEW_STEPS = REVIEW_INTERVALS.length + 1;

const defaultProgress = {
  scope: "all",
  order: "random",
  topicBySubject: {},
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
  aiExplanations: {},
  aiGrades: {},
  activeView: "practice",
};

const state = loadProgress();
state.aiGrades = state.aiGrades || {};
state.aiExplanations = state.aiExplanations || {};
state.answerDrafts = state.answerDrafts || {};
state.topicBySubject = state.topicBySubject || {};

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
const inputWrapper = document.getElementById("input-wrapper");
const subjectiveInput = document.getElementById("subjective-input");
const subjectiveActions = document.getElementById("subjective-actions");
const feedbackBox = document.getElementById("feedback-box");
const answerContent = document.getElementById("answer-content");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const revealBtn = document.getElementById("reveal-btn");
const aiExplainBtn = document.getElementById("ai-explain-btn");
const aiGradeBtn = document.getElementById("ai-grade-btn");
const markCorrectBtn = document.getElementById("mark-correct-btn");
const markWrongBtn = document.getElementById("mark-wrong-btn");
const clearWrongbookBtn = document.getElementById("clear-wrongbook");
const resetSubjectStatsBtn = document.getElementById("reset-subject-stats");
const deepseekApiKeyInput = document.getElementById("deepseek-api-key");
const saveApiKeyBtn = document.getElementById("save-api-key");
const clearApiKeyBtn = document.getElementById("clear-api-key");
const apiKeyStatus = document.getElementById("api-key-status");
const scopeButtons = Array.from(document.querySelectorAll(".scope-btn"));
const orderButtons = Array.from(document.querySelectorAll(".order-btn"));
const sidebar = document.getElementById("sidebar");
const sidebarBackdrop = document.getElementById("sidebar-backdrop");
const sidebarOpenBtn = document.getElementById("sidebar-open-btn");
const sidebarCloseBtn = document.getElementById("sidebar-close-btn");
const mobileSubjectSelect = document.getElementById("mobile-subject-select");
const questionToolbar = document.querySelector(".question-toolbar");
const topicSelect = document.getElementById("topic-select");
const topicMastery = document.getElementById("topic-mastery");
const markPartialBtn = document.getElementById("mark-partial-btn");
const exportProgressBtn = document.getElementById("export-progress-btn");
const importProgressBtn = document.getElementById("import-progress-btn");
const importProgressInput = document.getElementById("import-progress-input");
const backupStatus = document.getElementById("backup-status");
const keyboardHelp = document.getElementById("keyboard-help");
const keyboardHelpToggle = document.getElementById("keyboard-help-toggle");
const answerReviewSearch = document.getElementById("answer-review-search");
const answerReviewCoverBtn = document.getElementById("answer-review-cover-btn");
const practiceView = document.getElementById("practice-view");
const ledgerView = document.getElementById("ledger-view");
const practiceViewBtn = document.getElementById("practice-view-btn");
const ledgerViewBtn = document.getElementById("ledger-view-btn");
const answerReviewView = document.getElementById("answer-review-view");
const answerReviewViewBtn = document.getElementById("answer-review-view-btn");
const ledgerSummary = document.getElementById("ledger-summary");
const questionLedger = document.getElementById("question-ledger");
const answerReviewSummary = document.getElementById("answer-review-summary");
const answerReviewList = document.getElementById("answer-review-list");
const copyAnswerReviewBtn = document.getElementById("copy-answer-review-btn");
const answerReviewCopyStatus = document.getElementById("answer-review-copy-status");
const answerReviewPlainText = document.getElementById("answer-review-plain-text");
const imageZoom = document.getElementById("image-zoom");
const imageZoomImg = document.getElementById("image-zoom-img");
const imageZoomClose = document.getElementById("image-zoom-close");
const aiExplanationPanel = document.getElementById("ai-explanation-panel");
const aiExplanationContent = document.getElementById("ai-explanation-content");
const aiExplanationMeta = document.getElementById("ai-explanation-meta");
const aiGradingPanel = document.getElementById("ai-grading-panel");
const aiGradingContent = document.getElementById("ai-grading-content");
const aiGradingMeta = document.getElementById("ai-grading-meta");

let currentQuestion = null;
let answeredThisRound = false;
// Once the answer is on screen the question is locked: no picking an option, no editing the typed answer.
let answerRevealed = false;
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
  renderTopicSelect();
  renderModeButtons();
  renderApiKeySettings();
  bindEvents();
  trackToolbarHeight();
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
  aiExplainBtn.addEventListener("click", requestAiExplanation);
  aiGradeBtn.addEventListener("click", requestSubjectiveGrading);
  saveApiKeyBtn.addEventListener("click", saveApiKeySetting);
  clearApiKeyBtn.addEventListener("click", clearApiKeySetting);
  markCorrectBtn.addEventListener("click", () => selfMark(true));
  markPartialBtn.addEventListener("click", () => selfMark("partial"));
  markWrongBtn.addEventListener("click", () => selfMark(false));
  topicSelect.addEventListener("change", () => selectTopic(topicSelect.value));
  exportProgressBtn.addEventListener("click", exportProgress);
  importProgressBtn.addEventListener("click", () => importProgressInput.click());
  importProgressInput.addEventListener("change", importProgress);
  keyboardHelpToggle.addEventListener("click", () => {
    state.showShortcuts = !state.showShortcuts;
    persist();
    renderKeyboardHelp();
  });
  answerReviewSearch.addEventListener("input", () => renderAnswerReview());
  answerReviewCoverBtn.addEventListener("click", () => {
    state.coverAnswers = !state.coverAnswers;
    persist();
    renderAnswerReview();
  });
  answerReviewList.addEventListener("click", (event) => {
    const answer = event.target.closest?.(".answer-review-answer");
    if (answer && answerReviewList.classList.contains("covered")) {
      answer.classList.toggle("revealed");
    }
  });
  practiceViewBtn.addEventListener("click", () => switchView("practice"));
  ledgerViewBtn.addEventListener("click", () => switchView("ledger"));
  answerReviewViewBtn.addEventListener("click", () => switchView("answer-review"));
  copyAnswerReviewBtn.addEventListener("click", copyAnswerReviewText);
  imageZoom.addEventListener("click", closeImageZoom);
  imageZoomClose.addEventListener("click", closeImageZoom);
  imageZoomImg.addEventListener("click", (event) => event.stopPropagation());
  document.addEventListener("keydown", handleGlobalKeydown);
  [promptContent, answerContent, materialContent, aiGradingContent, aiExplanationContent, answerReviewList].forEach((container) => {
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
    renderAnswerReview();
  });
  resetSubjectStatsBtn.addEventListener("click", () => {
    resetCurrentSubjectProgress();
  });
  scopeButtons.forEach((button) => {
    button.addEventListener("click", () => applyModeChange({ scope: button.dataset.scope }));
  });
  orderButtons.forEach((button) => {
    button.addEventListener("click", () => applyModeChange({ order: button.dataset.order }));
  });
  sidebarOpenBtn.addEventListener("click", () => setSidebarOpen(true));
  sidebarCloseBtn.addEventListener("click", () => setSidebarOpen(false));
  sidebarBackdrop.addEventListener("click", () => setSidebarOpen(false));
  mobileSubjectSelect.addEventListener("change", () => selectSubject(mobileSubjectSelect.value));
  optionsRaw.addEventListener("click", handleOptionClick);
  optionsRaw.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const option = event.target.closest?.("[data-choice-label]");
    if (!option || !currentQuestion) return;
    event.preventDefault();
    event.stopPropagation();
    gradeChoice(currentQuestion, option.dataset.choiceLabel);
  });
}

function applyModeChange(change) {
  Object.assign(state, change);
  persist();
  renderModeButtons();
  openNextQuestion();
  renderStats();
  renderQuestionLedger();
  renderAnswerReview();
  renderWrongbook();
}

function setSidebarOpen(open) {
  document.body.classList.toggle("sidebar-open", open);
  sidebarBackdrop.classList.toggle("hidden", !open);
  sidebarOpenBtn.setAttribute("aria-expanded", String(open));
}

function trackToolbarHeight() {
  const update = () => {
    document.documentElement.style.setProperty("--toolbar-h", `${questionToolbar.offsetHeight}px`);
  };
  update();
  if (window.ResizeObserver) {
    new ResizeObserver(update).observe(questionToolbar);
  }
}

function switchView(view) {
  state.activeView = view;
  persist();
  renderActiveView();
}

function renderActiveView() {
  const isLedger = state.activeView === "ledger";
  const isAnswerReview = state.activeView === "answer-review";
  practiceView.classList.toggle("hidden", isLedger || isAnswerReview);
  ledgerView.classList.toggle("hidden", !isLedger);
  answerReviewView.classList.toggle("hidden", !isAnswerReview);
  practiceViewBtn.classList.toggle("active", !isLedger && !isAnswerReview);
  ledgerViewBtn.classList.toggle("active", isLedger);
  answerReviewViewBtn.classList.toggle("active", isAnswerReview);
  prevBtn.classList.toggle("hidden", isLedger || isAnswerReview);
  nextBtn.classList.toggle("hidden", isLedger || isAnswerReview);
  revealBtn.classList.toggle("hidden", isLedger || isAnswerReview);
  aiExplainBtn.classList.toggle("hidden", isLedger || isAnswerReview);
  questionToolbar.querySelector(".question-actions").classList.toggle("hidden", isLedger || isAnswerReview);
  if (isLedger) {
    renderQuestionLedger();
  }
  if (isAnswerReview) {
    renderAnswerReview();
  }
}

function renderSubjects() {
  subjectTabs.innerHTML = "";
  mobileSubjectSelect.innerHTML = "";
  Object.keys(questionBank.subjects).forEach((subject) => {
    const label = `${subject} · ${questionBank.subjects[subject].questions.length}`;
    const button = document.createElement("button");
    button.className = `subject-tab ${subject === state.currentSubject ? "active" : ""}`;
    button.textContent = label;
    button.addEventListener("click", () => selectSubject(subject));
    subjectTabs.appendChild(button);
    mobileSubjectSelect.add(new Option(label, subject, false, subject === state.currentSubject));
  });
}

function selectSubject(subject) {
  setSidebarOpen(false);
  state.currentSubject = subject;
  persist();
  renderSubjects();
  renderTopicSelect();
  openNextQuestion();
  renderStats();
  renderQuestionLedger();
  renderAnswerReview();
  renderWrongbook();
}

function renderModeButtons() {
  scopeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.scope === state.scope);
  });
  orderButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.order === state.order);
  });
}

function renderKeyboardHelp() {
  keyboardHelpToggle.setAttribute("aria-expanded", String(Boolean(state.showShortcuts)));
  keyboardHelpToggle.classList.toggle("active", Boolean(state.showShortcuts));
  keyboardHelp.classList.toggle("hidden", !state.showShortcuts);
  if (!state.showShortcuts || !currentQuestion) return;
  const keys = [["←", "上一题"], ["→ / Space", "下一题"]];
  if (currentQuestion.kind === "choice") {
    const labels = Array.from(optionsRaw.querySelectorAll("[data-choice-label]")).map((node) => node.dataset.choiceLabel);
    const count = labels.length || (currentQuestion.optionLabels || []).length || 4;
    keys.push([`A-${String.fromCharCode(64 + count)} / 1-${count}`, "选择选项"]);
  } else {
    keys.push(["Y", "全对"], ["P", "部分对"], ["N", "不会"]);
  }
  keyboardHelp.innerHTML = keys.map(([key, label]) => `<span><kbd>${key}</kbd> ${label}</span>`).join("");
}

function getQuestionTopic(question) {
  return question.group || question.section || "未分组";
}

function getCurrentTopic() {
  const topic = state.topicBySubject[state.currentSubject] || "";
  const exists = getCurrentSubjectQuestions().some((question) => getQuestionTopic(question) === topic);
  return exists ? topic : "";
}

function getSubjectTopics() {
  const topics = new Map();
  getCurrentSubjectQuestions().forEach((question) => {
    const topic = getQuestionTopic(question);
    if (!topics.has(topic)) topics.set(topic, []);
    topics.get(topic).push(question);
  });
  return topics;
}

function renderTopicSelect() {
  const current = getCurrentTopic();
  topicSelect.innerHTML = "";
  topicSelect.add(new Option(`全部考点 · ${getCurrentSubjectQuestions().length}`, "", false, !current));
  getSubjectTopics().forEach((questions, topic) => {
    topicSelect.add(new Option(`${topic} · ${questions.length}`, topic, false, topic === current));
  });
}

function selectTopic(topic) {
  state.topicBySubject[state.currentSubject] = topic;
  renderTopicSelect();
  applyModeChange({});
}

function renderApiKeySettings() {
  const saved = getSavedApiKey();
  deepseekApiKeyInput.value = saved;
  apiKeyStatus.textContent = saved ? "已在本地保存 API Key" : "未保存 API Key";
}

function saveApiKeySetting() {
  const value = deepseekApiKeyInput.value.trim();
  if (!value) {
    clearApiKeySetting();
    return;
  }
  localStorage.setItem(API_KEY_STORAGE_KEY, value);
  renderApiKeySettings();
}

function clearApiKeySetting() {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
  deepseekApiKeyInput.value = "";
  renderApiKeySettings();
}

function getSavedApiKey() {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || "";
}

function getCurrentSubjectQuestions({ filtered = false } = {}) {
  const questions = questionBank.subjects[state.currentSubject]?.questions || [];
  return filtered ? filterQuestionsByMode(questions) : questions;
}

function getProgressFor(id) {
  if (!state.stats[id]) {
    state.stats[id] = { seen: 0, correct: 0, wrong: 0, partial: 0, streak: 0, lastSeenAt: 0 };
  }
  if (typeof state.stats[id].reviewLevel !== "number") {
    state.stats[id].reviewLevel = Math.max(0, state.stats[id].wrong || 0);
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
  Object.keys(state.aiGrades || {}).forEach((id) => {
    if (subjectQuestionIds.has(id)) {
      delete state.aiGrades[id];
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
  renderAnswerReview();
  renderNavButtons();
}

function openQuestion(question, { recordSeen = true, pushHistory = true } = {}) {
  clearAutoNext();
  currentQuestion = question;
  answeredThisRound = false;
  setAnswerLocked(false);
  if (!currentQuestion) {
    questionMeta.textContent = "当前模式没有可用题目";
    questionTitle.textContent = "换个模式或先积累错题";
    promptContent.innerHTML = "";
    choiceWrapper.classList.add("hidden");
    inputWrapper.classList.add("hidden");
    subjectiveActions.classList.add("hidden");
    feedbackBox.classList.add("hidden");
    answerContent.classList.add("hidden");
    aiExplanationPanel.classList.add("hidden");
    aiExplanationContent.innerHTML = "";
    aiExplanationMeta.textContent = "";
    aiGradingPanel.classList.add("hidden");
    aiGradingContent.innerHTML = "";
    aiGradingMeta.textContent = "";
    materialContent.classList.add("hidden");
    materialContent.innerHTML = "";
    renderNavButtons();
    return;
  }

  if (state.currentSubject !== currentQuestion.subject) {
    state.currentSubject = currentQuestion.subject;
    renderSubjects();
    renderTopicSelect();
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
  const materialSplit = splitMaterialFromPrompt(choiceContent.promptHtml || "", currentQuestion);
  const materialHtml = annotateClozeBlanks(materialSplit.materialHtml, currentQuestion);
  materialContent.innerHTML = materialHtml
    ? `<p class="material-label">材料</p><div class="rich-block">${materialHtml}</div>`
    : "";
  materialContent.classList.toggle("hidden", !materialSplit.materialHtml);
  practiceView.classList.toggle("has-material", Boolean(materialSplit.materialHtml));
  materialContent.scrollTop = 0;
  scrollQuestionIntoView();
  promptContent.innerHTML = annotateClozeBlanks(materialSplit.promptHtml, currentQuestion) || "<p>题面缺失</p>";
  answerContent.innerHTML = buildAnswerPanel(currentQuestion);
  fillAnalysis(answerContent.querySelector(".analysis-slot"), currentQuestion);
  renderAiExplanation(currentQuestion);
  renderAiGrading(currentQuestion);
  enhanceRichContent(materialContent);
  enhanceRichContent(promptContent);
  enhanceRichContent(answerContent);
  answerContent.classList.add("hidden");
  subjectiveInput.value = state.answerDrafts[currentQuestion.id] || "";
  feedbackBox.classList.add("hidden");
  feedbackBox.textContent = "";
  feedbackBox.className = "feedback-box hidden";

  renderKeyboardHelp();
  if (currentQuestion.kind === "choice") {
    renderChoiceQuestion(currentQuestion, choiceContent.optionsHtml);
    choiceWrapper.classList.remove("hidden");
    inputWrapper.classList.add("hidden");
    subjectiveActions.classList.add("hidden");
    aiGradingPanel.classList.add("hidden");
  } else {
    choiceWrapper.classList.add("hidden");
    inputWrapper.classList.remove("hidden");
    subjectiveActions.classList.remove("hidden");
    aiGradeBtn.disabled = false;
  }

  renderStats();
  renderQuestionLedger();
  renderAnswerReview();
  renderWrongbook();
  renderNavButtons();
}

function openNextQuestion(forceQuestion = null) {
  const question = forceQuestion || chooseQuestion();
  openQuestion(question, { recordSeen: true, pushHistory: true });
}

function renderChoiceQuestion(question, optionsHtml) {
  const optionMap = getQuestionOptions(question, optionsHtml);
  optionsRaw.classList.remove("answered");
  optionsRaw.innerHTML = Object.keys(optionMap)
    .map((label) => `
      <div class="option-choice" role="button" tabindex="0" data-choice-label="${label}">
        <span class="option-badge">${label}</span>
        <div class="option-body rich-block">${stripOptionLabel(optionMap[label], label)}</div>
      </div>`)
    .join("");
  enhanceRichContent(optionsRaw);
  const bodies = Array.from(optionsRaw.querySelectorAll(".option-body"));
  const pictureOnly = bodies.length > 0
    && bodies.every((body) => !body.textContent.trim() && body.querySelector('img[alt^="选项"]'));
  optionsRaw.classList.toggle("picture-options", pictureOnly);
}

function stripOptionLabel(html, label) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html || "";
  const walker = document.createTreeWalker(wrapper, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.nodeValue.trim()) continue;
    node.nodeValue = node.nodeValue.replace(new RegExp(`^\\s*${label}\\s*[\\.．、]\\s*`), "");
    break;
  }
  return wrapper.innerHTML;
}

function handleOptionClick(event) {
  const option = event.target.closest?.("[data-choice-label]");
  if (!option || !currentQuestion) return;
  if ((answeredThisRound || answerRevealed) && event.target.closest("img")) return;
  event.stopPropagation();
  gradeChoice(currentQuestion, option.dataset.choiceLabel);
}

function markChoiceOptions(answer, selected = "") {
  optionsRaw.classList.add("answered");
  optionsRaw.querySelectorAll("[data-choice-label]").forEach((option) => {
    const label = option.dataset.choiceLabel;
    option.classList.toggle("correct", label === answer);
    option.classList.toggle("wrong", Boolean(selected) && label === selected && label !== answer);
  });
}

function handleGlobalKeydown(event) {
  if (!currentQuestion) return;

  const target = event.target;
  const isEditable = isEditableTarget(target);
  const key = event.key;

  if (isEditable) {
    if (key === "Escape" && !imageZoom.classList.contains("hidden")) {
      event.preventDefault();
      closeImageZoom();
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

  if (key === "p" || key === "P") {
    event.preventDefault();
    selfMark("partial");
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
  if (["A", "B", "C", "D", "E", "F", "G"].includes(normalized)) {
    return normalized;
  }
  const numericMap = { "1": "A", "2": "B", "3": "C", "4": "D", "5": "E", "6": "F", "7": "G" };
  return numericMap[normalized] || "";
}

function gradeChoice(question, selected) {
  if (answeredThisRound || answerRevealed) return;
  const answer = normalizeAnswer(question.answerText);
  const isCorrect = answer === selected;
  answeredThisRound = true;
  markChoiceOptions(answer, selected);
  const outcome = updateProgress(question.id, isCorrect);
    feedbackBox.className = `feedback-box ${isCorrect ? "correct" : "wrong"}`;
    feedbackBox.textContent = isCorrect
      ? `回答正确：${selected}${describeReviewOutcome(outcome)}`
      : `回答错误：你选了 ${selected}，正确答案是 ${answer || "未识别"}`;
  feedbackBox.classList.remove("hidden");
  revealAnswer(true);
  if (isCorrect) {
    queueAutoNext();
  }
}

function revealAnswer(fromScoring) {
  if (!currentQuestion) return;
  answerContent.classList.remove("hidden");
  setAnswerLocked(true);
  if (!fromScoring && !answeredThisRound && currentQuestion.kind === "choice") {
    feedbackBox.className = "feedback-box wrong";
    feedbackBox.textContent = `正确答案：${normalizeAnswer(currentQuestion.answerText) || "未识别"}`;
    feedbackBox.classList.remove("hidden");
    markChoiceOptions(normalizeAnswer(currentQuestion.answerText));
  }
}

function setAnswerLocked(locked) {
  answerRevealed = locked;
  subjectiveInput.readOnly = locked;
  subjectiveInput.classList.toggle("locked", locked);
  subjectiveInput.placeholder = locked
    ? "答案已显示，不能再作答。"
    : "在这里输入答案，显示答案后自行对照批改。";
}

// result: true (全对), "partial" (部分对) or false (不会/错).
function selfMark(result) {
  if (!currentQuestion || answeredThisRound) return;
  answeredThisRound = true;
  const outcome = updateProgress(currentQuestion.id, result);
  const tone = result === true ? "correct" : result === "partial" ? "partial" : "wrong";
  feedbackBox.className = `feedback-box ${tone}`;
  feedbackBox.textContent = {
    correct: `已记为全对${describeReviewOutcome(outcome)}`,
    partial: "已记为部分对，加入错题本，今天再练一次",
    wrong: "已记为不会，加入错题本，今天再练一次",
  }[tone];
  feedbackBox.classList.remove("hidden");
  revealAnswer(true);
  if (result === true) {
    queueAutoNext();
  }
}

function isReviewDue(progress) {
  return (progress?.dueAt || 0) <= Date.now();
}

function describeReviewOutcome(outcome) {
  if (outcome === "cleared") return "，已完成复习，移出错题本";
  if (outcome === "scheduled") return "，按计划延后复习";
  return "";
}

// Returns "cleared" / "scheduled" when a due wrong-book question advances its review.
function updateProgress(questionId, result) {
  const progress = getProgressFor(questionId);
  let outcome = "";
  if (result === true) {
    progress.correct += 1;
    progress.streak = Math.max(0, progress.streak) + 1;
    if (state.wrongBook.includes(questionId) && isReviewDue(progress)) {
      progress.reviewStep = (progress.reviewStep || 0) + 1;
      if (progress.reviewStep >= REVIEW_STEPS) {
        progress.reviewLevel = 0;
        progress.reviewStep = 0;
        progress.dueAt = 0;
        state.wrongBook = state.wrongBook.filter((id) => id !== questionId);
        outcome = "cleared";
      } else {
        progress.dueAt = Date.now() + REVIEW_INTERVALS[progress.reviewStep - 1];
        outcome = "scheduled";
      }
    }
  } else {
    if (result === "partial") {
      progress.partial = (progress.partial || 0) + 1;
      progress.reviewLevel = Math.max(1, getWrongReviewLevel(progress));
    } else {
      progress.wrong += 1;
      progress.reviewLevel = getWrongReviewLevel(progress) + 1;
    }
    progress.streak = -1;
    progress.reviewStep = 0;
    progress.dueAt = 0;
    if (!state.wrongBook.includes(questionId)) {
      state.wrongBook.unshift(questionId);
    }
  }
  persist();
  renderStats();
  renderQuestionLedger();
  renderWrongbook();
  return outcome;
}

function getAttempts(progress) {
  return progress.correct + progress.wrong + (progress.partial || 0);
}

function getAccuracy(progress) {
  const attempts = getAttempts(progress);
  return attempts ? Math.round(((progress.correct + 0.5 * (progress.partial || 0)) / attempts) * 100) : 0;
}

function buildAnswerPanel(question) {
  const parts = [];
  if (question.answerHtml) {
    parts.push(`<div class="rich-block"><p><strong>答案</strong></p>${question.answerHtml}</div>`);
  }
  if (question.explanationHtml) {
    parts.push(`<div class="rich-block"><p><strong>原卷解析</strong></p>${question.explanationHtml}</div>`);
  }
  parts.push(`<div class="analysis-slot"></div>`);
  return parts.join("");
}

// Detailed analyses live in data/analysis/<slug>.json and load the first time a subject needs them.
function loadAnalysis(question) {
  const slug = question.id.split("-")[0];
  if (!analysisBundles[slug]) {
    analysisBundles[slug] = fetch(`data/analysis/${slug}.json?v=${ANALYSIS_VERSION}`)
      .then((response) => (response.ok ? response.json() : {}))
      .catch(() => {
        delete analysisBundles[slug];
        return {};
      });
  }
  return analysisBundles[slug].then((bundle) => bundle[question.id] || null);
}

async function fillAnalysis(slot, question) {
  if (!slot) return;
  slot.dataset.questionId = question.id;
  const analysis = await loadAnalysis(question);
  if (!slot.isConnected || slot.dataset.questionId !== question.id) return;
  if (!analysis) {
    slot.innerHTML = question.answerHtml || question.explanationHtml ? "" : "<p>当前题目没有解析内容。</p>";
    return;
  }
  slot.innerHTML = renderAnalysisHtml(analysis);
  enhanceRichContent(slot);
}

// The bundle is validated at build time to contain only <b> <i> <sub> <sup> <br> markup.
function renderAnalysisHtml(analysis) {
  const list = (items) => `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
  const parts = [
    `<div class="analysis-head"><strong>详细解析</strong><span>${analysis.focus}</span></div>`,
  ];
  if (analysis.answerNote) {
    parts.push(`<p class="analysis-note"><strong>答案说明</strong>${analysis.answerNote}</p>`);
  }
  parts.push(`<h4>详解</h4>${analysis.explanation.map((paragraph) => `<p>${paragraph}</p>`).join("")}`);
  if (analysis.options.length) {
    const rows = analysis.options.map((option) => `
      <div class="analysis-option${option.correct ? " correct" : ""}">
        <span class="option-badge">${escapeHtml(option.label)}</span>
        <div>${option.analysis}</div>
      </div>`);
    parts.push(`<h4>选项分析</h4><div class="analysis-options">${rows.join("")}</div>`);
  }
  if (analysis.terms.length) {
    const terms = analysis.terms.map((item) => `<div><dt>${item.term}</dt><dd>${item.definition}</dd></div>`);
    parts.push(`<h4>名词解释</h4><dl class="analysis-terms">${terms.join("")}</dl>`);
  }
  parts.push(`<h4>知识点整理</h4>${list(analysis.keyPoints)}`);
  if (analysis.pitfalls.length) {
    parts.push(`<h4>易错提醒</h4>${list(analysis.pitfalls)}`);
  }
  return `<div class="analysis rich-block">${parts.join("")}</div>`;
}

function renderAiExplanation(question, { showCached = false } = {}) {
  const cached = state.aiExplanations?.[question.id];
  aiExplainBtn.disabled = false;
  aiExplainBtn.textContent = cached ? "显示 AI 解析" : "AI 解析";
  aiExplanationMeta.textContent = cached?.model ? cached.model : "";
  if (!cached?.content) {
    aiExplanationPanel.classList.add("hidden");
    aiExplanationContent.innerHTML = "";
    return;
  }
  aiExplanationContent.innerHTML = formatAiExplanation(cached.content);
  enhanceRichContent(aiExplanationContent);
  aiExplanationPanel.classList.toggle("hidden", !showCached);
}

function renderAiGrading(question) {
  const cached = state.aiGrades?.[question.id];
  aiGradeBtn.disabled = false;
  aiGradeBtn.textContent = cached ? "显示 AI 批改" : "AI 批改";
  aiGradingMeta.textContent = cached?.model
    ? `${cached.model}${typeof cached.score === "number" ? ` · ${cached.score}/100` : ""}`
    : "";
  if (!cached?.content || question.kind === "choice") {
    aiGradingPanel.classList.add("hidden");
    aiGradingContent.innerHTML = "";
    return;
  }
  aiGradingContent.innerHTML = formatAiExplanation(cached.content);
  enhanceRichContent(aiGradingContent);
  aiGradingPanel.classList.remove("hidden");
}

async function requestSubjectiveGrading() {
  if (!currentQuestion || currentQuestion.kind === "choice") return;
  const answer = subjectiveInput.value.trim();
  if (!answer) {
    feedbackBox.className = "feedback-box wrong";
    feedbackBox.textContent = "请先在作答区输入答案，再使用 AI 批改。";
    feedbackBox.classList.remove("hidden");
    return;
  }

  const cached = state.aiGrades?.[currentQuestion.id];
  if (cached?.content && cached.studentAnswer === answer) {
    aiGradingPanel.classList.toggle("hidden");
    return;
  }

  const apiKey = getSavedApiKey();
  aiGradeBtn.disabled = true;
  aiGradeBtn.textContent = "批改中...";
  aiGradingPanel.classList.remove("hidden");
  aiGradingMeta.textContent = "";
  aiGradingContent.innerHTML = "<p class=\"muted\">正在批改主观题。</p>";

  try {
    const payload = await fetchSubjectiveGrading(buildAiQuestionPayload(currentQuestion), answer, apiKey);
    const score = typeof payload.score === "number" ? payload.score : extractScoreFromGrading(payload.grading || "");
    const isCorrect = typeof payload.isCorrect === "boolean" ? payload.isCorrect : inferCorrectFromScore(score);
    state.aiGrades[currentQuestion.id] = {
      content: payload.grading || "",
      score,
      isCorrect,
      model: payload.model || "",
      studentAnswer: answer,
      createdAt: Date.now(),
    };
    persist();
    renderAiGrading(currentQuestion);
    applyAiGradingToProgress(isCorrect, score);
  } catch (error) {
    aiGradingMeta.textContent = "请求失败";
    aiGradingContent.innerHTML = `<p class="muted">${escapeHtml(error.message || "AI 批改请求失败。")}</p>`;
    aiGradeBtn.disabled = false;
    aiGradeBtn.textContent = "AI 批改";
  }
}

function applyAiGradingToProgress(isCorrect, score) {
  const result = resultFromAiGrade(isCorrect, score);
  if (!currentQuestion || answeredThisRound || result === null) return;
  answeredThisRound = true;
  const outcome = updateProgress(currentQuestion.id, result);
  const tone = result === true ? "correct" : result === "partial" ? "partial" : "wrong";
  feedbackBox.className = `feedback-box ${tone}`;
  const scoreText = typeof score === "number" ? `（${score}/100）` : "";
  feedbackBox.textContent = {
    correct: `AI 判定基本正确${scoreText}${describeReviewOutcome(outcome)}`,
    partial: `AI 判定部分正确${scoreText}，已加入错题本`,
    wrong: `AI 判定需要重做${scoreText}，已加入错题本`,
  }[tone];
  feedbackBox.classList.remove("hidden");
  revealAnswer(true);
}

async function fetchSubjectiveGrading(questionPayload, studentAnswer, apiKey) {
  if (shouldPreferLocalProxy()) {
    try {
      return await fetchLocalSubjectiveGrading(questionPayload, studentAnswer, apiKey);
    } catch (error) {
      if (!apiKey || !(error instanceof TypeError)) {
        throw error;
      }
    }
  }
  return fetchDeepSeekGradeDirect(questionPayload, studentAnswer, apiKey);
}

async function fetchLocalSubjectiveGrading(questionPayload, studentAnswer, apiKey) {
  const response = await fetch(LOCAL_AI_GRADE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey,
      question: questionPayload,
      studentAnswer,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if ([404, 405, 501].includes(response.status)) {
    throw new TypeError("Local AI proxy is unavailable");
  }
  if (!response.ok) {
    throw new Error(payload.error || "AI 批改请求失败。");
  }
  return payload;
}

async function fetchDeepSeekGradeDirect(questionPayload, studentAnswer, apiKey) {
  if (!apiKey) {
    throw new Error("请先在网页左侧 AI 设置中填写并保存 DeepSeek API Key。");
  }
  const response = await fetch(DEEPSEEK_CHAT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: buildDeepSeekGradingMessages(questionPayload, studentAnswer),
      thinking: { type: "enabled" },
      reasoning_effort: "high",
      stream: false,
      max_tokens: 2200,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || "DeepSeek 请求失败。");
  }
  const grading = payload?.choices?.[0]?.message?.content?.trim();
  if (!grading) {
    throw new Error("DeepSeek 未返回批改内容。");
  }
  return {
    grading,
    score: extractScoreFromGrading(grading),
    isCorrect: inferCorrectFromScore(extractScoreFromGrading(grading)),
    model: payload.model || DEEPSEEK_MODEL,
    usage: payload.usage || null,
  };
}

async function requestAiExplanation() {
  if (!currentQuestion) return;
  const cached = state.aiExplanations?.[currentQuestion.id];
  if (cached?.content) {
    if (aiExplanationPanel.classList.contains("hidden")) {
      renderAiExplanation(currentQuestion, { showCached: true });
    } else {
      aiExplanationPanel.classList.add("hidden");
    }
    return;
  }
  const apiKey = getSavedApiKey();

  aiExplainBtn.disabled = true;
  aiExplainBtn.textContent = "生成中...";
  aiExplanationPanel.classList.remove("hidden");
  aiExplanationMeta.textContent = "";
  aiExplanationContent.innerHTML = "<p class=\"muted\">正在生成详细解析。</p>";

  try {
    let streamedContent = "";
    const payload = await fetchAiExplanation(buildAiQuestionPayload(currentQuestion), apiKey, (chunk) => {
      streamedContent += chunk;
      aiExplanationContent.innerHTML = formatAiExplanation(streamedContent);
      enhanceRichContent(aiExplanationContent);
    });
    state.aiExplanations[currentQuestion.id] = {
      content: payload.explanation || streamedContent,
      model: payload.model || "",
      createdAt: Date.now(),
    };
    persist();
    renderAiExplanation(currentQuestion, { showCached: true });
  } catch (error) {
    aiExplanationMeta.textContent = "请求失败";
    aiExplanationContent.innerHTML = `<p class="muted">${escapeHtml(error.message || "AI 解析请求失败。")}</p>`;
    aiExplainBtn.disabled = false;
    aiExplainBtn.textContent = "AI 解析";
  }
}

async function fetchAiExplanation(questionPayload, apiKey, onChunk) {
  if (shouldPreferLocalProxy()) {
    try {
      return await fetchLocalAiExplanation(questionPayload, apiKey, onChunk);
    } catch (error) {
      if (!apiKey || !(error instanceof TypeError)) {
        throw error;
      }
    }
  }
  return fetchDeepSeekDirect(questionPayload, apiKey, onChunk);
}

async function fetchLocalAiExplanation(questionPayload, apiKey, onChunk) {
  const response = await fetch(LOCAL_AI_EXPLAIN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey,
        question: questionPayload,
      }),
  });
  if ([404, 405, 501].includes(response.status)) {
    throw new TypeError("Local AI proxy is unavailable");
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "AI 解析请求失败。");
  }
  if (response.headers.get("Content-Type")?.includes("text/event-stream") && response.body) {
    return readDeepSeekStream(response, onChunk);
  }
  const payload = await response.json().catch(() => ({}));
  return payload;
}

async function fetchDeepSeekDirect(questionPayload, apiKey, onChunk) {
  if (!apiKey) {
    throw new Error("请先在网页左侧 AI 设置中填写并保存 DeepSeek API Key。");
  }
  const response = await fetch(DEEPSEEK_CHAT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: buildDeepSeekMessages(questionPayload),
      thinking: { type: "enabled" },
      reasoning_effort: "high",
      stream: true,
    }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error?.message || "DeepSeek 请求失败。");
  }
  return readDeepSeekStream(response, onChunk);
}

async function readDeepSeekStream(response, onChunk) {
  if (!response.body) {
    throw new Error("当前浏览器不支持流式输出。");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let explanation = "";
  let model = DEEPSEEK_MODEL;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) return;
      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") return;
      let payload;
      try {
        payload = JSON.parse(data);
      } catch {
        return;
      }
      if (payload.model) model = payload.model;
      const delta = payload.choices?.[0]?.delta?.content || "";
      if (!delta) return;
      explanation += delta;
      onChunk?.(delta);
    });
  }

  const tail = buffer.trim();
  if (tail.startsWith("data:")) {
    const data = tail.slice(5).trim();
    if (data && data !== "[DONE]") {
      try {
        const payload = JSON.parse(data);
        const delta = payload.choices?.[0]?.delta?.content || "";
        if (payload.model) model = payload.model;
        if (delta) {
          explanation += delta;
          onChunk?.(delta);
        }
      } catch {
        // Ignore incomplete trailing SSE fragments.
      }
    }
  }

  if (!explanation) {
    throw new Error("DeepSeek 未返回解析内容。");
  }
  return {
    explanation: explanation.trim(),
    model,
    usage: null,
  };
}

function shouldPreferLocalProxy() {
  return window.location.protocol === "file:"
    || window.location.hostname === "127.0.0.1"
    || window.location.hostname === "localhost";
}

function buildAiQuestionPayload(question) {
  const choiceContent = question.kind === "choice"
    ? splitChoiceContent(question)
    : {
        promptHtml: `${question.promptHtml || ""}${question.optionsHtml || ""}`,
        optionsHtml: "",
      };
  const materialSplit = splitMaterialFromPrompt(choiceContent.promptHtml || "", question);
  const promptHtml = materialSplit.promptHtml || choiceContent.promptHtml || question.promptHtml || "";
  const materialHtml = materialSplit.materialHtml || "";
  const optionsHtml = choiceContent.optionsHtml || "";
  const options = question.kind === "choice"
    ? Object.entries(getQuestionOptions(question, choiceContent.optionsHtml)).map(([label, html]) => ({
        label,
        text: stripHtml(html),
      }))
    : [];

  return {
    id: question.id,
    subject: question.subject,
    section: question.section,
    kind: question.kind,
    source: question.source || "",
    label: question.label || question.number || "",
    materialText: stripHtml(materialHtml),
    promptText: stripHtml(promptHtml),
    promptHtml,
    materialHtml,
    optionsHtml,
    imageRefs: extractQuestionImageRefs(`${materialHtml}${promptHtml}${optionsHtml}${question.answerHtml || ""}${question.explanationHtml || ""}`),
    options,
    answerText: stripHtml(question.answerHtml) || question.answerText || "",
    answerHtml: question.answerHtml || "",
    existingExplanationText: stripHtml(question.explanationHtml),
    explanationHtml: question.explanationHtml || "",
  };
}

function extractQuestionImageRefs(html) {
  return [...String(html || "").matchAll(/<img\b[^>]*src="([^"]+)"[^>]*>/g)]
    .map((match) => ({
      src: match[1],
      alt: (match[0].match(/\balt="([^"]*)"/) || [])[1] || "",
    }))
    .filter((item, index, items) => item.src && items.findIndex((other) => other.src === item.src) === index);
}

function buildDeepSeekMessages(question) {
  return [
    {
      role: "system",
      content: [
        "你是一名高中老师，正在给高三学生讲期中题。",
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
        "数学式、物理式和化学式用 LaTeX 写：行内放在 $...$ 中，单独成行的放在 $$...$$ 中（化学式用 \\mathrm{...}）。",
      ].join("\n"),
    },
    {
      role: "user",
      content: buildDeepSeekPrompt(question),
    },
  ];
}

function buildDeepSeekPrompt(question) {
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
    question.imageRefs?.length
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

function buildDeepSeekGradingMessages(question, studentAnswer) {
  return [
    {
      role: "system",
      content: [
        "你是一名高中老师，正在批改高三期中题库中的主观题。",
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
        buildDeepSeekPrompt(question),
        "",
        `学生答案：\n${truncateText(studentAnswer, 8000)}`,
      ].join("\n"),
    },
  ];
}

function extractScoreFromGrading(text) {
  const match = String(text || "").match(/得分[：:\s]*([0-9]{1,3})(?:\s*\/\s*100)?/);
  if (!match) return null;
  const score = Number(match[1]);
  return Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : null;
}

function inferCorrectFromScore(score) {
  return typeof score === "number" ? score >= 80 : null;
}

function resultFromAiGrade(isCorrect, score) {
  if (isCorrect === true) return true;
  if (typeof score === "number" && score >= 40) return "partial";
  return isCorrect === false || typeof score === "number" ? false : null;
}

function truncateText(value, maxLength) {
  const text = String(value || "");
  return text.length > maxLength ? `${clipText(text, maxLength)}...` : text;
}

// Cut plain text to about maxLength characters without splitting a \( … \) formula.
function clipText(text, maxLength) {
  if (text.length <= maxLength) return text;
  let end = maxLength;
  // The last formula opened before the cut is unfinished unless a "\)" ends inside the kept part.
  const open = text.lastIndexOf("\\(", end - 2);
  if (open !== -1 && text.lastIndexOf("\\)", end - 2) < open) {
    const close = text.indexOf("\\)", open);
    end = close === -1 ? open : close + 2;
  }
  return text.slice(0, end);
}

function formatAiExplanation(content) {
  // Display math may span lines, so lift it out before the line-by-line Markdown pass.
  const displayMath = [];
  const source = String(content || "")
    .replace(/\r\n/g, "\n")
    .replace(/\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]/g, (_, dollar, bracket) => {
      displayMath.push(`\\[${escapeHtml((dollar ?? bracket).trim())}\\]`);
      return `\n@@MATH${displayMath.length - 1}@@\n`;
    });
  return formatMarkdownLines(source).replace(/@@MATH(\d+)@@/g, (_, index) => displayMath[Number(index)]);
}

function formatMarkdownLines(source) {
  const lines = source.split("\n");
  const html = [];
  let paragraph = [];
  let listItems = [];
  let codeLines = [];
  let inCodeBlock = false;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${renderInlineMarkdown(paragraph.join("\n")).replace(/\n/g, "<br/>")}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!listItems.length) return;
    html.push(`<ul>${listItems.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join("")}</ul>`);
    listItems = [];
  };
  const flushCode = () => {
    html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
    codeLines = [];
  };

  lines.forEach((line) => {
    if (/^\s*```/.test(line)) {
      if (inCodeBlock) {
        flushCode();
        inCodeBlock = false;
      } else {
        flushParagraph();
        flushList();
        inCodeBlock = true;
      }
      return;
    }
    if (inCodeBlock) {
      codeLines.push(line);
      return;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = Math.min(heading[1].length + 2, 5);
      html.push(`<h${level}>${renderInlineMarkdown(heading[2].trim())}</h${level}>`);
      return;
    }

    const list = line.match(/^\s*(?:[-*+]|\d+[.)])\s+(.+)$/);
    if (list) {
      flushParagraph();
      listItems.push(list[1].trim());
      return;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      return;
    }
    paragraph.push(line);
  });

  if (inCodeBlock) flushCode();
  flushParagraph();
  flushList();
  return html.join("");
}

function renderInlineMarkdown(value) {
  let html = escapeHtml(value);
  const codeSpans = [];
  html = html.replace(/`([^`]+)`/g, (_, code) => {
    const token = `@@CODE${codeSpans.length}@@`;
    codeSpans.push(`<code>${code}</code>`);
    return token;
  });
  // Keep inline math away from the * and _ rules; AI answers write it as $…$ or \(…\).
  html = html.replace(/\\\((.+?)\\\)|\$([^$\n]+?)\$/g, (_, paren, dollar) => {
    const token = `@@CODE${codeSpans.length}@@`;
    codeSpans.push(`\\(${paren ?? dollar}\\)`);
    return token;
  });
  html = html
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>");
  codeSpans.forEach((code, index) => {
    html = html.replace(`@@CODE${index}@@`, code);
  });
  return html;
}

function chooseQuestion() {
  const subjectQuestions = getCurrentSubjectQuestions({ filtered: true });
  if (!subjectQuestions.length) return null;

  if (state.order === "sequential") {
    const cursor = state.sequenceCursor[state.currentSubject] || 0;
    const question = subjectQuestions[cursor % subjectQuestions.length] || null;
    state.sequenceCursor[state.currentSubject] = (cursor + 1) % subjectQuestions.length;
    return question;
  }

  if (state.order === "shuffled") {
    return chooseShuffledCycleQuestion(subjectQuestions);
  }

  const weighted = subjectQuestions.map((question) => {
    const progress = getProgressFor(question.id);
    let weight = 1;
    if (state.order === "wrong-priority") {
      if (state.wrongBook.includes(question.id)) {
        weight += isReviewDue(progress) ? 10 : 1;
      }
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
      acc.partial += progress.partial || 0;
      if (state.wrongBook.includes(question.id) && isReviewDue(progress)) acc.due += 1;
      if (getWrongReviewLevel(progress) >= 3) acc.highRisk += 1;
      if (getWrongReviewLevel(progress) > 0) acc.review += 1;
      return acc;
    },
    { seen: 0, correct: 0, wrong: 0, partial: 0, highRisk: 0, review: 0, due: 0 },
  );
  const accuracy = getAccuracy(subjectStats);

  statsGrid.innerHTML = [
    statCard("当前学科", state.currentSubject),
    statCard("题目总数", String(subjectQuestions.length)),
    statCard("出现次数", String(subjectStats.seen)),
    statCard("正确率", `${accuracy}%`),
    statCard("答对", String(subjectStats.correct)),
    statCard("答错/部分对", `${subjectStats.wrong}/${subjectStats.partial}`),
    statCard("错题本", String(subjectStats.review)),
    statCard("今日待复习", String(subjectStats.due)),
  ].join("");
}

function renderQuestionLedger() {
  if (!questionLedger || !ledgerSummary || state.activeView !== "ledger") return;
  renderTopicMastery();
  const topic = getCurrentTopic();
  const questions = getCurrentSubjectQuestions().filter((question) => !topic || getQuestionTopic(question) === topic);
  const answered = questions.filter((question) => getAttempts(getProgressFor(question.id)) > 0).length;
  const wrongCount = questions.filter((question) => state.wrongBook.includes(question.id)).length;
  const totalAttempts = questions.reduce((sum, question) => sum + getAttempts(getProgressFor(question.id)), 0);

  ledgerSummary.innerHTML = [
    `<span>${topic ? escapeHtml(topic) : "全部考点"} · 题目 ${questions.length}</span>`,
    `<span>已答 ${answered}</span>`,
    `<span>错题 ${wrongCount}</span>`,
    `<span>作答 ${totalAttempts}</span>`,
  ].join("");

  questionLedger.innerHTML = "";
  questions.forEach((question, index) => {
    const progress = getProgressFor(question.id);
    const accuracy = getAccuracy(progress);
    const row = document.createElement("article");
    row.className = `ledger-row ${question.id === currentQuestion?.id ? "current" : ""}`;
    const preview = escapeHtml(clipText(stripHtml(question.promptHtml), 88) || question.label);
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
  typesetMath(questionLedger);
}

function getMasteryTone(practiced, accuracy) {
  if (!practiced) return "untried";
  if (accuracy >= 85) return "good";
  if (accuracy >= 60) return "fair";
  return "weak";
}

function renderTopicMastery() {
  const current = getCurrentTopic();
  const cards = [];
  getSubjectTopics().forEach((questions, topic) => {
    const totals = questions.reduce(
      (acc, question) => {
        const progress = getProgressFor(question.id);
        if (getAttempts(progress) > 0) acc.practiced += 1;
        acc.correct += progress.correct;
        acc.wrong += progress.wrong;
        acc.partial += progress.partial || 0;
        if (state.wrongBook.includes(question.id)) {
          acc.wrongBook += 1;
          if (isReviewDue(progress)) acc.due += 1;
        }
        return acc;
      },
      { practiced: 0, correct: 0, wrong: 0, partial: 0, wrongBook: 0, due: 0 },
    );
    const accuracy = getAccuracy(totals);
    const coverage = Math.round((totals.practiced / questions.length) * 100);
    const tone = getMasteryTone(totals.practiced, accuracy);
    cards.push(`
      <button class="mastery-card mastery-${tone}${topic === current ? " active" : ""}" data-topic="${escapeHtml(topic)}">
        <strong>${escapeHtml(topic)}</strong>
        <span class="mastery-accuracy">${totals.practiced ? `${accuracy}%` : "未练"}</span>
        <span class="mastery-bar"><span style="width:${coverage}%"></span></span>
        <span class="mastery-meta">已练 ${totals.practiced}/${questions.length} · 错题 ${totals.wrongBook}${totals.due ? ` · 待复习 ${totals.due}` : ""}</span>
      </button>`);
  });
  topicMastery.innerHTML = `
    <div class="mastery-head">
      <h3>考点掌握</h3>
      <span class="muted">点击考点即可只练该考点${current ? ` · <button class="ghost-btn mastery-clear" data-topic="">看全部考点</button>` : ""}</span>
    </div>
    <div class="mastery-grid">${cards.join("")}</div>`;
  topicMastery.querySelectorAll("[data-topic]").forEach((button) => {
    button.addEventListener("click", () => {
      const topic = button.dataset.topic;
      state.topicBySubject[state.currentSubject] = topic;
      renderTopicSelect();
      if (topic) {
        switchView("practice");
      }
      applyModeChange({});
    });
  });
}

function exportProgress() {
  const payload = {
    app: "whk-quiz-site",
    storageKey: STORAGE_KEY,
    exportedAt: new Date().toISOString(),
    state,
  };
  const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
  const link = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  link.href = URL.createObjectURL(blob);
  link.download = `刷题进度-${stamp}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  backupStatus.textContent = "已导出进度文件，可在其他设备导入。";
}

async function importProgress() {
  const file = importProgressInput.files?.[0];
  importProgressInput.value = "";
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    const imported = payload?.state;
    if (payload?.app !== "whk-quiz-site" || !imported || typeof imported.stats !== "object") {
      throw new Error("不是本站导出的进度文件");
    }
    const answeredCount = Object.values(imported.stats).filter((progress) => getAttempts({ partial: 0, ...progress }) > 0).length;
    if (!window.confirm(`导入将覆盖本设备当前的进度（文件中有 ${answeredCount} 道已作答题目）。确定导入？`)) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrateMode({ ...structuredClone(defaultProgress), ...imported })));
    window.location.reload();
  } catch (error) {
    backupStatus.textContent = `导入失败：${error.message || "文件无法读取"}`;
  }
}

function getAnswerReviewQuestions() {
  const topic = getCurrentTopic();
  const query = answerReviewSearch.value.trim().toLowerCase();
  return getCurrentSubjectQuestions().filter((question) => {
    if (topic && getQuestionTopic(question) !== topic) return false;
    if (!query) return true;
    const haystack = `${question.label} ${getQuestionTopic(question)} ${stripHtml(question.promptHtml)} ${stripHtml(question.optionsHtml)} ${stripHtml(question.answerHtml)}`;
    return haystack.toLowerCase().includes(query);
  });
}

function renderAnswerReview() {
  if (state.activeView !== "answer-review") return;
  if (!answerReviewList || !answerReviewSummary) return;
  const questions = getAnswerReviewQuestions();
  const topic = getCurrentTopic();
  answerReviewList.classList.toggle("covered", Boolean(state.coverAnswers));
  answerReviewPlainText.classList.toggle("hidden", Boolean(state.coverAnswers));
  answerReviewCoverBtn.classList.toggle("active", Boolean(state.coverAnswers));
  answerReviewCoverBtn.textContent = state.coverAnswers ? "显示全部答案" : "遮住答案自测";
  const choiceCount = questions.filter((question) => question.kind === "choice").length;
  const subjectiveCount = questions.length - choiceCount;
  const missingCount = questions.filter((question) => getAnswerReviewItem(question).missing).length;
  const groups = groupQuestionsForAnswerReview(questions);

  answerReviewSummary.innerHTML = [
    `<span>${state.currentSubject}${topic ? ` · ${escapeHtml(topic)}` : ""}</span>`,
    `<span>共 ${questions.length} 题</span>`,
    `<span>选择 ${choiceCount}</span>`,
    `<span>主观 ${subjectiveCount}</span>`,
    missingCount ? `<span>待补 ${missingCount}</span>` : "",
  ].join("");
  answerReviewCopyStatus.textContent = "";
  answerReviewPlainText.value = buildAnswerReviewText();

  answerReviewList.innerHTML = "";
  if (!questions.length) {
    answerReviewList.innerHTML = `<p class="muted">没有符合条件的题目。</p>`;
    copyAnswerReviewBtn.disabled = true;
    return;
  }
  copyAnswerReviewBtn.disabled = false;

  groups.forEach((group) => {
    const section = document.createElement("section");
    section.className = "answer-review-group";
    section.innerHTML = `<h3>${escapeHtml(group.title)}</h3>`;

    const list = document.createElement("div");
    list.className = "answer-review-items";
    group.questions.forEach((question) => {
      const answer = getAnswerReviewItem(question);
      const item = document.createElement("article");
      item.className = `answer-review-item ${question.kind === "choice" ? "choice-answer" : "subjective-answer"}`;
      item.innerHTML = `
        <div class="answer-review-index">${escapeHtml(question.label || question.number || "")}</div>
        <div class="answer-review-main">
          <div class="answer-review-title">
            <strong>${escapeHtml(question.label || question.number || "题目")}</strong>
            <span>${question.kind === "choice" ? "选择题" : "主观题"}</span>
          </div>
          ${answer.keywords.length ? `<div class="answer-keywords">${answer.keywords.map((keyword) => `<span>${escapeHtml(keyword)}</span>`).join("")}</div>` : ""}
          <div class="answer-review-answer">${renderMarkdownBlock(answer.displayAnswer)}</div>
          ${answer.options.length ? `<div class="answer-review-options">${renderInlineMarkdown(answer.options.join("；"))}</div>` : ""}
          ${answer.briefPrompt ? `<div class="answer-review-prompt">${renderInlineMarkdown(answer.briefPrompt)}</div>` : ""}
          <details class="answer-review-analysis"><summary>详细解析</summary><div class="analysis-slot"></div></details>
        </div>
      `;
      const details = item.querySelector(".answer-review-analysis");
      details.addEventListener("toggle", () => {
        const slot = details.querySelector(".analysis-slot");
        if (details.open && !slot.dataset.questionId) fillAnalysis(slot, question);
      });
      const jumpBtn = document.createElement("button");
      jumpBtn.className = "ghost-btn";
      jumpBtn.textContent = "跳到此题";
      jumpBtn.addEventListener("click", () => {
        switchView("practice");
        openNextQuestion(question);
      });
      item.appendChild(jumpBtn);
      list.appendChild(item);
    });

    section.appendChild(list);
    answerReviewList.appendChild(section);
  });
  enhanceRichContent(answerReviewList);
}

function groupQuestionsForAnswerReview(questions) {
  const groups = [];
  const groupMap = new Map();
  questions.forEach((question) => {
    const title = question.group || question.section || "未分类";
    if (!groupMap.has(title)) {
      const group = { title, questions: [] };
      groups.push(group);
      groupMap.set(title, group);
    }
    groupMap.get(title).questions.push(question);
  });
  return groups;
}

function getAnswerReviewItem(question) {
  const answerText = cleanAnswerReviewText(
    question.answerText
      || stripHtml(question.answerHtml)
      || recoverEmbeddedAnswer(question),
  );
  const choiceAnswer = question.kind === "choice" ? normalizeAnswer(answerText) : "";
  const choiceAnswerText = choiceAnswer ? getChoiceAnswerText(question, choiceAnswer) : "";
  const displayAnswer = choiceAnswer
    ? `${choiceAnswer}${choiceAnswerText ? `．${choiceAnswerText}` : ""}`
    : answerText || "题库未提供答案";
  return {
    displayAnswer: question.kind === "choice" ? `答案：${displayAnswer}` : displayAnswer,
    briefPrompt: buildAnswerReviewPrompt(question),
    keywords: buildAnswerKeywords(question),
    options: getChoiceOptionsText(question),
    missing: !answerText,
  };
}

function renderMarkdownBlock(value) {
  return formatAiExplanation(String(value || "").trim());
}

function getChoiceAnswerText(question, choiceAnswer) {
  const choiceContent = splitChoiceContent(question);
  const optionMap = getQuestionOptions(question, choiceContent.optionsHtml);
  const labels = choiceAnswer.split("");
  return labels
    .map((label) => {
      const optionText = cleanOptionText(label, stripHtml(optionMap[label] || ""));
      if (!optionText) return "";
      return labels.length === 1 ? optionText : `${label}. ${optionText}`;
    })
    .filter(Boolean)
    .join("；");
}

function getChoiceOptionsText(question) {
  if (question.kind !== "choice") return [];
  const choiceContent = splitChoiceContent(question);
  const optionMap = getQuestionOptions(question, choiceContent.optionsHtml);
  return Object.entries(optionMap)
    .map(([label, html]) => {
      const optionText = cleanOptionText(label, stripHtml(html));
      return optionText ? `${label}. ${optionText}` : "";
    })
    .filter(Boolean);
}

function cleanOptionText(label, value) {
  return String(value || "")
    .replace(new RegExp(`^\\s*${label}\\s*[\\.．、]?\\s*`, "i"), "")
    .replace(/\s+/g, " ")
    .trim();
}

function recoverEmbeddedAnswer(question) {
  const text = stripHtml(`${question.promptHtml || ""}${question.optionsHtml || ""}`);
  const explicitAnswer = text.match(/答案\s*[:：]\s*(.+)$/u);
  if (explicitAnswer) {
    return explicitAnswer[1].trim();
  }

  const proof = text.match(/[\[［【]\s*(证明|证|解|解析)\s*[\]］】]\s*(.+)$/u);
  if (proof) {
    return `${proof[1]}：${proof[2].trim()}`;
  }

  const blankAnswer = text.match(/_{3,}[^。．.]*[。．.]?\s*([^\[［【]+?)\s*[\[［【]/u);
  if (blankAnswer) {
    return blankAnswer[1].trim();
  }

  return "";
}

function buildAnswerReviewPrompt(question) {
  const choiceContent = question.kind === "choice"
    ? splitChoiceContent(question)
    : {
        promptHtml: `${question.promptHtml || ""}${question.optionsHtml || ""}`,
        optionsHtml: "",
      };
  const materialSplit = splitMaterialFromPrompt(choiceContent.promptHtml || "", question);
  const promptText = stripHtml(materialSplit.promptHtml || choiceContent.promptHtml || question.promptHtml);
  return truncateText(promptText, 120);
}

function buildAnswerKeywords(question) {
  const choiceContent = question.kind === "choice"
    ? splitChoiceContent(question)
    : {
        promptHtml: `${question.promptHtml || ""}${question.optionsHtml || ""}`,
        optionsHtml: "",
      };
  const materialSplit = splitMaterialFromPrompt(choiceContent.promptHtml || "", question);
  const source = stripHtml(`${materialSplit.promptHtml || choiceContent.promptHtml || question.promptHtml} ${materialSplit.materialHtml || ""}`);
  const cleaned = source
    .replace(/[A-G]\s*[\.．、]\s*/g, " ")
    .replace(/\b\d+\s*[\.．、]\s*/g, " ")
    .replace(/[，。；：、！？“”‘’（）()[\]{}<>《》—_\-+=*/\\|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const tokens = [];
  const seen = new Set();
  const addToken = (token) => {
    const value = token.trim();
    if (!value || seen.has(value)) return;
    seen.add(value);
    tokens.push(value);
  };
  Array.from(cleaned.matchAll(/[A-Za-z][A-Za-z0-9'’\-]{3,}|[A-Z][a-z]?[\d+\-]*|[\u4e00-\u9fff]{2,8}|\d+(?:\.\d+)?(?:×10[－-]?\d+|%|个|次|mol|mL|kg|N|J|s|cm|m)?/g))
    .map((match) => match[0])
    .filter((token) => !isWeakKeyword(token))
    .sort((a, b) => scoreKeyword(b) - scoreKeyword(a))
    .forEach(addToken);
  return tokens.slice(0, 5);
}

function isWeakKeyword(token) {
  const weak = new Set([
    "下列", "正确", "错误", "的是", "关于", "根据", "答案", "最佳", "选择", "问题", "题目", "如图", "图中", "一个",
    "which", "that", "with", "from", "this", "these", "those", "there", "what", "when", "where", "would", "could", "should",
  ]);
  return weak.has(String(token || "").toLowerCase());
}

function scoreKeyword(token) {
  const value = String(token || "");
  let score = Math.min(value.length, 12);
  if (/\d/.test(value)) score += 6;
  if (/[A-Z][a-z]?[\d+\-]*/.test(value)) score += 3;
  if (/[\u4e00-\u9fff]{3,}/.test(value)) score += 2;
  return score;
}

function buildAnswerReviewText() {
  const questions = getAnswerReviewQuestions();
  const topic = getCurrentTopic();
  const lines = [`${state.currentSubject}${topic ? `·${topic}` : ""}高频背答案表`, `共 ${questions.length} 题`, ""];
  groupQuestionsForAnswerReview(questions).forEach((group) => {
    lines.push(`【${group.title}】`);
    group.questions.forEach((question) => {
      const review = getAnswerReviewItem(question);
      const answer = review.displayAnswer.replace(/^答案：/, "");
      const label = question.label || question.number || question.id;
      if (review.keywords.length) {
        lines.push(`${label}. 关键词：${review.keywords.join(" / ")}`);
      }
      lines.push(`${label}. ${answer}`);
      if (review.options.length) {
        lines.push(`   选项：${review.options.join("；")}`);
      }
    });
    lines.push("");
  });
  return latexToPlainText(lines.join("\n").trim());
}


// Formulas in the copied answer list: \(x^{2}\le 1\) → x²≤1 (tables PLAIN_COMMANDS/PLAIN_SCRIPTS at the top).
function latexToPlainText(text) {
  return String(text || "").replace(/\\\(([\s\S]*?)\\\)/g, (_, tex) => {
    let out = tex.replace(/\^\{\\circ\}/g, "°");
    for (let i = 0; i < 4; i += 1) {
      out = out
        .replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, (__, a, b) => `${wrapPlain(a)}/${wrapPlain(b)}`)
        .replace(/\\sqrt\[3\]\{([^{}]*)\}/g, (__, a) => `∛${wrapPlain(a)}`)
        .replace(/\\sqrt\{([^{}]*)\}/g, (__, a) => `√${wrapPlain(a)}`)
        .replace(/\\(?:mathrm|text)\{([^{}]*)\}/g, "$1")
        .replace(/([\^_])\{([^{}]*)\}/g, (__, mark, body) =>
          /^[\d+-]+$/.test(body) ? [...body].map((ch) => PLAIN_SCRIPTS[mark][ch]).join("") : `${mark}(${body})`);
    }
    return out
      .replace(/\\([A-Za-z]+) ?/g, (match, name) => PLAIN_COMMANDS[name] ?? (/^(?:sin|cos|tan|log|ln|lg|max|min)$/.test(name) ? name : ""))
      .replace(/\\([{}%#&$ ,])/g, (__, ch) => (ch === "," || ch === " " ? " " : ch))
      .replace(/\{\}/g, "")
      .replace(/\s+/g, " ")
      .trim();
  });
}

function wrapPlain(value) {
  return /^[\w.]+$/.test(value) ? value : `(${value})`;
}

async function copyAnswerReviewText() {
  const text = buildAnswerReviewText();
  if (!text) return;
  answerReviewPlainText.value = text;
  try {
    await navigator.clipboard.writeText(text);
    answerReviewCopyStatus.textContent = "已复制当前列表的答案。";
  } catch (error) {
    answerReviewPlainText.focus();
    answerReviewPlainText.select();
    const copied = document.execCommand("copy");
    answerReviewCopyStatus.textContent = copied
      ? "已复制当前列表的答案。"
      : "浏览器阻止自动复制，已选中下方纯文本答案。";
  }
}

function cleanAnswerText(value) {
  return String(value || "")
    .replace(/^【?答案】?\s*[:：]?/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanAnswerReviewText(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/^【?答案】?\s*[:：]?/u, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatLastSeen(value) {
  if (!value) return "未练";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未练";
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function renderNavButtons() {
  prevBtn.disabled = state.order === "sequential"
    ? !findSequentialNeighbor(-1)
    : state.historyCursor <= 0;
  nextBtn.disabled = !canGoNext();
}

function canGoNext() {
  if (state.order === "sequential") {
    return Boolean(findSequentialNeighbor(1));
  }
  if (state.historyCursor < state.questionHistory.length - 1) {
    return true;
  }
  return getCurrentSubjectQuestions({ filtered: true }).length > 0;
}

function goToPreviousQuestion() {
  if (state.order === "sequential") {
    goToSequentialOffset(-1);
    return;
  }
  if (state.historyCursor <= 0) return;
  clearAutoNext();
  state.historyCursor -= 1;
  const question = findQuestionById(state.questionHistory[state.historyCursor]);
  persist();
  openQuestion(question, { recordSeen: false, pushHistory: false });
}

function goToNextQuestion() {
  if (state.order === "sequential") {
    goToSequentialOffset(1);
    return;
  }
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

function goToSequentialOffset(offset) {
  const target = findSequentialNeighbor(offset);
  if (!target) return;
  clearAutoNext();
  const subjectQuestions = getCurrentSubjectQuestions({ filtered: true });
  state.sequenceCursor[state.currentSubject] = subjectQuestions.indexOf(target) + 1;
  openQuestion(target, { recordSeen: true, pushHistory: false });
}

// Walk the full subject order so the current question still anchors the walk
// after it drops out of the filtered pool (e.g. leaves the wrong book).
function findSequentialNeighbor(offset) {
  const allQuestions = getCurrentSubjectQuestions();
  const allowed = new Set(getCurrentSubjectQuestions({ filtered: true }).map((question) => question.id));
  const start = currentQuestion ? allQuestions.findIndex((question) => question.id === currentQuestion.id) : -1;
  if (start < 0) return null;
  for (let index = start + offset; index >= 0 && index < allQuestions.length; index += offset) {
    if (allowed.has(allQuestions[index].id)) return allQuestions[index];
  }
  return null;
}

function scrollQuestionIntoView() {
  if (state.activeView !== "practice") return;
  const top = practiceView.getBoundingClientRect().top + window.scrollY;
  const mobileBarHeight = window.matchMedia("(max-width: 1080px)").matches ? 56 : 0;
  const toolbarHeight = window.matchMedia("(max-width: 720px)").matches ? 0 : questionToolbar.offsetHeight;
  const offset = mobileBarHeight + toolbarHeight + 12;
  if (window.scrollY > top - offset) {
    window.scrollTo({ top: Math.max(0, top - offset) });
  }
}

function statCard(label, value) {
  return `<div class="stat-card"><strong>${value}</strong><span>${label}</span></div>`;
}

function getWrongReviewLevel(progress) {
  if (!progress) return 0;
  if (typeof progress.reviewLevel === "number") {
    return Math.max(0, progress.reviewLevel);
  }
  return Math.max(0, progress.wrong || 0);
}

function getWrongTier(level) {
  if (level >= 3) {
    return {
      key: "danger",
      title: "红色高危",
      label: "错 3 次以上",
      hint: "答对后隔 1 天、3 天各复习一次，三轮都答对即移出。",
    };
  }
  if (level === 2) {
    return {
      key: "focus",
      title: "重点复刷",
      label: "错 2 次",
      hint: "答对后隔 1 天、3 天各复习一次，三轮都答对即移出。",
    };
  }
  if (level === 1) {
    return {
      key: "normal",
      title: "普通错题",
      label: "错 1 次",
      hint: "答对后隔 1 天、3 天各复习一次，三轮都答对即移出。",
    };
  }
  return {
    key: "cleared",
    title: "已掌握",
    label: "已降级",
    hint: "当前不在错题强化队列。",
  };
}

function renderWrongbook() {
  cleanupWrongBook();
  const subjectQuestions = getCurrentSubjectQuestions({ filtered: true });
  const questionMap = new Map(subjectQuestions.map((question) => [question.id, question]));
  const wrongQuestions = Array.from(new Set(state.wrongBook))
    .map((id) => questionMap.get(id))
    .filter(Boolean)
    .filter((question) => getWrongReviewLevel(getProgressFor(question.id)) > 0)
    .sort((a, b) => {
      const progressA = getProgressFor(a.id);
      const progressB = getProgressFor(b.id);
      return Number(isReviewDue(progressB)) - Number(isReviewDue(progressA))
        || getWrongReviewLevel(progressB) - getWrongReviewLevel(progressA)
        || (progressB.wrong || 0) - (progressA.wrong || 0)
        || (progressB.lastSeenAt || 0) - (progressA.lastSeenAt || 0);
    });

  if (!wrongQuestions.length) {
    wrongbookList.innerHTML = `<p class="muted">当前学科还没有需要强化的错题。</p>`;
    return;
  }

  wrongbookList.innerHTML = "";
  const grouped = wrongQuestions.slice(0, 60).reduce((result, question) => {
    const tier = getWrongTier(getWrongReviewLevel(getProgressFor(question.id)));
    if (!result[tier.key]) result[tier.key] = { tier, questions: [] };
    result[tier.key].questions.push(question);
    return result;
  }, {});

  ["danger", "focus", "normal"].forEach((key) => {
    const group = grouped[key];
    if (!group) return;
    const groupEl = document.createElement("section");
    groupEl.className = `wrong-tier wrong-tier-${key}`;
    groupEl.innerHTML = `
      <div class="wrong-tier-head">
        <strong>${group.tier.title}</strong>
        <span>${group.tier.label}</span>
      </div>
      <p class="muted">${group.tier.hint}</p>
    `;
    group.questions.forEach((question) => {
    const progress = getProgressFor(question.id);
    const level = getWrongReviewLevel(progress);
    const tier = getWrongTier(level);
    const item = document.createElement("div");
    item.className = `wrong-item wrong-item-${tier.key}`;
    const promptText = stripHtml(question.promptHtml);
    const preview = escapeHtml(clipText(promptText, 46) || question.label);
    item.innerHTML = `
      <p><strong>${question.label}</strong> · ${question.section || "未分类"}</p>
      <p class="muted">${preview}${promptText.length > 46 ? "..." : ""}</p>
      <p class="muted">${formatReviewDue(progress)} · 复习进度 ${progress.reviewStep || 0}/${REVIEW_STEPS} · 累计错 ${progress.wrong} 次 / 部分对 ${progress.partial || 0} 次 / 对 ${progress.correct} 次</p>
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
      renderAnswerReview();
    });

    actionBar.appendChild(jumpBtn);
    actionBar.appendChild(removeBtn);
    item.appendChild(actionBar);
    groupEl.appendChild(item);
    });
    wrongbookList.appendChild(groupEl);
  });
  typesetMath(wrongbookList);
}

function formatReviewDue(progress) {
  const remaining = (progress.dueAt || 0) - Date.now();
  if (remaining <= 0) return "现在复习";
  const days = Math.ceil(remaining / DAY_MS);
  return days <= 1 ? "明天复习" : `${days} 天后复习`;
}

function cleanupWrongBook() {
  const allQuestionIds = new Set(questionBank.allQuestions.map((question) => question.id));
  const seen = new Set();
  const normalizedWrongIds = [];
  state.wrongBook.forEach((id) => {
    if (seen.has(id) || !allQuestionIds.has(id)) return;
    if (getWrongReviewLevel(getProgressFor(id)) <= 0) return;
    seen.add(id);
    normalizedWrongIds.push(id);
  });
  if (normalizedWrongIds.length !== state.wrongBook.length || normalizedWrongIds.some((id, index) => id !== state.wrongBook[index])) {
    state.wrongBook = normalizedWrongIds;
    persist();
  }
}

function normalizeAnswer(answerText) {
  return (answerText || "").replace(/[^A-Z]/gi, "").toUpperCase();
}

// The shuffled order covers the whole subject; the current scope only decides
// which entries are skipped, so changing scope doesn't restart the cycle.
function chooseShuffledCycleQuestion(subjectQuestions) {
  const subject = state.currentSubject;
  const allIds = getCurrentSubjectQuestions().map((question) => question.id);
  const questionMap = new Map(subjectQuestions.map((question) => [question.id, question]));
  let order = (state.shuffledOrder[subject] || []).filter((id) => allIds.includes(id));
  let cursor = state.shuffledCursor[subject] || 0;
  if (order.length !== allIds.length) {
    order = shuffleArray(allIds);
    cursor = 0;
  }

  for (let step = 0; step < order.length * 2; step += 1) {
    if (cursor >= order.length) {
      order = shuffleArray(allIds);
      cursor = 0;
    }
    const question = questionMap.get(order[cursor]);
    cursor += 1;
    if (question) {
      state.shuffledOrder[subject] = order;
      state.shuffledCursor[subject] = cursor;
      return question;
    }
  }
  return subjectQuestions[0] || null;
}

function filterQuestionsByMode(allQuestions) {
  const topic = getCurrentTopic();
  const questions = topic
    ? allQuestions.filter((question) => getQuestionTopic(question) === topic)
    : allQuestions;
  if (state.scope === "due") {
    const wrongIds = new Set(state.wrongBook);
    return questions.filter((question) => wrongIds.has(question.id) && isReviewDue(getProgressFor(question.id)));
  }
  if (state.scope === "choice") {
    return questions.filter((question) => question.kind === "choice");
  }
  if (state.scope === "wrong") {
    const wrongIds = new Set(state.wrongBook);
    return questions.filter((question) => wrongIds.has(question.id));
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
    .filter((label) => ["A", "B", "C", "D", "E", "F", "G"].includes(label))
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
  const listOptions = Array.from(wrapper.querySelectorAll("[data-option]")).reduce((result, node) => {
    const label = String(node.getAttribute("data-option") || "").trim().toUpperCase();
    if (["A", "B", "C", "D", "E", "F", "G"].includes(label)) {
      result[label] = `<p>${label}. ${node.innerHTML}</p>`;
    }
    return result;
  }, {});
  if (Object.keys(listOptions).length) {
    return listOptions;
  }
  return Array.from(wrapper.children).reduce((result, node) => {
    const html = node.outerHTML || "";
    const text = stripHtml(html);
    const match = text.match(/^\s*([A-G])\s*[\.．]/);
    if (match) {
      result[match[1]] = html;
    }
    return result;
  }, {});
}

function splitChoiceContent(question) {
  const directOptionBlocks = extractOptionBlocks(question.optionsHtml || "");
  if (Object.keys(directOptionBlocks).length >= 4) {
    const optionHtml = ["A", "B", "C", "D", "E", "F", "G"].map((label) => directOptionBlocks[label]).filter(Boolean).join("");
    return {
      promptHtml: question.promptHtml || "",
      optionsHtml: optionHtml || question.optionsHtml || "",
    };
  }

  const wrapper = document.createElement("div");
  wrapper.innerHTML = `${question.promptHtml || ""}${question.optionsHtml || ""}`;
  const promptBlocks = [];
  const optionBlocks = {};

  Array.from(wrapper.children).forEach((node) => {
    if (node.querySelector?.("[data-option]")) {
      Array.from(node.querySelectorAll("[data-option]")).forEach((optionNode) => {
        const label = String(optionNode.getAttribute("data-option") || "").trim().toUpperCase();
        if (["A", "B", "C", "D", "E", "F", "G"].includes(label)) {
          optionBlocks[label] = `<p>${label}. ${optionNode.innerHTML}</p>`;
        }
      });
      return;
    }

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

  const optionHtml = ["A", "B", "C", "D", "E", "F", "G"].map((label) => optionBlocks[label]).filter(Boolean).join("");
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
  const matches = findOptionLabelMatches(innerHtml);
  if (!matches.length) {
    return { prefixHtml: blockHtml, options: [] };
  }

  const optionStarts = chooseOptionLabelSequence(matches);

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

function findOptionLabelMatches(html) {
  return Array.from((html || "").matchAll(/(?<![A-Za-z0-9])([A-G])\s*[\.．]/g))
    .map((match) => ({
      label: match[1],
      index: match.index,
    }))
    .filter(({ index }) => index >= 0);
}

function chooseOptionLabelSequence(matches) {
  if (matches.length <= 1) return matches;
  const labelOrder = "ABCDEFG";
  let best = [];

  matches.forEach((start, startIndex) => {
    const sequence = [start];
    let expectedIndex = labelOrder.indexOf(start.label) + 1;
    for (let i = startIndex + 1; i < matches.length && expectedIndex < labelOrder.length; i += 1) {
      if (matches[i].label === labelOrder[expectedIndex]) {
        sequence.push(matches[i]);
        expectedIndex += 1;
      }
    }
    if (sequence.length > best.length) {
      best = sequence;
    }
  });

  return best.length ? best : matches;
}

function enhanceRichContent(container) {
  renderMathScripts(container);
  markFormulaImages(container);
  typesetMath(container);
}

// Formulas are LaTeX in \( … \) (inline) or \[ … \] (display), typeset by the vendored MathJax.
// Calls are queued so typesetting never overlaps; before MathJax has loaded they are skipped and
// the whole page is typeset once it is ready (window.onMathJaxReady, set in index.html's config).
function typesetMath(container) {
  if (!container || !window.MathJax?.typesetPromise) return;
  mathQueue = mathQueue
    .then(() => {
      if (!container.isConnected) return undefined;
      // Forget math from content that has since been replaced; rendered output stays on the page.
      window.MathJax.typesetClear();
      return window.MathJax.typesetPromise([container]);
    })
    .catch((error) => console.warn("MathJax:", error));
}

window.onMathJaxReady = () => typesetMath(document.body);

function renderMathScripts(container) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest(".math-inline, code, pre, textarea, button")) {
        return NodeFilter.FILTER_REJECT;
      }
      if (/\\[([]|\$\$/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
      return shouldRenderMathScripts(node.nodeValue)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    const html = renderMathScriptHtml(escapeHtml(node.nodeValue));
    if (html === escapeHtml(node.nodeValue)) return;
    const wrapper = document.createElement("span");
    wrapper.innerHTML = html;
    const fragment = document.createDocumentFragment();
    while (wrapper.firstChild) fragment.appendChild(wrapper.firstChild);
    node.parentNode.replaceChild(fragment, node);
  });
}

function shouldRenderMathScripts(text) {
  return /(?:[A-Z][A-Z′'’]*[123]|[Rrlh][23]|[a-z][01]|(?:cm|mm|m|g\/cm)[23]|oal\()/u.test(text || "");
}

function renderMathScriptHtml(html) {
  return String(html || "")
    .replace(/oal\(([^,]+),([^)]+)\)/g, "<sup>$1</sup><sub>$2</sub>")
    .replace(/\b([A-Z][A-Z′'’]{1,})([23])\b/g, "$1<sup>$2</sup>")
    .replace(/\b([Rrlh])([23])\b/g, "$1<sup>$2</sup>")
    .replace(/\b((?:cm|mm|m|g\/cm))([23])\b/g, "$1<sup>$2</sup>")
    .replace(/([A-Z])1(?=[A-Z]|[^A-Za-z0-9]|$)/g, "$1<sub>1</sub>")
    .replace(/\b([a-z])([01])\b/g, "$1<sub>$2</sub>");
}

function markFormulaImages(container) {
  container.querySelectorAll("img").forEach((image) => {
    const width = image.naturalWidth || Number(image.getAttribute("width")) || 0;
    const height = image.naturalHeight || Number(image.getAttribute("height")) || 0;
    if ((width && width <= 90) || (height && height <= 36)) {
      image.classList.add("formula-img");
    }
  });
}

function getClozeBlankLimit(question) {
  if (question.subject !== "英语") return 0;
  const section = question.section || "";
  if (/七选五/.test(section)) return 5;
  if (/完形/.test(section)) return 15;
  return 0;
}

function isLikelyClozeBlank(numberText, source, startIndex, limit) {
  const blankNumber = Number(numberText);
  if (!Number.isInteger(blankNumber) || blankNumber < 1 || blankNumber > limit) {
    return false;
  }
  const after = source.slice(startIndex + numberText.length, startIndex + numberText.length + 12);
  const left = source.slice(0, startIndex).replace(/\s+$/g, "");
  const previousChar = left.at(-1) || "";
  const charBeforePrevious = left.at(-2) || "";
  if (/\d/.test(previousChar) || (previousChar === "." && /\d/.test(charBeforePrevious))) {
    return false;
  }
  if (/^\s*[ap]\s*[.．]\s*m\b/i.test(after)) {
    return false;
  }
  return true;
}

function annotateClozeBlanks(html, question) {
  const limit = getClozeBlankLimit(question);
  if (!html || !limit) {
    return html || "";
  }
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  const currentBlank = Number(question.label || question.number);
  const walker = document.createTreeWalker(wrapper, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    const source = node.nodeValue;
    const matches = [];
    const markerPattern = /(^|[^A-Za-z0-9.])([1-9]|1[0-9]|20)(?=$|[^A-Za-z0-9.])/g;
    let match = markerPattern.exec(source);
    while (match) {
      const numberText = match[2];
      const startIndex = match.index + match[1].length;
      if (isLikelyClozeBlank(numberText, source, startIndex, limit)) {
        matches.push({ numberText, startIndex, endIndex: startIndex + numberText.length });
      }
      match = markerPattern.exec(source);
    }
    if (!matches.length) return;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    matches.forEach(({ numberText, startIndex, endIndex }) => {
      if (startIndex > lastIndex) {
        fragment.appendChild(document.createTextNode(source.slice(lastIndex, startIndex)));
      }
      const blank = document.createElement("span");
      const blankNumber = Number(numberText);
      blank.className = `cloze-blank${blankNumber === currentBlank ? " current" : ""}`;
      blank.textContent = `第 ${blankNumber} 空`;
      blank.setAttribute("data-blank", numberText);
      fragment.appendChild(blank);
      lastIndex = endIndex;
    });
    if (lastIndex < source.length) {
      fragment.appendChild(document.createTextNode(source.slice(lastIndex)));
    }
    node.parentNode.replaceChild(fragment, node);
  });
  return wrapper.innerHTML;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function splitMaterialFromPrompt(promptHtml, question = null) {
  if (question?.materialHtml) {
    return { materialHtml: question.materialHtml, promptHtml };
  }
  const wrapper = document.createElement("div");
  wrapper.innerHTML = promptHtml || "";
  const blocks = Array.from(wrapper.children);
  if (blocks.length < 2) {
    return { materialHtml: "", promptHtml };
  }

  const explicitQuestionPattern = /[\(（]\s*[\)）]\s*(\d+)\s*[\.．、]/;
  for (let index = 1; index < blocks.length; index += 1) {
    const text = stripHtml(blocks[index].outerHTML || "");
    const explicitQuestion = text.match(explicitQuestionPattern);
    if (!explicitQuestion) continue;
    const before = text.slice(0, explicitQuestion.index).trim();
    const after = text.slice(explicitQuestion.index).trim();
    const materialBlocks = blocks.slice(0, index).map((node) => node.outerHTML);
    if (before) {
      materialBlocks.push(`<p>${escapeHtml(before)}</p>`);
    }
    const materialHtml = materialBlocks.join("");
    if (stripHtml(materialHtml).length >= 120) {
      const questionHtml = [
        after ? `<p>${escapeHtml(after)}</p>` : "",
        ...blocks.slice(index + 1).map((node) => node.outerHTML),
      ].join("");
      return { materialHtml, promptHtml: questionHtml || promptHtml };
    }
  }

  const questionIndex = blocks.findIndex((node, index) => {
    if (index === 0) return false;
    const text = stripHtml(node.outerHTML || "");
    return /^\s*(?:[\(（]\s*[\)）]?\s*)?\d+\s*[\.．、]/.test(text)
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
  const restHtml = blocks.slice(1).map((node) => node.outerHTML).join("");
  // A lead paragraph followed only by figures is the question itself, not material.
  if (hasMaterialLead && stripHtml(restHtml).length >= 15) {
    return { materialHtml: blocks[0].outerHTML, promptHtml: restHtml };
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
    return migrateMode({ ...structuredClone(defaultProgress), ...(saved || {}) });
  } catch (error) {
    return structuredClone(defaultProgress);
  }
}

function migrateMode(progress) {
  const legacy = {
    "subject-random": { scope: "all", order: "random" },
    "choice-only": { scope: "choice", order: "random" },
    sequential: { scope: "all", order: "sequential" },
    "shuffled-cycle": { scope: "all", order: "shuffled" },
    "wrong-priority": { scope: "all", order: "wrong-priority" },
    "wrong-only": { scope: "wrong", order: "random" },
  }[progress.mode];
  if (legacy) Object.assign(progress, legacy);
  delete progress.mode;
  progress.topicBySubject = progress.topicBySubject || {};
  return progress;
}

function findQuestionById(id) {
  return questionBank.allQuestions.find((question) => question.id === id) || null;
}
