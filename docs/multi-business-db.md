# Multi-Business DB Guide

## 方針

このプロジェクトの DB は `共通テーブル + 業種マスタ + seed DML` で構成します。

業種ごとにスキーマを分離せず、以下のように差分をマスタへ寄せます。

- `business_types`
- `ui_label_master`
- `employment_type_master`
- `qualification_master`
- `request_type_master`
- `shift_types`

業務データは共通テーブルへ入ります。

- `stores`
- `staff`
- `shift_requirements`
- `shift_assignments`
- `leave_requests`
- `paid_leave_balances`

## 初期化ファイル

`docker/db/init` 配下は次の役割に分けています。

```text
001_schema.sql
  DDL のみ。共通テーブルと業種マスタを作成

010_seed_business_types.sql
  業種マスタ、UI ラベル、勤務区分、申請種別を投入

020_seed_hotel.sql
  ホテル用の店舗・スタッフ seed

021_seed_restaurant.sql
  飲食店用の店舗・スタッフ seed
```

## 追加業種を増やす手順

1. `business_types` に業種を追加
2. `ui_label_master` に画面ラベルを追加
3. `employment_type_master` を追加
4. `qualification_master` を追加
5. `request_type_master` を追加
6. `shift_types` を追加
7. `stores` と `staff` の seed SQL を追加

## 反映方法

`docker-entrypoint-initdb.d` は初回起動時にしか実行されません。既存ボリュームに対して schema を差し替えても自動反映されないので、再初期化が必要です。

```bash
docker compose down -v
docker compose up --build
```

## 次段の実装候補

- フロントの JSON 設定を DB マスタ読みに置き換える
- `shift_requirements` と `shift_assignments` の seed を業種別に追加する
- API から `business_types` を取得して業種切替を DB ベースにする
