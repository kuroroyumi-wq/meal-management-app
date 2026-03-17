-- 献立: 1食=複数品（役割）を扱うための拡張
-- menu_items に役割(dish_role)と表示順(display_order)を追加する
--
-- 既存データ互換:
-- - 既存行は dish_role='other'、display_order=0 として扱う
-- - 追加カラムは NOT NULL + DEFAULT で、既存INSERTも壊さない
--
-- Down する場合（参考）:
--   DROP INDEX IF EXISTS menu_items_unique_slot;
--   ALTER TABLE menu_items DROP COLUMN IF EXISTS display_order;
--   ALTER TABLE menu_items DROP COLUMN IF EXISTS dish_role;

ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS dish_role TEXT NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0;

-- 既存データの暫定割り当て:
-- 旧仕様（1食=1品）は主菜相当として扱う
UPDATE menu_items
  SET dish_role = 'main',
      display_order = 1
  WHERE dish_role = 'other'
    AND recipe_id IS NOT NULL;

-- 候補の役割に制限（将来のデータ品質のため）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'menu_items_dish_role_check'
  ) THEN
    ALTER TABLE menu_items
      ADD CONSTRAINT menu_items_dish_role_check
      CHECK (dish_role IN ('staple','main','side','soup','dessert','drink','other'));
  END IF;
END $$;

-- 1週間献立内で「日付×食事区分×役割」が重複しないようにする
CREATE UNIQUE INDEX IF NOT EXISTS menu_items_unique_slot
  ON menu_items (weekly_menu_id, date, meal_type, dish_role);

