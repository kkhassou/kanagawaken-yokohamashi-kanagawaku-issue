/**
 * ========================================
 * 一括セットアップスクリプト
 * ========================================
 *
 * このスクリプト1つで以下をすべて自動実行します：
 *   1. Google フォームの作成
 *   2. フォーム送信 → GitHub Issue 連携スクリプトの設置
 *   3. トリガーの設定
 *
 * ■ 使い方:
 *   1. https://script.google.com で新規プロジェクトを作成
 *   2. このファイルの内容をすべてコピー＆ペースト
 *   3. 下の設定セクションの GITHUB_TOKEN を入力
 *   4. setupAll() を実行（初回は権限の承認が求められます）
 *   5. ログに表示されるフォームURLをコピーして完了！
 *
 * ■ 権限について:
 *   初回実行時に以下の権限を求められます：
 *   - Google フォームの作成・編集
 *   - 外部サービスへの接続（GitHub API）
 *   - トリガーの管理
 * ========================================
 */

// ============================================================
// ■ 設定（ここだけ編集してください）
// ============================================================
const CONFIG = {
  GITHUB_TOKEN: "YOUR_GITHUB_TOKEN_HERE", // ← ここにGitHub PATを入力
  REPO_OWNER: "kkhassou",
  REPO_NAME: "kanagawaken-yokohamashi-kanagawaku-issue",
  FORM_TITLE: "神奈川区 地域の困りごと報告フォーム",
  FORM_DESCRIPTION:
    "神奈川県横浜市神奈川区の地域で感じる困りごとを報告するフォームです。\n" +
    "投稿された内容は自動的に GitHub Issue として登録され、対応状況を公開ページで確認できます。\n\n" +
    "公開ページ: https://kkhassou.github.io/kanagawaken-yokohamashi-kanagawaku-issue/",
};

// カテゴリ一覧
const CATEGORIES = [
  "安全（手すり・ガードレール等）",
  "街灯・照明",
  "道路・歩道",
  "カーブミラー・標識",
  "公園・緑地",
  "ゴミ・不法投棄",
  "その他",
];

// カテゴリ → GitHub ラベルの対応
const CATEGORY_LABEL_MAP = {
  "安全（手すり・ガードレール等）": "安全",
  "街灯・照明": "街灯・照明",
  "道路・歩道": "道路・歩道",
  "カーブミラー・標識": "カーブミラー・標識",
  "公園・緑地": "公園・緑地",
  "ゴミ・不法投棄": "ゴミ・不法投棄",
  その他: "その他",
};

// ============================================================
// ■ メイン: setupAll() を実行してください
// ============================================================

/**
 * すべてのセットアップを一括実行
 */
function setupAll() {
  Logger.log("========================================");
  Logger.log("セットアップを開始します");
  Logger.log("========================================");

  // バリデーション
  if (
    CONFIG.GITHUB_TOKEN === "YOUR_GITHUB_TOKEN_HERE" ||
    !CONFIG.GITHUB_TOKEN
  ) {
    throw new Error(
      "GITHUB_TOKEN を設定してください。CONFIG.GITHUB_TOKEN を編集してください。",
    );
  }

  // Step 1: フォーム作成
  Logger.log("\n[Step 1/3] フォームを作成中...");
  const form = createForm();
  const formUrl = form.getPublishedUrl();
  const formEditUrl = form.getEditUrl();
  Logger.log("  フォーム作成完了！");
  Logger.log("  回答用URL: " + formUrl);
  Logger.log("  編集用URL: " + formEditUrl);

  // Step 2: スクリプトプロパティ設定
  Logger.log("\n[Step 2/3] スクリプトプロパティを設定中...");
  setupScriptProperties();
  Logger.log("  スクリプトプロパティ設定完了！");

  // Step 3: トリガー設定
  Logger.log("\n[Step 3/3] トリガーを設定中...");
  setupTrigger(form);
  Logger.log("  トリガー設定完了！");

  // 完了
  Logger.log("\n========================================");
  Logger.log("セットアップ完了！");
  Logger.log("========================================");
  Logger.log("");
  Logger.log("■ フォーム回答URL（これを住民に共有してください）:");
  Logger.log(formUrl);
  Logger.log("");
  Logger.log("■ フォーム編集URL:");
  Logger.log(formEditUrl);
  Logger.log("");
  Logger.log("■ 公開ビューア:");
  Logger.log(
    "https://kkhassou.github.io/kanagawaken-yokohamashi-kanagawaku-issue/",
  );
  Logger.log("");
  Logger.log(
    "■ 次のステップ: フォームからテスト投稿して、GitHub Issue が作成されることを確認してください",
  );
}

// ============================================================
// ■ Step 1: フォーム作成
// ============================================================

function createForm() {
  const form = FormApp.create(CONFIG.FORM_TITLE);
  form.setDescription(CONFIG.FORM_DESCRIPTION);
  form.setConfirmationMessage(
    "報告ありがとうございます！\n" +
      "投稿内容は自動的に登録されます。\n" +
      "対応状況は公開ページでご確認いただけます。",
  );
  form.setAllowResponseEdits(false);
  form.setLimitOneResponsePerUser(false);
  form.setProgressBar(false);

  // 質問1: カテゴリ（プルダウン）
  const categoryItem = form.addListItem();
  categoryItem.setTitle("困りごとのカテゴリ");
  categoryItem.setHelpText("該当するカテゴリを選んでください");
  categoryItem.setRequired(true);
  categoryItem.setChoices(CATEGORIES.map((c) => categoryItem.createChoice(c)));

  // 質問2: 困りごとの内容（段落）
  const descriptionItem = form.addParagraphTextItem();
  descriptionItem.setTitle("困りごとの内容");
  descriptionItem.setHelpText(
    "どのような困りごとがあるか、できるだけ詳しく教えてください\n" +
      "例：○○交差点の角に手すりがなく、高齢者が転倒しそうで危ない",
  );
  descriptionItem.setRequired(true);

  // 質問3: 場所（記述式）
  const locationItem = form.addTextItem();
  locationItem.setTitle("場所");
  locationItem.setHelpText(
    "住所や目印を教えてください\n" + "例：神奈川区○○町1丁目 △△交差点付近",
  );
  locationItem.setRequired(true);

  // 質問4: 写真URL（記述式・任意）
  const photoItem = form.addTextItem();
  photoItem.setTitle("写真URL（任意）");
  photoItem.setHelpText(
    "写真がある場合は、Google Drive やクラウドにアップロードした共有URLを貼り付けてください",
  );
  photoItem.setRequired(false);

  return form;
}

// ============================================================
// ■ Step 2: スクリプトプロパティ設定
// ============================================================

function setupScriptProperties() {
  const props = PropertiesService.getScriptProperties();
  props.setProperties({
    GITHUB_TOKEN: CONFIG.GITHUB_TOKEN,
    REPO_OWNER: CONFIG.REPO_OWNER,
    REPO_NAME: CONFIG.REPO_NAME,
  });
}

// ============================================================
// ■ Step 3: トリガー設定
// ============================================================

function setupTrigger(form) {
  // 既存のトリガーを削除（重複防止）
  const existingTriggers = ScriptApp.getProjectTriggers();
  for (const trigger of existingTriggers) {
    if (trigger.getHandlerFunction() === "onFormSubmit") {
      ScriptApp.deleteTrigger(trigger);
    }
  }

  // 新しいトリガーを作成
  ScriptApp.newTrigger("onFormSubmit").forForm(form).onFormSubmit().create();
}

// ============================================================
// ■ フォーム送信時の処理（トリガーから呼ばれる）
// ============================================================

/**
 * フォーム送信時に GitHub Issue を作成する
 */
function onFormSubmit(e) {
  try {
    const responses = e.response.getItemResponses();

    const category = responses[0].getResponse();
    const description = responses[1].getResponse();
    const location = responses[2].getResponse();
    const photoUrl = responses.length > 3 ? responses[3].getResponse() : "";

    const title = "[報告] " + category + " - " + location;
    const body = buildIssueBody(category, description, location, photoUrl);

    const labels = ["フォーム投稿"];
    const label = CATEGORY_LABEL_MAP[category];
    if (label) {
      labels.push(label);
    }

    createGitHubIssue(title, body, labels);
    Logger.log("Issue created: " + title);
  } catch (error) {
    Logger.log("Error in onFormSubmit: " + error.message);
  }
}

/**
 * Issue のボディを組み立てる
 */
function buildIssueBody(category, description, location, photoUrl) {
  var body = "";
  body += "## カテゴリ\n" + category + "\n\n";
  body += "## 困りごとの内容\n" + description + "\n\n";
  body += "## 場所\n" + location + "\n\n";

  if (photoUrl) {
    body += "## 写真\n" + photoUrl + "\n\n";
  }

  body +=
    "---\n*この Issue は Google フォームからの投稿により自動作成されました*\n";
  return body;
}

/**
 * GitHub API で Issue を作成する
 */
function createGitHubIssue(title, body, labels) {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty("GITHUB_TOKEN");
  const owner = props.getProperty("REPO_OWNER");
  const repo = props.getProperty("REPO_NAME");

  if (!token || !owner || !repo) {
    throw new Error(
      "スクリプトプロパティが設定されていません。setupAll() を実行してください。",
    );
  }

  const url =
    "https://api.github.com/repos/" + owner + "/" + repo + "/issues";

  const payload = {
    title: title,
    body: body,
    labels: labels,
  };

  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github.v3+json",
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, options);
  const statusCode = response.getResponseCode();

  if (statusCode !== 201) {
    throw new Error(
      "GitHub API error (" + statusCode + "): " + response.getContentText(),
    );
  }

  return JSON.parse(response.getContentText());
}

// ============================================================
// ■ ユーティリティ
// ============================================================

/**
 * テスト: GitHub 接続確認
 */
function testGitHubConnection() {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty("GITHUB_TOKEN");
  const owner = props.getProperty("REPO_OWNER");
  const repo = props.getProperty("REPO_NAME");

  if (!token) {
    Logger.log("GITHUB_TOKEN が未設定です。先に setupAll() を実行してください。");
    return;
  }

  const url = "https://api.github.com/repos/" + owner + "/" + repo;
  const options = {
    method: "get",
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github.v3+json",
    },
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, options);
  const statusCode = response.getResponseCode();

  if (statusCode === 200) {
    const data = JSON.parse(response.getContentText());
    Logger.log("接続成功！ リポジトリ: " + data.full_name);
    Logger.log("説明: " + data.description);
  } else {
    Logger.log("接続失敗 (" + statusCode + "): " + response.getContentText());
  }
}

/**
 * テスト: Issue 作成テスト
 */
function testCreateIssue() {
  createGitHubIssue(
    "[テスト] セットアップ動作確認",
    "これはセットアップの動作確認用テスト Issue です。\n\n## 場所\nテスト\n\n---\n*自動テスト投稿*",
    ["その他", "フォーム投稿"],
  );
  Logger.log("テスト Issue を作成しました。GitHub で確認してください。");
}
