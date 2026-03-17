import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function getOrCreateIngredient({ name, unit, unit_price, category }) {
  const { data: existing, error: findErr } = await supabase
    .from("ingredients")
    .select("id, name, unit")
    .eq("name", name)
    .limit(1);

  if (findErr) throw findErr;
  if (existing && existing.length > 0) return existing[0];

  const { data: created, error: insertErr } = await supabase
    .from("ingredients")
    .insert({
      name,
      unit,
      unit_price: unit_price ?? null,
      category: category ?? null,
      nutrition_per_100g: null,
    })
    .select("id, name, unit")
    .single();

  if (insertErr) throw insertErr;
  return created;
}

async function createRecipe({ recipe, ingredients }) {
  const { data: created, error: recipeErr } = await supabase
    .from("recipes")
    .insert(recipe)
    .select("*")
    .single();

  if (recipeErr) throw recipeErr;

  if (ingredients && ingredients.length > 0) {
    const { error: riErr } = await supabase.from("recipe_ingredients").insert(
      ingredients.map((ri) => ({
        recipe_id: created.id,
        ingredient_id: ri.ingredient_id,
        amount: ri.amount,
        unit: ri.unit,
      }))
    );
    if (riErr) throw riErr;
  }

  return created;
}

async function main() {
  console.log("Seeding sample ingredients...");

  const ingredientDefs = [
    { name: "じゃがいも", unit: "g", category: "野菜", unit_price: 0.25 },
    { name: "玉ねぎ", unit: "g", category: "野菜", unit_price: 0.22 },
    { name: "にんじん", unit: "g", category: "野菜", unit_price: 0.30 },
    { name: "豚こま肉", unit: "g", category: "肉", unit_price: 1.20 },
    { name: "鶏もも肉", unit: "g", category: "肉", unit_price: 1.35 },
    { name: "卵", unit: "個", category: "卵", unit_price: 25 },
    { name: "米", unit: "g", category: "穀類", unit_price: 0.35 },
    { name: "みそ", unit: "g", category: "調味料", unit_price: 0.60 },
    { name: "しょうゆ", unit: "g", category: "調味料", unit_price: 0.70 },
    { name: "砂糖", unit: "g", category: "調味料", unit_price: 0.20 },
    { name: "みりん", unit: "g", category: "調味料", unit_price: 0.80 },
    { name: "だし", unit: "g", category: "調味料", unit_price: 0.50 },
    { name: "キャベツ", unit: "g", category: "野菜", unit_price: 0.28 },
    { name: "豆腐", unit: "g", category: "大豆製品", unit_price: 0.40 },
  ];

  const ing = {};
  for (const def of ingredientDefs) {
    const row = await getOrCreateIngredient(def);
    ing[def.name] = row.id;
  }

  console.log("Seeding sample recipes...");

  const samples = [
    {
      recipe: {
        name: "肉じゃが（定番）",
        description:
          "① 野菜を切る\n② 肉を炒める\n③ だし・調味料を入れて煮る\n④ 落としぶたで15分\n⑤ 仕上げに火を止めて味を含ませる",
        cutting_notes:
          "・じゃがいも：2cm角（やわらかめに煮る）\n・玉ねぎ：くし切り\n・にんじん：いちょう切り 5mm\n・豚こま肉：食べやすい大きさ",
        servings: 10,
        meal_type: "昼食",
        source_url: null,
        status: "published",
        is_template: true,
        is_active: true,
      },
      ingredients: [
        { ingredient_id: ing["じゃがいも"], amount: 150, unit: "g" },
        { ingredient_id: ing["玉ねぎ"], amount: 80, unit: "g" },
        { ingredient_id: ing["にんじん"], amount: 50, unit: "g" },
        { ingredient_id: ing["豚こま肉"], amount: 60, unit: "g" },
        { ingredient_id: ing["しょうゆ"], amount: 15, unit: "g" },
        { ingredient_id: ing["みりん"], amount: 10, unit: "g" },
        { ingredient_id: ing["砂糖"], amount: 6, unit: "g" },
        { ingredient_id: ing["だし"], amount: 5, unit: "g" },
      ],
    },
    {
      recipe: {
        name: "具だくさん味噌汁（定番）",
        description:
          "① 野菜を切る\n② だしで具材を煮る\n③ 火を弱めて味噌を溶く\n④ 沸騰させずに仕上げる",
        cutting_notes:
          "・玉ねぎ：薄切り\n・にんじん：いちょう切り 3mm\n・豆腐：2cm角",
        servings: 10,
        meal_type: "朝食",
        source_url: null,
        status: "published",
        is_template: true,
        is_active: true,
      },
      ingredients: [
        { ingredient_id: ing["玉ねぎ"], amount: 40, unit: "g" },
        { ingredient_id: ing["にんじん"], amount: 20, unit: "g" },
        { ingredient_id: ing["豆腐"], amount: 50, unit: "g" },
        { ingredient_id: ing["みそ"], amount: 12, unit: "g" },
        { ingredient_id: ing["だし"], amount: 4, unit: "g" },
      ],
    },
    {
      recipe: {
        name: "キャベツと卵の炒め物（簡易）",
        description:
          "① キャベツを炒める\n② 卵を加えてさっと火を通す\n③ しょうゆで調整",
        cutting_notes: "・キャベツ：ざく切り（2〜3cm）",
        servings: 10,
        meal_type: "夕食",
        source_url: null,
        status: "simple",
        is_template: false,
        is_active: true,
      },
      ingredients: [
        { ingredient_id: ing["キャベツ"], amount: 120, unit: "g" },
        { ingredient_id: ing["卵"], amount: 1, unit: "個" },
        { ingredient_id: ing["しょうゆ"], amount: 6, unit: "g" },
      ],
    },
    {
      recipe: {
        name: "鶏の照り焼き（定番）",
        description:
          "① 鶏肉に軽く火を通す\n② 砂糖・みりん・しょうゆを入れて絡める\n③ 照りが出たら完成",
        cutting_notes: "・鶏もも肉：一口大（2cm）",
        servings: 10,
        meal_type: "昼食",
        source_url: null,
        status: "published",
        is_template: true,
        is_active: true,
      },
      ingredients: [
        { ingredient_id: ing["鶏もも肉"], amount: 80, unit: "g" },
        { ingredient_id: ing["しょうゆ"], amount: 10, unit: "g" },
        { ingredient_id: ing["みりん"], amount: 10, unit: "g" },
        { ingredient_id: ing["砂糖"], amount: 5, unit: "g" },
      ],
    },
  ];

  const createdIds = [];
  for (const s of samples) {
    const created = await createRecipe(s);
    createdIds.push(created.id);
    console.log(`- created: ${created.name} (${created.id})`);
  }

  console.log("\nDone.");
  console.log("Created recipe ids:");
  for (const id of createdIds) console.log(`  - ${id}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

