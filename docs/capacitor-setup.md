# Capacitor Setup Guide

## 目的

このプロジェクトを `Next.js + Capacitor` で `iOS` と `Android` に対応させるための手順書です。

## 採用構成

- Web UI: Next.js App Router
- Mobile Wrapper: Capacitor
- Database: PostgreSQL on Docker

## 重要な前提

- `next.config.ts` は `output: "export"` を使い、静的ファイルを `out/` に出力します。
- モバイル向けビルドは安定性のため `next build --webpack` を使います。
- Capacitor は `out/` を読み込んでネイティブアプリ化します。
- ルート `/` は静的書き出し可能にするため、サーバーリダイレクトではなくページ再利用で構成しています。

## 現在の主要ファイル

```text
my-app/
├── app/
│   ├── (app)/
│   │   ├── ai-shift/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── labor-cost/page.tsx
│   │   ├── leave-balance/page.tsx
│   │   ├── leave-control/page.tsx
│   │   ├── multi-store/page.tsx
│   │   ├── requests/page.tsx
│   │   ├── shifts/page.tsx
│   │   ├── staff/page.tsx
│   │   └── ui.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── docker/
│   └── db/init/001_schema.sql
├── docs/
│   └── capacitor-setup.md
├── android/               # `npx cap add android` 後に生成
├── ios/                   # `npx cap add ios` 後に生成
├── capacitor.config.ts
├── Dockerfile
├── docker-compose.yml
├── next.config.ts
└── package.json
```

## セットアップ手順

1. 依存をインストールします。

```bash
npm install
```

2. Web 資産をビルドします。

```bash
npm run build:mobile
```

3. ネイティブプロジェクトを生成します。

```bash
npx cap add ios
npx cap add android
```

4. Web 資産をネイティブ側へ同期します。

```bash
npm run cap:sync
```

5. IDE で開きます。

```bash
npm run cap:open:ios
npm run cap:open:android
```

## 開発時の更新フロー

画面を更新した後は以下を実行します。

```bash
npm run build:mobile
npm run cap:sync
```

その後、Xcode または Android Studio で再ビルドします。

## ストア申請前に変更する箇所

### iOS

- App ID: [capacitor.config.ts](/Users/Yuuki/Documents/3.個人用/hotel/my-app/capacitor.config.ts)
- Xcode project: `ios/App`
- Bundle Identifier: Xcode の `Signing & Capabilities`
- App Icon / Launch Screen: Xcode の `Assets`

### Android

- Application ID: [android/app/build.gradle](/Users/Yuuki/Documents/3.個人用/hotel/my-app/android/app/build.gradle)
- App Name: [capacitor.config.ts](/Users/Yuuki/Documents/3.個人用/hotel/my-app/capacitor.config.ts)
- App Icon: `android/app/src/main/res`
- 署名設定: Android Studio の `Generate Signed Bundle / APK`

## 申請までの大まかな流れ

1. 画面と API の本実装を完了する
2. `appId` を本番用の識別子へ変更する
3. アイコン、スプラッシュ、アプリ名を正式値へ差し替える
4. iOS は Xcode で Archive、Android は AAB を生成する
5. App Store Connect / Google Play Console へ登録する

## 今後の改善ポイント

- API 通信先を `environment` ごとに切り替える
- `Capacitor Preferences` を使った認証情報保存
- Push 通知が必要なら `@capacitor/push-notifications` を追加
- アイコンとスプラッシュ画像をネイティブ側で整備
- App Store / Google Play 用の bundle id と署名設定を本番値へ変更
