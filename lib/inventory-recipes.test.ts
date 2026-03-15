import { describe, it, expect } from "vitest";
import { canMakeFromInventory } from "./inventory-recipes";

describe("canMakeFromInventory", () => {
  it("必要な食材がすべて在庫あれば true", () => {
    const recipeIngredients = [
      { ingredient_id: "ing1", amount: 100, unit: "g" },
      { ingredient_id: "ing2", amount: 200, unit: "g" },
    ];
    const inventoryMap = new Map([
      ["ing1", { quantity: 150, unit: "g" }],
      ["ing2", { quantity: 300, unit: "g" }],
    ]);
    expect(canMakeFromInventory(recipeIngredients, inventoryMap)).toBe(true);
  });

  it("1つでも不足していれば false", () => {
    const recipeIngredients = [
      { ingredient_id: "ing1", amount: 100, unit: "g" },
      { ingredient_id: "ing2", amount: 500, unit: "g" },
    ];
    const inventoryMap = new Map([
      ["ing1", { quantity: 150, unit: "g" }],
      ["ing2", { quantity: 300, unit: "g" }],
    ]);
    expect(canMakeFromInventory(recipeIngredients, inventoryMap)).toBe(false);
  });

  it("在庫にない食材があれば false", () => {
    const recipeIngredients = [
      { ingredient_id: "ing1", amount: 100, unit: "g" },
      { ingredient_id: "ing3", amount: 50, unit: "g" },
    ];
    const inventoryMap = new Map([
      ["ing1", { quantity: 150, unit: "g" }],
      ["ing2", { quantity: 300, unit: "g" }],
    ]);
    expect(canMakeFromInventory(recipeIngredients, inventoryMap)).toBe(false);
  });

  it("レシピ材料が空なら false", () => {
    const inventoryMap = new Map([["ing1", { quantity: 100, unit: "g" }]]);
    expect(canMakeFromInventory([], inventoryMap)).toBe(false);
  });

  it("kg と g の換算で在庫十分なら true", () => {
    const recipeIngredients = [
      { ingredient_id: "ing1", amount: 500, unit: "g" },
    ];
    const inventoryMap = new Map([
      ["ing1", { quantity: 1, unit: "kg" }],
    ]);
    expect(canMakeFromInventory(recipeIngredients, inventoryMap)).toBe(true);
  });

  it("kg と g の換算で在庫不足なら false", () => {
    const recipeIngredients = [
      { ingredient_id: "ing1", amount: 1500, unit: "g" },
    ];
    const inventoryMap = new Map([
      ["ing1", { quantity: 1, unit: "kg" }],
    ]);
    expect(canMakeFromInventory(recipeIngredients, inventoryMap)).toBe(false);
  });
});
