/**
 * Google Form → GitHub Issue 自動連携スクリプト
 *
 * セットアップ手順:
 * 1. Google Form を作成し、以下の質問を追加:
 *    - カテゴリ（プルダウン）: 安全, 街灯・照明, 道路・歩道, カーブミラー・標識, 公園・緑地, ゴミ・不法投棄, その他
 *    - 困りごとの内容（段落）
 *    - 場所（記述式）
 *    - 写真URL（記述式・任意）
 *
 * 2. スクリプトエディタ（拡張機能 > Apps Script）で、このコードを貼り付け
 *
 * 3. スクリプトプロパティに以下を設定:
 *    - GITHUB_TOKEN: GitHub Personal Access Token (repo スコープが必要)
 *    - REPO_OWNER: GitHub ユーザー名 (例: kkhassou)
 *    - REPO_NAME: リポジトリ名 (例: kanagawaken-yokohamashi-kanagawaku-issue)
 *
 * 4. トリガーを設定:
 *    - 関数: onFormSubmit
 *    - イベント: フォームから > フォーム送信時
 */

// カテゴリとラベルの対応
const CATEGORY_LABEL_MAP = {
  安全: "安全",
  "街灯・照明": "街灯・照明",
  "道路・歩道": "道路・歩道",
  "カーブミラー・標識": "カーブミラー・標識",
  "公園・緑地": "公園・緑地",
  "ゴミ・不法投棄": "ゴミ・不法投棄",
  その他: "その他",
};

/**
 * フォーム送信時に呼ばれるトリガー関数
 */
function onFormSubmit(e) {
  try {
    const responses = e.response.getItemResponses();

    // フォームの回答を取得
    const category = responses[0].getResponse(); // カテゴリ
    const description = responses[1].getResponse(); // 困りごとの内容
    const location = responses[2].getResponse(); // 場所
    const photoUrl = responses.length > 3 ? responses[3].getResponse() : ""; // 写真URL（任意）

    // Issue のタイトルとボディを作成
    const title = `[報告] ${category} - ${location}`;
    const body = buildIssueBody(category, description, location, photoUrl);

    // ラベルを決定
    const labels = ["フォーム投稿"];
    const label = CATEGORY_LABEL_MAP[category];
    if (label) {
      labels.push(label);
    }

    // GitHub Issue を作成
    createGitHubIssue(title, body, labels);

    Logger.log(`Issue created: ${title}`);
  } catch (error) {
    Logger.log(`Error: ${error.message}`);
    // エラー通知（任意）
    sendErrorNotification(error);
  }
}

/**
 * Issue のボディを組み立てる
 */
function buildIssueBody(category, description, location, photoUrl) {
  let body = "";

  body += `## カテゴリ\n${category}\n\n`;
  body += `## 困りごとの内容\n${description}\n\n`;
  body += `## 場所\n${location}\n\n`;

  if (photoUrl) {
    body += `## 写真\n${photoUrl}\n\n`;
  }

  body += `---\n`;
  body += `*この Issue は Google フォームからの投稿により自動作成されました*\n`;

  return body;
}

/**
 * GitHub API を使って Issue を作成する
 */
function createGitHubIssue(title, body, labels) {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty("GITHUB_TOKEN");
  const owner = props.getProperty("REPO_OWNER");
  const repo = props.getProperty("REPO_NAME");

  if (!token || !owner || !repo) {
    throw new Error(
      "スクリプトプロパティに GITHUB_TOKEN, REPO_OWNER, REPO_NAME を設定してください",
    );
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/issues`;

  const payload = {
    title: title,
    body: body,
    labels: labels,
  };

  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, options);
  const statusCode = response.getResponseCode();

  if (statusCode !== 201) {
    throw new Error(
      `GitHub API error (${statusCode}): ${response.getContentText()}`,
    );
  }

  return JSON.parse(response.getContentText());
}

/**
 * エラー通知（ログに記録）
 */
function sendErrorNotification(error) {
  Logger.log(`[ERROR] ${new Date().toISOString()}: ${error.message}`);
}

/**
 * テスト用: 手動で Issue 作成を試す
 */
function testCreateIssue() {
  createGitHubIssue(
    "[テスト] 動作確認",
    "これはテスト Issue です。\n\n## 場所\nテスト\n\n---\n*テスト投稿*",
    ["その他", "フォーム投稿"],
  );
}
