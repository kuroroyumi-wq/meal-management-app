# 基本設計書
## 高齢者施設向け 食事管理Webアプリ

**プロジェクト名**: Meal Management System  
**作成日**: 2026年3月  
**リポジトリ**: https://github.com/kuroroyumi-wq/meal-management-app

---

## 1. 技術スタック

| カテゴリ | 技術 | 備考 |
|---------|------|------|
| フロントエンド | Next.js 14 (App Router) + TypeScript | |
| UI | Tailwind CSS + shadcn/ui | |
| バックエンド | Next.js API Routes | |
| データベース | Supabase (PostgreSQL) | 認証・リアルタイム込み |
| AI | Anthropic Claude API | 献立自動生成 |
| スクレイピング | Cheerio + axios | レシピURL解析 |
| 通知 | LINE Messaging API | スタッフ通知 |
| デプロイ | Vercel | |
| 費用 | ほぼ0円 | 無料枠を活用 |

---

## 2. 画面一覧

| 画面 | URL |
|-----|-----|
| ログイン | /login |
| ダッシュボード | /dashboard |
| 食材管理 | /ingredients |
| レシピ一覧 | /recipes |
| レシピ登録 | /recipes/new |
| レシピ詳細 | /recipes/[id] |
| 週間献立 | /menu |
| AI献立生成 | /menu/generate |
| 在庫管理 | /inventory |
| 原価管理 | /cost |
| 月次統計 | /cost/monthly |
| 栄養管理 | /nutrition |
| スタッフ管理 | /staff |

---

## 3. ディレクトリ構成

```
meal-management-app/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── ingredients/page.tsx
│   │   ├── recipes/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── new/page.tsx
│   │   ├── menu/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── generate/page.tsx
│   │   ├── inventory/page.tsx
│   │   ├── cost/
│   │   │   ├── page.tsx
│   │   │   └── monthly/page.tsx
│   │   ├── nutrition/page.tsx
│   │   └── staff/page.tsx
│   └── api/
│       ├── ingredients/route.ts
│       ├── recipes/route.ts
│       ├── menu/route.ts
│       ├── menu/generate/route.ts
│       ├── inventory/route.ts
│       ├── cost/route.ts
│       ├── scrape/route.ts
│       └── staff/route.ts
├── components/
│   ├── ui/
│   ├── ingredients/
│   ├── recipes/
│   ├── menu/
│   ├── inventory/
│   └── shared/
│       ├── Navbar.tsx
│       ├── Sidebar.tsx
│       └── DataTable.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── claude.ts
│   ├── scraper.ts
│   └── utils.ts
├── types/
│   └── index.ts
├── docs/
│   ├── requirements.md
│   ├── basic-design.md
│   ├── er-diagram.md
│   └── cursor-context.md
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql
```

---

## 4. DB設計（ER図）

```sql
-- 食材マスタ
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  unit_price DECIMAL(10,2),
  category TEXT,
  nutrition_per_100g JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- レシピ
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  servings INT NOT NULL DEFAULT 1,
  meal_type TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- レシピ材料
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id),
  amount DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL
);

-- 週間献立
CREATE TABLE weekly_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  headcount INT NOT NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 献立詳細
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_menu_id UUID REFERENCES weekly_menus(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  recipe_id UUID REFERENCES recipes(id),
  adjusted_servings INT
);

-- 在庫
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID REFERENCES ingredients(id),
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 仕入れ記録
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID REFERENCES ingredients(id),
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  purchased_at DATE NOT NULL,
  receipt_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 在庫使用ログ
CREATE TABLE inventory_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID REFERENCES ingredients(id),
  menu_item_id UUID REFERENCES menu_items(id),
  quantity_used DECIMAL(10,2) NOT NULL,
  used_at DATE NOT NULL
);

-- スタッフ
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  line_user_id TEXT
);

-- シフト別タスク
CREATE TABLE shift_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  shift TEXT NOT NULL,
  staff_id UUID REFERENCES staff(id),
  task TEXT NOT NULL,
  is_done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. API設計

| メソッド | エンドポイント | 説明 |
|---------|--------------|------|
| GET | /api/ingredients | 食材一覧取得 |
| POST | /api/ingredients | 食材登録 |
| PUT | /api/ingredients/[id] | 食材更新 |
| DELETE | /api/ingredients/[id] | 食材削除 |
| GET | /api/recipes | レシピ一覧取得 |
| POST | /api/recipes | レシピ登録 |
| GET | /api/recipes/[id] | レシピ詳細取得 |
| PUT | /api/recipes/[id] | レシピ更新 |
| DELETE | /api/recipes/[id] | レシピ削除 |
| GET | /api/menu | 献立一覧取得 |
| POST | /api/menu | 献立作成 |
| POST | /api/menu/generate | AI献立生成 |
| GET | /api/inventory | 在庫一覧取得 |
| POST | /api/inventory | 仕入れ登録 |
| GET | /api/cost | 原価一覧取得 |
| POST | /api/scrape | レシピスクレイピング |

---

## 6. 環境変数

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
LINE_CHANNEL_ACCESS_TOKEN=
```

---

## 7. Claude API 活用設計

```typescript
// 献立自動生成プロンプト
const prompt = `
以下の条件で1週間の献立を作成してください：
- 使用可能食材: ${availableIngredients}
- 人数: ${headcount}名
- 予算上限: ${budget}円/日
- 除外献立（直近4週間）: ${recentMenus}
- 栄養バランスを考慮すること

JSON形式で返してください：
{
  "monday": { "breakfast": "...", "lunch": "...", "dinner": "..." },
  "tuesday": { ... },
  ...
}
`;
```

---

## 8. 開発フロー

| フェーズ | 期間 | 内容 |
|---------|------|------|
| Phase 1 | Week 1〜2 | 食材管理・レシピCRUD・週間献立・人数計算 |
| Phase 2 | Week 3〜4 | スクレイピング・AI献立生成・在庫管理 |
| Phase 3 | Week 5〜6 | 原価統計・栄養管理・スタッフ管理・LINE通知 |
| 仕上げ | Week 7 | README完成・デプロイ・ポートフォリオ公開 |

---

## 9. Cursor開発コンテキスト（AIへの指示テンプレート）

```
このプロジェクトは高齢者施設向け食事管理Webアプリです。

技術スタック：
- Next.js 14 App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase（PostgreSQL）
- Anthropic Claude API

開発方針：
- App Router使用
- Server Components優先
- shadcn/ui使用
- TypeScript strict
- 再利用可能なコンポーネント設計
```
