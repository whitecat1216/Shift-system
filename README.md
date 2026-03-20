Hotel Shift AI の画面モックと、ローカル開発用 PostgreSQL を Docker でまとめて起動できるプロジェクトです。`Next.js + Capacitor` で iOS / Android 対応できる構成にしています。

## 起動方法

1. `.env.example` を `.env` にコピーします。

```bash
cp .env.example .env
```

2. アプリと DB をまとめて起動します。

```bash
docker compose up --build
```

バックグラウンド起動にする場合:

```bash
docker compose up -d --build
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開くと画面を確認できます。

## モバイルアプリ対応

Web UI は静的書き出しされ、Capacitor 経由でネイティブアプリへ組み込みます。

```bash
npm run build:mobile
npm run cap:sync
```

詳細は [capacitor-setup.md](/Users/Yuuki/Documents/3.個人用/hotel/my-app/docs/capacitor-setup.md) を参照してください。

## 構成

- `app`: Next.js 開発サーバー
- `db`: PostgreSQL 16

アプリコンテナ内では `DATABASE_URL` が自動的に次の値になります。

```env
DATABASE_URL=postgresql://hotel_admin:hotel_password@db:5432/hotel_shift
```

ホストマシンから直接 DB 接続する場合は、`.env` にある以下の値を使います。

```env
DATABASE_URL=postgresql://hotel_admin:hotel_password@localhost:5432/hotel_shift
```

## 初期スキーマ

初回起動時に [001_schema.sql](/Users/Yuuki/Documents/3.個人用/hotel/my-app/docker/db/init/001_schema.sql) が自動実行され、以下のベーステーブルが作成されます。

- `stores`
- `staff`
- `shift_types`
- `shift_requirements`
- `shift_assignments`
- `leave_requests`
- `paid_leave_balances`

## 停止と再初期化

停止:

```bash
docker compose down
```

ボリュームごと削除して初期化し直す場合:

```bash
docker compose down -v
```
