-- 販売管理（フリーズドライ・チルド等）
-- 主食200円・副菜100円程度の販売用

CREATE TABLE sales_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  product_type TEXT NOT NULL DEFAULT 'chilled',
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sales_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES sales_products(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 1,
  sold_at DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE sales_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read sales_products" ON sales_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write sales_products" ON sales_products FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read sales_records" ON sales_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write sales_records" ON sales_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
