# ステップバイステップ 進捗

設計書・ガイドに沿った開発の進捗メモです。

---

## 完了したこと

- [x] **準備** … `docs/` に要件・設計書を配置（requirements.md, basic-design.md, er-diagram.md, cursor-context.md）
- [x] **Phase1 STEP2** … パッケージ導入（Supabase, Anthropic, cheerio, axios, lucide-react, shadcn/ui など）
- [x] **Phase1 補足** … `docs/er-diagram.md` と `docs/cursor-context.md` を作成
- [x] **Phase2 STEP1** … 基盤コード作成
  - `lib/supabase/client.ts` … ブラウザ用 Supabase クライアント
  - `lib/supabase/server.ts` … サーバー用 Supabase クライアント
  - `types/index.ts` … DB 対応の TypeScript 型定義
- [x] **ルート構成** … ダッシュボード用レイアウト・サイドバー・各画面のプレースホルダー
  - `/` → `/dashboard` にリダイレクト
  - `/dashboard` … ダッシュボード
  - `/ingredients` … 食材管理（CRUD API + 一覧・登録・編集・削除 実装済み）
  - `/recipes`, `/menu`, `/inventory`, `/cost`, `/nutrition`, `/staff` … プレースホルダー
- [x] **DB 用 SQL** … `supabase/migrations/001_initial_schema.sql` に初期スキーマを用意

---

## 次にやること（あなたの作業）

### Step 0: Supabase が「不健康」の場合
- ダッシュボードで **状態: 不健康**・プライマリDBに赤い点が出ているときは、まず以下を試す：
  1. 数分待ってページを再読み込み（新規プロジェクトは起動に時間がかかることがある）
  2. [Supabase Status](https://status.supabase.com/) で障害がないか確認
  3. 左メニュー **Settings** → **General** で「Pause project」になっていないか確認
  4. それでも直らなければ、プロジェクトを一度停止してから再開する

### Step 1: API 情報を .env.local に反映
- Supabase ダッシュボード → 左メニュー **Settings** → **API**
- **Project URL** をコピー → `.env.local` の `NEXT_PUBLIC_SUPABASE_URL=` の右に貼り付け
- **anon public** キーをコピー → `NEXT_PUBLIC_SUPABASE_ANON_KEY=` の右に貼り付け
- プロジェクト作成時に設定した **Database password** を `SUPABASE_DB_PASSWORD=` の右に入力（任意だが、直接接続するときに使う）

### Step 2: テーブルを作成する（マイグレーション）
1. Supabase ダッシュボード → 左メニュー **SQL Editor**
2. **New query** をクリック
3. プロジェクト内の `docs/er-diagram.md` を開き、\`\`\`sql ～ \`\`\` の中身（CREATE TABLE ～）をすべてコピー
4. SQL Editor に貼り付けて **Run** をクリック
5. 「Success」と出れば OK（「移行なし」が「最終移行」に変わる）

### Step 3: アプリで動作確認
- ターミナルで `npm run dev` を実行
- ブラウザで http://localhost:3000 を開き、ダッシュボードが表示されることを確認

### Step 4: 食材管理 … 完了
- **食材管理**の CRUD API と一覧・登録・編集・削除画面を実装済み

### Step 5: レシピ管理 … 完了
- **レシピ** … `/api/recipes` の CRUD、一覧・新規登録・詳細・編集画面、材料（recipe_ingredients）の登録・編集を実装済み

### Step 6: 週間献立 … 完了
- **献立** … `/api/menu` の CRUD、一覧・新規作成・詳細・編集、日付×食事区分でレシピ割り当てを実装済み
- **AI献立生成** … `/menu/generate` はプレースホルダー（Phase 2 で実装予定）

### Step 7: 在庫管理 … 完了
- **在庫** … GET `/api/inventory`（一覧）、POST `/api/inventory`（仕入れ登録＝purchases に記録し在庫を加算）
- **画面** … `/inventory` で在庫一覧表示と仕入れ登録フォームを実装済み

### Step 8: 原価管理 … 完了
- **原価** … GET `/api/cost`（仕入れ履歴・?month=YYYY-MM で月指定）、GET `/api/cost/monthly`（月別集計）
- **画面** … `/cost`（原価一覧・月絞り込み）、`/cost/monthly`（月次統計）を実装済み

### Step 9: レシピスクレイピング … 完了（おすすめ順で実装）
- **スクレイピング** … `lib/scraper.ts`（JSON-LD・材料セクション・汎用リスト対応）、POST `/api/scrape`（url を送るとタイトル・材料を返す）
- **レシピ登録** … 「URLから取り込む」欄を追加。URL入力→取り込むでタイトル・参照URL・材料を自動セット（食材名で既存食材と自動マッチ、未マッチは「（取り込んだ）〇〇」で表示して手動選択）

### Step 10: AI献立生成 … 完了
- **lib/claude.ts** … Claude API で1週間献立を生成（登録レシピ名・食材をプロンプトに渡し、JSONで返却）
- **POST /api/menu/generate** … week_start, headcount, budget_per_day を受け取り、生成結果（menu_items に recipe_id 紐づけ）を返す
- **/menu/generate** … 条件入力→「献立を生成」→提案表表示→「この献立で作成」で献立をDBに保存
- **前提** … `.env.local` に `ANTHROPIC_API_KEY` を設定すること

### Step 11: 栄養管理 … 完了
- **食材の栄養（100gあたり）** … 食材管理の登録・編集フォームに熱量・タンパク質・脂質・炭水化物を追加。一覧に「栄養(100g)」列を表示
- **レシピ1人前の栄養** … GET `/api/recipes/[id]/nutrition` で材料の栄養データから1人前の栄養素を計算（単位 g/kg/ml をグラム換算して集計）
- **レシピ詳細** … 献立クリック時と同様に、レシピ詳細ページで「1人前の栄養素（目安）」を表示
- **栄養管理ページ** … `/nutrition` で「レシピ別 1人前の栄養素」選択＋食材別栄養成分（100g）一覧。編集は食材管理へリンク

### Step 12: スタッフ管理 … 完了
- **スタッフ** … GET/POST `/api/staff`、GET/PUT/DELETE `/api/staff/[id]`。名前・役割・LINEユーザーIDを登録・編集
- **シフトタスク** … GET `/api/shift-tasks`（?date=, ?shift=）、POST で追加、PATCH で担当・完了更新、DELETE で削除
- **スタッフ管理画面** … `/staff` でスタッフ一覧（追加・編集・削除）、シフト別タスク（日付・シフト絞り、タスク追加・担当割当・完了トグル・削除）
- **LINE通知** … POST `/api/notify`（body: staff_id または line_user_id, 任意で message）。`.env.local` に `LINE_CHANNEL_ACCESS_TOKEN` を設定すると、スタッフにプッシュ通知を送信。未設定時は 503 で案内

### Step 13: ログイン・認証 … 完了
- **ミドルウェア** … `middleware.ts` で Supabase セッションを更新。未ログイン時は保護ルート（/, /dashboard, /ingredients 等）へアクセスすると `/login?next=...` へリダイレクト。ログイン済みで `/login` に来た場合は `/dashboard` へリダイレクト
- **ログイン画面** … `/login`（(auth) レイアウト）。メール・パスワードで `signInWithPassword`。ログイン後は `next` クエリがあればそのURLへ、なければ `/dashboard` へ遷移
- **ログアウト** … ダッシュボードサイドバーに「ログアウト」ボタン。`signOut()` 後に `/login` へリダイレクト
- **前提** … Supabase ダッシュボードの Authentication → Providers で Email を有効にし、Users でテスト用ユーザーを追加すること

### Step 14: 一通り拡張 … 完了
- **README 整備** … セットアップ・Vercel デプロイ手順・機能一覧を記載
- **RLS** … `002_rls_policies.sql` で認証済みユーザーのみ全テーブルアクセス可能に
- **余り食材活用（要件⑦）** … `/menu/use-leftovers` で在庫から作れるレシピ一覧、API で 1 週間献立を自動作成
- **月次統計拡張（要件⑩）** … 月次 API・画面に「売上（食事提供）」を追加（朝200円・昼500円・夕500円×提供数）
- **販売管理（要件⑪）** … `sales_products` / `sales_records` テーブル、`/sales` で商品登録・販売記録
- **材料自動計算** … レシピ詳細で「人数で必要量を計算」入力により材料量を倍率表示

### 今後の拡張（設計書どおり）
- その他要件に応じた機能追加

---

## 参照

- 全体の流れ・用語: `開発ステップバイステップガイド.md`
- 要件: `requirements.md`
- 基本設計・API・DB: `basic-design.md`
- Cursor 用コンテキスト: `cursor-context.md`
