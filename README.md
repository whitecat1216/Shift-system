Shift Pilot の画面モックと、ローカル開発用 PostgreSQL を Docker でまとめて起動できるプロジェクトです。`Next.js + Capacitor` で iOS / Android 対応できる構成にしています。

## 起動方法

1. `.env.example` を `.env` にコピーします。

```bash
cp .env.example .env
```

2. アプリと DB をまとめて起動します。

```bash
docker compose up --build
```

`app` コンテナは起動時に `package-lock.json` と `node_modules` の差分を見て、依存が足りない場合は自動で `npm ci` を実行します。`pg` などの追加依存を入れたあとでも、`docker compose up --build` で追従できます。

バックグラウンド起動にする場合:

```bash
docker compose up -d --build
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開くと画面を確認できます。

## ログイン

ログイン画面は [http://localhost:3000/login](http://localhost:3000/login) です。サンプルアカウントは次の 3 つです。

- `admin@example.com` / `admin123`
- `hotel.manager@example.com` / `hotel123`
- `restaurant.manager@example.com` / `restaurant123`

担当者ごとに、見える業種・店舗・画面が変わります。

## モバイルアプリ対応

Web UI は静的書き出しされ、Capacitor 経由でネイティブアプリへ組み込みます。`build:mobile` では App Router の API route を一時的に外して export するため、モバイル書き出し時は業種設定 API に失敗しても埋め込みの既定設定へフォールバックします。Web サーバーとして起動する `docker compose up` や `npm run dev` では DB 連携 API が有効です。

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

初回起動時に `docker/db/init` 配下の SQL が順番に実行されます。DDL と DML は分離済みです。

- [001_schema.sql](/Users/Yuuki/Documents/3.個人用/hotel/my-app/docker/db/init/001_schema.sql)
  共通テーブルと業種マスタの DDL
- [010_seed_business_types.sql](/Users/Yuuki/Documents/3.個人用/hotel/my-app/docker/db/init/010_seed_business_types.sql)
  業種マスタ、勤務区分、申請種別、UI ラベルの seed
- [020_seed_hotel.sql](/Users/Yuuki/Documents/3.個人用/hotel/my-app/docker/db/init/020_seed_hotel.sql)
  ホテル用 seed
- [021_seed_restaurant.sql](/Users/Yuuki/Documents/3.個人用/hotel/my-app/docker/db/init/021_seed_restaurant.sql)
  飲食店用 seed
- [005_auth_schema.sql](/Users/Yuuki/Documents/3.個人用/hotel/my-app/docker/db/init/005_auth_schema.sql)
  ユーザー、ロール、アクセス権、セッション管理の DDL
- [011_seed_auth.sql](/Users/Yuuki/Documents/3.個人用/hotel/my-app/docker/db/init/011_seed_auth.sql)
  サンプル担当者と権限の seed
- [022_seed_operational_data.sql](/Users/Yuuki/Documents/3.個人用/hotel/my-app/docker/db/init/022_seed_operational_data.sql)
  シフト必要人数、割当、申請の月次 seed

主なテーブル:

- `business_types`
- `ui_label_master`
- `employment_type_master`
- `qualification_master`
- `request_type_master`
- `shift_types`
- `stores`
- `staff`
- `shift_requirements`
- `shift_assignments`
- `leave_requests`
- `paid_leave_balances`

業種対応 DB の考え方は [multi-business-db.md](/Users/Yuuki/Documents/3.個人用/hotel/my-app/docs/multi-business-db.md) にまとめています。

## 業種設定 API

Web サーバーとして起動しているときは、業種設定は DB から次の API で取得します。

- `GET /api/business-types`
  業種一覧を返します。
- `GET /api/business-config/:code`
  指定業種の UI ラベル、勤務区分、申請種別などを返します。
- `GET /api/app-state?business=:code&month=:label`
  ログイン担当者に許可された `stores / staff / leave_requests / shift_requirements / shift_assignments` をまとめて返します。
- `POST /api/staff`
  許可された店舗配下にスタッフを追加します。
- `POST /api/leave-requests`
  許可されたスタッフの申請を追加します。
- `PATCH /api/leave-requests/:id`
  申請ステータスを更新します。
- `PATCH /api/shift-assignments`
  シフトセル更新を保存します。

サーバー側の実装は [route.ts](/Users/Yuuki/Documents/3.個人用/hotel/my-app/app/api/business-types/route.ts) と [route.ts](/Users/Yuuki/Documents/3.個人用/hotel/my-app/app/api/business-config/[code]/route.ts)、DB 参照ロジックは [business-config-db.ts](/Users/Yuuki/Documents/3.個人用/hotel/my-app/lib/business-config-db.ts) にあります。

## 停止と再初期化

停止:

```bash
docker compose down
```

ボリュームごと削除して初期化し直す場合:

```bash
docker compose down -v
```

`docker-entrypoint-initdb.d` は初回起動時だけ実行されるため、DB 初期 SQL を変えた場合は `down -v` でボリュームを消して作り直してください。

今回のように認証テーブルや seed を追加した場合も、既存ボリュームを使っている環境では次を実行して DB を作り直してください。

```bash
docker compose down -v
docker compose up --build
```
