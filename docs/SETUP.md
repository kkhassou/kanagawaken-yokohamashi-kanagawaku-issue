# セットアップガイド

このリポジトリを他の地域で活用するためのセットアップ手順です。

## 1. リポジトリの準備

### 1.1 リポジトリをフォークまたはテンプレートとして使用

```bash
gh repo create <都道府県>-<市区町村>-issue --public --template kkhassou/kanagawaken-yokohamashi-kanagawaku-issue
```

### 1.2 ラベルの作成

リポジトリに以下のラベルを作成します：

```bash
gh label create "安全" --color "e53935" --description "手すり・ガードレール・転落防止など" --repo OWNER/REPO
gh label create "街灯・照明" --color "f57c00" --description "街灯不足・暗い場所" --repo OWNER/REPO
gh label create "道路・歩道" --color "1565c0" --description "道路損傷・歩道の問題・段差" --repo OWNER/REPO
gh label create "カーブミラー・標識" --color "7b1fa2" --description "ミラーの設置・標識の問題" --repo OWNER/REPO
gh label create "公園・緑地" --color "2e7d32" --description "公園の設備・緑地の管理" --repo OWNER/REPO
gh label create "ゴミ・不法投棄" --color "4e342e" --description "不法投棄・ゴミ問題" --repo OWNER/REPO
gh label create "その他" --color "616161" --description "上記以外の困りごと" --repo OWNER/REPO
gh label create "フォーム投稿" --color "0288d1" --description "Google フォームからの自動投稿" --repo OWNER/REPO
```

## 2. Google フォームの作成

### 2.1 フォームの質問

1. **カテゴリ**（プルダウン・必須）
   - 安全（手すり・ガードレール等）
   - 街灯・照明
   - 道路・歩道
   - カーブミラー・標識
   - 公園・緑地
   - ゴミ・不法投棄
   - その他

2. **困りごとの内容**（段落・必須）
   - 説明: どのような困りごとがあるか、できるだけ詳しく教えてください

3. **場所**（記述式・必須）
   - 説明: 住所や目印を教えてください

4. **写真URL**（記述式・任意）
   - 説明: 写真がある場合はURLを貼り付けてください

### 2.2 Apps Script の設定

1. Google フォームの編集画面で **拡張機能 > Apps Script** を開く
2. `gas/form-to-issue.gs` の内容をコピー＆ペースト
3. **プロジェクトの設定 > スクリプトプロパティ** に以下を追加：

| プロパティ | 値 |
|-----------|-----|
| `GITHUB_TOKEN` | GitHub Personal Access Token（`repo` スコープ） |
| `REPO_OWNER` | GitHub ユーザー名 |
| `REPO_NAME` | リポジトリ名 |

4. **トリガー** を設定：
   - 関数: `onFormSubmit`
   - イベントソース: フォームから
   - イベントの種類: フォーム送信時

### 2.3 GitHub Token の作成

1. GitHub で **Settings > Developer settings > Personal access tokens > Fine-grained tokens** へ
2. **Generate new token** をクリック
3. 設定：
   - Token name: `google-form-issue-creator`
   - Repository access: **Only select repositories** → 対象リポジトリを選択
   - Permissions:
     - Issues: **Read and write**
4. トークンを生成し、スクリプトプロパティの `GITHUB_TOKEN` に設定

## 3. GitHub Pages の設定

1. リポジトリの **Settings > Pages** へ
2. Source: **Deploy from a branch**
3. Branch: `main`, Folder: `/docs`
4. Save

数分後に `https://<username>.github.io/<repo-name>/` でアクセスできるようになります。

## 4. GitHub Projects の設定

1. リポジトリの **Projects** タブへ
2. **New project** → **Board** を選択
3. カラムを設定：
   - **受付済み**: 新しい報告
   - **確認中**: 現地確認・調査中
   - **対応中**: 対応作業中
   - **完了**: 対応完了

## 5. 公開ページのカスタマイズ

`docs/index.html` と `docs/app.js` 内の以下を変更：

- リポジトリオーナー名・リポジトリ名
- Google フォームのURL
- 地域名（タイトル等）
