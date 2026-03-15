-- RLS: 認証済みユーザーのみ全テーブルにアクセス可能
-- 未認証は API 経由でも anon key を使うため、サービスロールで実行する API では RLS をバイパス可能。
-- 認証済みユーザー（ログイン済み）にのみアプリのデータを許可する。

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_tasks ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは全テーブルで SELECT, INSERT, UPDATE, DELETE 可能
CREATE POLICY "Authenticated read ingredients" ON ingredients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write ingredients" ON ingredients FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read recipes" ON recipes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write recipes" ON recipes FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read recipe_ingredients" ON recipe_ingredients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write recipe_ingredients" ON recipe_ingredients FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read weekly_menus" ON weekly_menus FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write weekly_menus" ON weekly_menus FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read menu_items" ON menu_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write menu_items" ON menu_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read inventory" ON inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write inventory" ON inventory FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read purchases" ON purchases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write purchases" ON purchases FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read inventory_usage" ON inventory_usage FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write inventory_usage" ON inventory_usage FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read staff" ON staff FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write staff" ON staff FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read shift_tasks" ON shift_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write shift_tasks" ON shift_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
