# Style & Trim

Style & Trim 是一個理髮預約系統，前端以 React 建構，後端規劃採 FastAPI + PostgreSQL。
目前專案已完成顧客前台、登入註冊、預約流程、我的預約與員工後台的整體架構。

## 專案定位

- 顧客可以瀏覽首頁、作品、設計師與服務
- 顧客可以登入、註冊並完成線上預約
- 顧客可以查看自己的預約並進行改期或取消
- 理髮師與管理員可以進入後台處理預約

## 技術棧

- 前端：React 18、React Router DOM 6、Vite
- 後端：FastAPI、SQLAlchemy、Pydantic Settings、PyJWT
- 資料庫：PostgreSQL
- 部署：Vercel 前端、Render 後端

## 主要功能

- 首頁：品牌介紹、作品展示、設計師展示、服務展示
- 登入 / 註冊：會員入口與帳號建立
- 預約頁：服務選擇、加購、日期時間、指定設計師、聯絡資料
- 我的預約：查看個人預約、取消預約
- 後台：預約列表、確認、完成、取消、改期與統計

## 路由

- `/`：首頁
- `/works`：作品集
- `/designers/:designerId`：設計師介紹
- `/login`：登入 / 註冊
- `/booking`：預約頁
- `/appointments`：我的預約
- `/dashboard`：員工後台

## 系統設計

- 前端以單頁應用方式運作，使用 Hash Router 管理導頁
- `AppContext` 集中管理登入狀態、資料載入、忙碌狀態與錯誤訊息
- `ProtectedRoute` 負責登入保護與角色權限控制
- `src/services/api.js` 負責串接正式 API 與 token 續期
- 後端規劃以 JWT + refresh token 驗證，並以 role guard 控制不同權限
- 預約資料會保存價格快照、設計師快照與加購快照，避免後續資料變動影響歷史紀錄

## 開發方式

前端開發：

```bash
cmd /c npm install
cmd /c npm run dev
```

前端打包：

```bash
cmd /c npm run build
```

後端開發：

```bash
cd backend
python -m uvicorn app.main:create_app --factory --reload
```

後端測試：

```bash
cd backend
pytest
```

## 專案內容

- `src/`：React 前端
- `backend/`：FastAPI 後端與資料模型
- `frontend-spec.md`：顧客前台內容與視覺規格
- `backend-spec.md`：FastAPI / PostgreSQL 後端規格

## 目前狀態

- 前端已具備主要頁面與路由
- 後端已有完整 API 規格與資料模型
- 目前前端仍保留 mock / API 兼容設計，方便逐步切換正式資料來源
