/**
 * 食事管理アプリ用 TypeScript 型定義
 * docs/basic-design.md / docs/er-diagram.md のテーブルに準拠
 */

export type MealType = "朝食" | "昼食" | "夕食";
export type MenuStatus = "draft" | "confirmed";
export type ShiftType = "朝" | "昼" | "夕";

export interface NutritionPer100g {
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  unit_price: number | null;
  category: string | null;
  nutrition_per_100g: NutritionPer100g | null;
  created_at: string;
}

export type RecipeStatus = "draft" | "simple" | "published";

export interface Recipe {
  id: string;
  name: string;
  /** UIでは「作り方・手順」として表示。DBカラムは description のまま */
  description: string | null;
  /** 切り方・大きさの目安（調理指示書用） */
  cutting_notes?: string | null;
  servings: number;
  meal_type: MealType | null;
  source_url: string | null;
  created_at: string;
  is_template?: boolean;
  status?: RecipeStatus;
  base_recipe_id?: string | null;
  created_by?: string | null;
  is_active?: boolean;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  amount: number;
  unit: string;
}

/** レシピ詳細取得用（材料に食材名を含む） */
export interface RecipeIngredientWithName extends RecipeIngredient {
  ingredient?: Pick<Ingredient, "name" | "unit"> | null;
}

export interface RecipeWithIngredients extends Recipe {
  recipe_ingredients?: RecipeIngredientWithName[];
}

export interface WeeklyMenu {
  id: string;
  week_start: string;
  headcount: number;
  status: MenuStatus;
  created_at: string;
}

export interface MenuItem {
  id: string;
  weekly_menu_id: string;
  date: string;
  meal_type: string;
  recipe_id: string | null;
  adjusted_servings: number | null;
}

/** 献立詳細取得用（レシピ名を含む） */
export interface MenuItemWithRecipe extends MenuItem {
  recipe?: Pick<Recipe, "name" | "servings"> | null;
}

export interface WeeklyMenuWithItems extends WeeklyMenu {
  menu_items?: MenuItemWithRecipe[];
}

export interface Inventory {
  id: string;
  ingredient_id: string;
  quantity: number;
  updated_at: string;
}

/** 在庫一覧用（食材名・単位を含む） */
export interface InventoryWithIngredient extends Inventory {
  ingredient?: Pick<Ingredient, "name" | "unit"> | null;
}

export interface Purchase {
  id: string;
  ingredient_id: string;
  quantity: number;
  unit_price: number;
  purchased_at: string;
  receipt_image_url: string | null;
  created_at: string;
}

/** 原価一覧用（食材名・金額を含む） */
export interface PurchaseWithIngredient extends Purchase {
  ingredient?: Pick<Ingredient, "name" | "unit"> | null;
  total?: number; // quantity * unit_price
}

/** 月次原価・売上集計 */
export interface MonthlyCostSummary {
  month: string; // YYYY-MM
  total_cost: number;
  purchase_count: number;
  /** 食事提供売上（朝200円・昼500円・夕500円×提供数） */
  revenue?: number;
}

export interface InventoryUsage {
  id: string;
  ingredient_id: string;
  menu_item_id: string;
  quantity_used: number;
  used_at: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string | null;
  line_user_id: string | null;
}

export interface ShiftTask {
  id: string;
  date: string;
  shift: ShiftType;
  staff_id: string | null;
  task: string;
  is_done: boolean;
  created_at: string;
}

/** シフトタスク一覧用（スタッフ名を含む） */
export interface ShiftTaskWithStaff extends ShiftTask {
  staff?: Pick<Staff, "name"> | null;
}

export type SalesProductType = "frozen" | "chilled";

export interface SalesProduct {
  id: string;
  name: string;
  product_type: SalesProductType;
  unit_price: number;
  created_at: string;
}

export interface SalesRecord {
  id: string;
  product_id: string | null;
  quantity: number;
  sold_at: string;
  created_at: string;
}

export interface SalesRecordWithProduct extends SalesRecord {
  product?: Pick<SalesProduct, "name" | "unit_price" | "product_type"> | null;
}
