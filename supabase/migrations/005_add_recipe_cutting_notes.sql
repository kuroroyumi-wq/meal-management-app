-- 調理指示書用: 切り方・大きさの目安を保存するカラム追加
-- description は「作り方・手順」としてUIで扱い、DB名は変更しない
-- Down する場合は: ALTER TABLE recipes DROP COLUMN IF EXISTS cutting_notes;

ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS cutting_notes TEXT NULL;
