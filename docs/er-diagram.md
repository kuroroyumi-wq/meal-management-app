# DB設計（テーブル定義SQL）

Supabase の **SQL Editor** でこのファイルの SQL をコピーして「Run」で実行してください。

---

## テーブル作成用SQL（まとめて実行可）

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

-- 販売商品（フリーズドライ・チルド等）
CREATE TABLE sales_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  product_type TEXT NOT NULL DEFAULT 'chilled',
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 販売記録
CREATE TABLE sales_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES sales_products(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 1,
  sold_at DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
