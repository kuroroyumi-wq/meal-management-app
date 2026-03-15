# 食事管理アプリ（Meal Management System）

高齢者施設向けの献立・在庫・原価・栄養・スタッフ管理を行う Web アプリです。  
Next.js + Supabase + Claude API で構築しています。

---

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フロント | Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| バックエンド | Next.js API Routes |
| DB・認証 | Supabase (PostgreSQL + Auth) |
| AI | Anthropic Claude API（献立自動生成） |
| 通知 | LINE Messaging API（任意） |

---

## 機能一覧

- **認証** … ログイン / ログアウト（Supabase Auth）
- **食材管理** … 食材の CRUD、栄養成分（100g あたり）登録
- **レシピ管理** … レシピ・材料の CRUD、URL からのスクレイピング取り込み、人数入力で材料量自動計算
- **週間献立** … 献立の作成・編集、日付×食事区分でレシピ割り当て
- **余り食材で献立** … 在庫から作れるレシピ一覧、1 週間献立の自動作成
- **AI 献立生成** … 条件に応じた 1 週間献立の提案
- **在庫管理** … 在庫一覧、仕入れ登録
- **原価管理** … 仕入れ履歴、月次集計（原価・食事提供売上）
- **栄養管理** … 食材別・レシピ別（1 人前）栄養表示
- **スタッフ管理** … スタッフ CRUD、シフト別タスク、LINE 通知（任意）
- **販売管理** … フリーズドライ・チルド販売商品と販売記録

---

## セットアップ

### 1. リポジトリのクローンと依存関係

```bash
git clone <リポジトリURL>
cd meal-management-app
npm install
```

### 2. Supabase プロジェクトの準備

1. [Supabase](https://supabase.com) でプロジェクトを作成
2. **SQL Editor** で以下を順に実行:
   - `supabase/migrations/001_initial_schema.sql`（テーブル作成）
   - `supabase/migrations/002_rls_policies.sql`（RLS ポリシー）
   - `supabase/migrations/003_sales.sql`（販売管理テーブル＋RLS）
3. **Authentication** → **Providers** で **Email** を有効化
4. **Authentication** → **Users** で「Add user」からテスト用ユーザー（メール・パスワード）を 1 件作成

### 3. 環境変数

プロジェクトルートに `.env.local` を作成し、以下を設定します。

```env
# Supabase（必須）
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# データベースパスワード（任意・直接接続時用）
SUPABASE_DB_PASSWORD=your_db_password

# Claude API（AI 献立生成を使う場合）
ANTHROPIC_API_KEY=your_anthropic_key

# LINE 通知（スタッフへ通知する場合）
# LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
```

- **Project URL** と **anon public キー** は Supabase ダッシュボード → **Settings** → **API** で確認できます。

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開き、ログイン画面が表示されれば OK です。未ログインの場合は `/login` にリダイレクトされます。

---

## Vercel へのデプロイ

1. [Vercel](https://vercel.com) でリポジトリをインポート
2. **Environment Variables** に `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定
3. **Deploy** を実行
4. 本番 URL を Supabase の **Authentication** → **URL Configuration** → **Redirect URLs** に追加

くわしくは `docs/デプロイ手順.md` を参照してください。

---

## ライセンス

Private / ポートフォリオ用
