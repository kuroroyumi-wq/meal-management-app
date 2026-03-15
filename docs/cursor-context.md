# Cursor 開発コンテキスト（AIへの指示用）

このプロジェクトは**高齢者施設向け食事管理Webアプリ**です。

## 技術スタック

- **Next.js 14+** App Router + TypeScript
- **Tailwind CSS** + **shadcn/ui**
- **Supabase**（PostgreSQL）
- **Anthropic Claude API**（献立自動生成）

## 開発方針

- App Router 使用
- Server Components 優先
- shadcn/ui 使用
- TypeScript strict
- 再利用可能なコンポーネント設計

## 設計書の場所

- 要件: `docs/requirements.md`
- 基本設計・API・DB: `docs/basic-design.md`
- DB用SQL: `docs/er-diagram.md`

## 指示するときのテンプレート

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
