const REPO_OWNER = "kkhassou";
const REPO_NAME = "kanagawaken-yokohamashi-kanagawaku-issue";
const PER_PAGE = 20;

let allIssues = [];
let currentPage = 1;
let currentCategory = "all";
let currentStatus = "all";

async function fetchAllIssues() {
  const issues = [];
  for (const state of ["open", "closed"]) {
    let page = 1;
    while (true) {
      const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues?state=${state}&per_page=100&page=${page}`;
      const res = await fetch(url);
      if (!res.ok) break;
      const data = await res.json();
      if (data.length === 0) break;
      // pull_request プロパティを持つものは除外（PRはIssueではない）
      issues.push(...data.filter((i) => !i.pull_request));
      if (data.length < 100) break;
      page++;
    }
  }
  return issues;
}

function getLabelColor(label) {
  const colorMap = {
    安全: { bg: "#fce4ec", color: "#c62828" },
    "街灯・照明": { bg: "#fff3e0", color: "#e65100" },
    "道路・歩道": { bg: "#e8eaf6", color: "#283593" },
    "カーブミラー・標識": { bg: "#f3e5f5", color: "#6a1b9a" },
    "公園・緑地": { bg: "#e8f5e9", color: "#2e7d32" },
    "ゴミ・不法投棄": { bg: "#efebe9", color: "#4e342e" },
    その他: { bg: "#f5f5f5", color: "#616161" },
  };
  return colorMap[label] || { bg: `#${label}`, color: "#333" };
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

function extractBodyPreview(body) {
  if (!body) return "";
  // Issue template のフィールドラベルを除去してプレビュー用テキストを生成
  const cleaned = body
    .replace(/### .+/g, "")
    .replace(/<!--.*?-->/gs, "")
    .replace(/_No response_/g, "")
    .trim();
  return cleaned.length > 200 ? cleaned.substring(0, 200) + "..." : cleaned;
}

function getFilteredIssues() {
  return allIssues.filter((issue) => {
    if (currentStatus !== "all" && issue.state !== currentStatus) return false;
    if (currentCategory !== "all") {
      const hasCategory = issue.labels.some((l) =>
        l.name.includes(currentCategory),
      );
      if (!hasCategory) return false;
    }
    return true;
  });
}

function updateStats() {
  const open = allIssues.filter(
    (i) => i.state === "open" && !i.pull_request,
  ).length;
  const closed = allIssues.filter(
    (i) => i.state === "closed" && !i.pull_request,
  ).length;
  document.getElementById("total-count").textContent = allIssues.length;
  document.getElementById("open-count").textContent = open;
  document.getElementById("closed-count").textContent = closed;
}

function renderIssues() {
  const listEl = document.getElementById("issues-list");
  const filtered = getFilteredIssues();

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div class="no-issues">
        <p>該当する困りごとはありません</p>
      </div>`;
    document.getElementById("pagination").innerHTML = "";
    return;
  }

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * PER_PAGE;
  const pageIssues = filtered.slice(start, start + PER_PAGE);

  listEl.innerHTML = pageIssues
    .map((issue) => {
      const labelsHtml = issue.labels
        .map((label) => {
          const colors = getLabelColor(label.name);
          return `<span class="issue-label" style="background:${colors.bg};color:${colors.color}">${label.name}</span>`;
        })
        .join("");

      const statusClass = issue.state === "open" ? "open" : "closed";
      const statusText = issue.state === "open" ? "対応待ち" : "対応済み";

      return `
      <article class="issue-card">
        <div class="issue-header">
          <span class="issue-title">${escapeHtml(issue.title)}</span>
          <span class="issue-status ${statusClass}">${statusText}</span>
        </div>
        <div class="issue-labels">${labelsHtml}</div>
        <div class="issue-body">${escapeHtml(extractBodyPreview(issue.body))}</div>
        <div class="issue-meta">
          <span>報告日: ${formatDate(issue.created_at)}</span>
          <span>#${issue.number}</span>
        </div>
      </article>`;
    })
    .join("");

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const pagEl = document.getElementById("pagination");
  if (totalPages <= 1) {
    pagEl.innerHTML = "";
    return;
  }

  let html = "";
  html += `<button ${currentPage === 1 ? "disabled" : ""} onclick="goToPage(${currentPage - 1})">前へ</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="${i === currentPage ? "active" : ""}" onclick="goToPage(${i})">${i}</button>`;
  }
  html += `<button ${currentPage === totalPages ? "disabled" : ""} onclick="goToPage(${currentPage + 1})">次へ</button>`;
  pagEl.innerHTML = html;
}

function goToPage(page) {
  currentPage = page;
  renderIssues();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Event Listeners
document.getElementById("category-filter").addEventListener("change", (e) => {
  currentCategory = e.target.value;
  currentPage = 1;
  renderIssues();
});

document.getElementById("status-filter").addEventListener("change", (e) => {
  currentStatus = e.target.value;
  currentPage = 1;
  renderIssues();
});

// Init
async function init() {
  const loadingEl = document.getElementById("loading");
  try {
    allIssues = await fetchAllIssues();
    updateStats();
    loadingEl.remove();
    renderIssues();
  } catch (err) {
    loadingEl.innerHTML = `<div class="error-message">データの読み込みに失敗しました。しばらくしてからもう一度お試しください。</div>`;
    console.error("Failed to fetch issues:", err);
  }
}

init();
