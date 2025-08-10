# Hono OAuth認証サーバー (BFF)

## 📄 プロジェクト概要
このプロジェクトは、**BFF（Backend For Frontend）**として機能するHono OAuth認証サーバーです。フロントエンド（Next.js）とバックエンド（Rails）の間に位置し、認証・認可を一元管理します。
システム構成

```bash
Next.js (Client)     ※ フロントエンドロジック
    ↓
Hono (BFF)          ※ 認証機関・APIゲートウェイ
    ↓
Rails (Backend)     ※ CRUD・ビジネスロジック処理機関
役割分担
```

1.Next.js: UIコンポーネント、ユーザーインタラクション

2.Hono BFF: OAuth認証、JWT発行・検証、APIプロキシ、セキュリティ

3.Rails API: データベース操作、ビジネスロジック、CRUD処理


## サポートする認証フロー

`ウェブアプリケーション:` ブラウザのリダイレクトとHTTPクッキーを使用する従来の認証フロー

`モバイルアプリケーション:` カスタムヘッダーとJSONレスポンスを使用する現代的な認証フロー

## ✨ 特徴

`マルチプロバイダー対応`: Google, LINE, GitHubでの認証をサポート

`クロスプラットフォーム対応`: ウェブとモバイル（Flutterなどを想定）の両方のクライアントに柔軟に対応

`JWTベースの認証`: Honoが発行するJWT（JSON Web Token）で、安全なAPIアクセスを実現

`クリーンなコードベース`: プラットフォームごとに認証ロジックを分離（`webAuth.mjs`, `mobileAuth.mjs`）し、高い保守性を実現

## 🛠️ 前提条件
プロジェクトを実行する前に、以下のソフトウェアがインストールされていることを確認してください。

`Node.js (v18以上を推奨)`
`npm`

## ⚙️ 環境設定
OAuth認証を機能させるために、各プロバイダーから認証情報を取得し、プロジェクトの環境変数に設定する必要があります。

### 1. 環境変数ファイルの作成
プロジェクトのルートディレクトリに .env ファイルを作成します。

### 2. OAuth認証情報の取得
各OAuthプロバイダーのコンソールで、CLIENT ID、CLIENT SECRET、および CALLBACK URL を取得します。

Google: Google Cloud Console
LINE: LINE Developers Console
GitHub: GitHub Developer Settings

### 3. 環境変数の設定
取得した情報を .env ファイルに以下のように記述します。
```bash
# JWT
JWT_SECRET=
# Google
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
# GITHUB
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=
# Line
LINE_CHANNEL_SECRET=
LINE_CALLBACK_URL=
# Server
SERVER_PORT=3001
SERVER_HOST=localhost
# Twitter
TWITTER_CLIENT_SECRET=
TWITTER_CALLBACK_URL=
# Facebook
FACEBOOK_CLIENT_SECRET=
FACEBOOK_CALLBACK_URL=
# domain
FE_LOCALHOST=http://localhost:3000 # 開発
FE_DOMAIN= # 本番
# 別domain(BE)
RAILS_LOCAL=http://localhost:3000 # 開発
RAILS_DOMAIN= # 本番
```

注意: [サーバーURL] は、ローカル環境であれば http://localhost:3001 などになります。

## ▶️ 実行方法
開発モードで実行

`npm run dev -- -p 3001`

## 本番環境で実行
`npm start`

## 🌐 APIエンドポイント
このサーバーは以下の認証エンドポイントを提供します。

## `ウェブ認証 (クッキーベース)`

MethodPathDescriptionGET/auth/web/:provider認証プロバイダーのログインページにリダイレクトしますGET/auth/web/:provider/callbackコールバックを処理し、JWTをクッキーに保存後、/dashboardにリダイレクトします

## `モバイル認証 (トークンベース)`
MethodPathDescriptionGET/auth/mobile/:provider認証プロバイダーのログインページにリダイレクトしますGET/auth/mobile/:provider/callbackコールバックを処理し、JWTとユーザー情報をJSONで返します
## 共通API
MethodPathDescriptionGET/auth/status現在の認証状態を確認しますGET/api/data認証必須のサンプルAPIです。有効なJWTが必要です。

## 🔐 認証フローの解説
ウェブクライアント

ユーザーが /auth/web/google にアクセスします
HonoがGoogleの認証ページにリダイレクトします
Googleでのログイン後、HonoのコールバックURLにリダイレクトされます
Honoは受け取った認証コードでJWTを発行し、クッキーに保存します
ユーザーは /dashboard にリダイレクトされ、以降のAPIアクセスではクッキーが自動で送信されます

モバイルクライアント

モバイルアプリがカスタムヘッダー X-App-Platform: flutter を付けて /auth/mobile/google にアクセスします
HonoがGoogleの認証ページにリダイレクトします
Googleでのログイン後、HonoのコールバックURLにリダイレクトされます
Honoは受け取った認証コードでJWTを発行し、JSONレスポンスとして返します
モバイルアプリはJSONからトークンを抽出し、安全な場所に保存します
以降のAPIアクセスでは、アプリが保存したトークンを Authorization ヘッダーに手動で追加して送信します

## ✅ テストの実行
このプロジェクトでは、認証機能の単体テストに`Vitest`を使用しています。
テストを実行する
`npm run test`

テストを監視モードで実行する
`npm run test:watch`

```bash
📁 プロジェクト構成
├── src/
│   ├── auth/
│   │   ├── auth.mjs            # 認証の共通ロジック（JWT検証、コールバック処理など）
│   │   ├── mobileAuth.mjs      # モバイル認証に特化したハンドラ
│   │   ├── webAuth.mjs         # ウェブ認証に特化したハンドラ
│   │   └── oauthClients.mjs    # OAuthプロバイダーごとのクライアント定義
│   ├── config/
│   │   └── index.mjs           # 環境変数や定数など、各種設定をまとめる
│   ├── middleware/
│   │   └── auth.mjs            # 認証ミドルウェア（ensureAuthenticatedなど）
│   ├── routes/
│   │   └── index.mjs           # ルーティング設定をまとめる
│   └── server.mjs              # メインのサーバー起動スクリプト
├── tests/
│   └── auth.test.mjs           # 認証機能のテスト
├── .env                        # 環境変数ファイル
├── package.json
└── README.md
```

# Nextでの利用方法

## 認証時の利用方法
```javascript
// components/GoogleLoginButton.js
'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import styles from './page.module.css';

export default function Home() {
  const handleGitHubLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const redirectUri = 'http://localhost:3001/auth/web/github/callback';
    const scope = 'read:user user:email';
    const responseType = 'code';
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${encodeURIComponent(scope)}&response_type=${responseType}`;
    window.location.href = authUrl;
  };

  const handleGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = 'http://localhost:3001/auth/web/google/callback';
    const scope = 'openid email profile';
    const responseType = 'code';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${encodeURIComponent(scope)}`;
    window.location.href = authUrl;
  };

  useEffect(() => {
    // Check for authentication response here if needed
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <button onClick={handleGitHubLogin} style={{ padding: '10px 20px', fontSize: '16px', marginRight: '10px' }}>
          Login with GitHub
        </button>
        <button onClick={handleGoogleLogin} style={{ padding: '10px 20px', fontSize: '16px' }}>
          Login with Google
        </button>
      </main>
    </div>
  );
}
```

## Rails APIへのプロキシリクエスト
```javascript
// pages/dashboard.js

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProtectedData = async () => {
      try {
        // Hono BFF経由で保護されたAPIにアクセス
        // ブラウザはリクエスト時に自動的にクッキーを添付する
        const response = await axios.get('http://localhost:3000/api/data');
        setData(response.data.message);
      } catch (error) {
        console.error('認証失敗:', error);
        // 認証失敗時はログインページにリダイレクト
        router.push('/login');
      }
    };
    fetchProtectedData();
  }, [router]);

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>ようこそ、ダッシュボードへ</h1>
      <p>BFF経由で取得したデータ: {data}</p>
    </div>
  );
};

export default Dashboard;
```

## 📄 ライセンス
このプロジェクトはMITライセンスの下で公開されています。
