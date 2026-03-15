/**
 * 在庫から作れるレシピを判定する
 * 単位が一致する場合のみ比較（g と kg は簡易換算）
 */

function toGrams(amount: number, unit: string): number {
  const u = unit.toLowerCase().trim();
  if (u === "g" || u === "グラム" || u === "ml" || u === "cc") return amount;
  if (u === "kg") return amount * 1000;
  if (u === "l") return amount * 1000;
  return amount;
}

export function canMakeFromInventory(
  recipeIngredients: { ingredient_id: string; amount: number; unit: string }[],
  inventoryMap: Map<string, { quantity: number; unit: string }>
): boolean {
  if (!recipeIngredients.length) return false;
  for (const ri of recipeIngredients) {
    const inv = inventoryMap.get(ri.ingredient_id);
    if (!inv) return false;
    const needG = toGrams(ri.amount, ri.unit);
    const haveG = toGrams(inv.quantity, inv.unit);
    if (haveG < needG) return false;
  }
  return true;
}
