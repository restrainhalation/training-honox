# training-honox

HonoX の学習用リポジトリです。

## ローカル環境

### 構築

1. 開発ツールをインストール

    <details>
    <summary>
    Volta
    </summary>

    ```sh
    # Volta をインストール
    curl https://get.volta.sh | bash

    # Node.js 22.6.0 をインストール
    volta install node@22.6.0

    # Volta が現在アクティブにしている Node.js のバージョンを確認
    volta list node -c

    # Node.js のバージョンを確認
    node -v
    ```

    </details>

    <details>
    <summary>
    Bun
    </summary>

    ```sh
    # Bun をインストール
    curl -fsSL https://bun.sh/install | bash
    ```

    </details>

2. <details>
    <summary>
    設定ファイル wrangler.toml を作成
    </summary>

    ```toml
    name = "training-honox"
    compatibility_date = "2024-04-01"
    compatibility_flags = [ "nodejs_compat" ]
    pages_build_output_dir = "./dist"

    [[d1_databases]]
    binding = "DB"
    database_name = "training-honox"
    database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    preview_database_id = "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy"
    migrations_dir = "./db/migrations"
    ```

    </details>

3. <details>
    <summary>
    実行環境を作成
    </summary>

    ```sh
    # パッケージをインストール
    bun i

    # マイグレーションを適用
    yes | bun wrangler d1 migrations apply training-honox --local
    ```

    </details>

### 実行

```sh
# 開発サーバー
bun run dev
```

```sh
# プロダクションビルドのプレビュー
bun run build
bun run preview
```
