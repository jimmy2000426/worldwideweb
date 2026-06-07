# Style & Trim Backend Spec

## 1. 架構總覽
第一版後端路線採用：

- 後端：`Python + FastAPI`
- 資料庫：`PostgreSQL`
- 登入：`JWT + refresh token`
- 使用者模型：單一 `users` 表 + `role` 欄位
- 預約：單一服務 + 可選加購
- 理髮師指派：支援系統自動配對，也支援顧客手動指定
- 時段：固定時段制 + 後台可調整
- 衝突檢查：同時檢查顧客與理髮師，避免重複預約
- API 風格：統一路由結構，由 role guard 控制顧客、理髮師、管理員權限

## 2. 使用者與權限
### 角色
- `customer`：一般顧客，可登入、預約、查看自己的預約資料。
- `barber`：理髮師，可處理預約與後台工作內容。
- `admin`：管理員，擁有完整後台權限。

### 認證原則
- 使用短效 access token 與長效 refresh token。
- refresh token 要能輪替與撤銷。
- refresh token 應存成獨立記錄，支援多裝置登入。
- 登出時要能使 token 失效，避免舊登入狀態繼續使用。
- 所有需要授權的 API 都要由 JWT 驗證，並再做 role 權限判斷。

## 3. 資料模型原則
### users
單一 `users` 表負責登入、角色與基本帳號資料。

建議欄位：
- `id`
- `email`
- `phone`
- `password_hash`
- `name`
- `role`
- `is_active`
- `created_at`
- `updated_at`

### refresh_tokens
獨立 token 表用來保存 refresh token 與輪替狀態。

建議欄位：
- `id`
- `user_id`
- `token_hash`
- `jti`
- `expires_at`
- `revoked_at`
- `replaced_by_token_id`
- `created_at`
- `last_used_at`

### services
服務表用來保存單一服務資料與價格 / 時長。

建議欄位：
- `id`
- `name`
- `description`
- `base_price`
- `duration_minutes`
- `is_active`

### addons
加購表用來保存可選加購項目。

建議欄位：
- `id`
- `name`
- `description`
- `price`
- `is_active`

### barber_profiles
若後續要保存理髮師專屬資訊，可用獨立擴充表。

建議欄位：
- `id`
- `user_id`
- `display_name`
- `bio`
- `specialty`
- `is_available`

### availability_slots
時段與可用性規則建議獨立管理。

建議欄位：
- `id`
- `barber_id`
- `date`
- `start_time`
- `end_time`
- `is_available`
- `source`（例如系統產生或手動調整）

### appointments
預約資料至少要能保存：

- 顧客
- 理髮師
- 服務
- 加購
- 日期
- 時段
- 狀態
- 價格快照

建議欄位：
- `id`
- `customer_id`
- `barber_id`
- `service_id`
- `appointment_date`
- `start_time`
- `end_time`
- `status`
- `base_price_snapshot`
- `addon_price_snapshot`
- `total_price_snapshot`
- `notes`
- `created_at`
- `updated_at`

### appointment_addons
若一筆預約可帶多個加購，建議用關聯表保存。

建議欄位：
- `appointment_id`
- `addon_id`
- `addon_name_snapshot`
- `addon_price_snapshot`

### 設計原則
- 預約價格要保留建立當下的快照，不只依賴動態計算。
- 服務與加購資料應保留擴充空間。
- 預留未來可加入分店、員工排班、營業日與更多服務類型的空間。
- 預約狀態第一版固定為 `待確認 / 已確認 / 已完成 / 已取消`。

## 4. API 規格原則
### API 分類
- 認證 API
- 會員 API
- 預約 API
- 後台 API

### API 命名與分層
- 採統一路由設計，不另外拆成顧客版 / 後台版兩套完全不同 API。
- 由 JWT 驗證與 role guard 控制可用功能。
- 所有 API 都應回傳一致格式，讓前端能穩定處理成功與失敗。

### 回應格式建議
成功：
```json
{
  "success": true,
  "data": {},
  "message": "ok"
}
```

失敗：
```json
{
  "success": false,
  "error": {
    "code": "APPOINTMENT_CONFLICT",
    "message": "該時段已被預約"
  }
}
```

### 認證 API
#### `POST /auth/register`
- 建立新使用者。
- 預設註冊角色為 `customer`。
- 要驗證 email / phone / 密碼規則。

#### `POST /auth/login`
- 支援 email 或手機登入。
- 回傳 access token、refresh token 與基本使用者資料。

#### `POST /auth/refresh`
- 使用 refresh token 換新 access token。
- 若 refresh token 被撤銷、過期或被替換，需回傳失敗。

#### `POST /auth/logout`
- 撤銷目前 refresh token。
- 讓前端登出後無法繼續用舊 token 續期。

#### `GET /auth/me`
- 回傳目前登入者資訊與角色。

### 會員 API
#### `GET /me/profile`
- 取得目前使用者資料。

#### `PATCH /me/profile`
- 更新姓名、手機等個人資料。

#### `GET /me/appointments`
- 顧客查看自己的預約。

### 預約 API
#### `GET /services`
- 回傳可預約服務。

#### `GET /addons`
- 回傳可加購項目。

#### `GET /barbers`
- 回傳可用理髮師清單。

#### `GET /barbers/availability`
- 查詢特定日期與時段可用的理髮師。

#### `POST /appointments`
- 建立預約前必須檢查衝突。
- 若顧客未指定理髮師，系統自動找可用人選。
- 若顧客手動指定理髮師，必須驗證可用性。
- 建立時需寫入價格快照與狀態。

#### `GET /appointments/:id`
- 查看單筆預約。

#### `PATCH /appointments/:id/reschedule`
- 改期。
- 改期時要重新檢查顧客與理髮師衝突。

#### `PATCH /appointments/:id/cancel`
- 取消預約。

### 後台 API
#### `GET /admin/appointments`
- 取得後台預約清單，可支援日期、狀態、理髮師過濾。

#### `PATCH /admin/appointments/:id/confirm`
- 將預約改為 `已確認`。

#### `PATCH /admin/appointments/:id/complete`
- 將預約改為 `已完成`。

#### `PATCH /admin/appointments/:id/cancel`
- 將預約改為 `已取消`。

#### `GET /admin/availability`
- 查詢可調整的時段資料。

#### `PATCH /admin/availability`
- 調整某位理髮師的可用時段。

#### `GET /admin/reports`
- 提供營收與預約統計資料，供後台報表使用。

## 5. 預約與排程規則
### 時段規則
- 第一版採固定時段制。
- 後台可以調整某位理髮師的可用時段。
- 每筆服務需對應到可用開始時間與結束時間。

### 自動配對規則
- 若顧客未指定理髮師，系統應找出該服務、該時段可用的理髮師。
- 若有多位可用，後端可先回傳第一個可用者或一組候選名單，前端再決定是否顯示給使用者。
- 若沒有可用理髮師，要回傳明確錯誤。

### 手動指定規則
- 若顧客手動指定理髮師，API 必須檢查該理髮師在該時段是否空閒。
- 若衝突，預約不得建立。

### 衝突檢查規則
- 同一顧客同一時段不能重複預約。
- 同一理髮師同一時段不能重複接單。
- 建立、改期、確認與手動調整時都要檢查衝突。

## 6. 前端協作原則
- 現有前台頁面先保留，不要因為後端化而整頁重寫。
- `localStorage` 只當過渡期輔助，不應成為正式資料來源。
- 前端之後要透過 API 取得登入狀態、預約清單與後台資料。
- 若要改動既有按鈕或 Modal，必須先確認現有 JavaScript 是否依賴那些 `id` 或 `class`。
- 前端錯誤訊息應盡量直接對應 API error code，避免硬寫死文案。

## 7. 驗收重點
- 未登入者不能直接建立預約。
- 顧客登入後可以建立預約並看到自己的紀錄。
- 理髮師登入後可以進入後台並處理預約。
- 管理員可以看到完整後台功能。
- 同一顧客同一時段不能重複預約。
- 同一理髮師同一時段不能重複接單。
- 當所有理髮師都忙碌時，系統要能明確回報無可用人選。
- refresh token 過期、被撤銷或被替換時，前端要能正確要求重新登入。

## 8. 實作提醒
- 第一版先用單站式前後端分離，不拆微服務。
- 先沿用現有前端結構，後續再逐步接 API。
- 如果之後新增多分店、多班表、多服務組合，再擴充資料表與規則。
- 任何新增欄位或 API，如果會影響前端與後台共用流程，必須先更新本文件再實作。

## 9. 資料庫約束與索引
這一節補上實作時最常忽略，但最容易出問題的細節。

### users
- `email` 應為唯一。
- `phone` 若有填寫，建議唯一。
- `role` 應限制為固定值：`customer`、`barber`、`admin`。
- `is_active = false` 的帳號不得登入。

建議索引：
- `idx_users_role`
- `idx_users_email_unique`
- `idx_users_phone_unique`

### refresh_tokens
- `token_hash` 不應明文儲存 refresh token。
- 同一 `jti` 只能對應一筆有效 token 記錄。
- `revoked_at` 有值代表 token 已失效。
- 被輪替的舊 token 必須標記 `replaced_by_token_id`。

建議索引：
- `idx_refresh_tokens_user_id`
- `idx_refresh_tokens_jti_unique`
- `idx_refresh_tokens_expires_at`

### services / addons
- `name` 建議唯一或至少在同類別中唯一，避免前端顯示重複。
- `is_active = false` 的項目不得出現在預約選單。

建議索引：
- `idx_services_is_active`
- `idx_addons_is_active`

### barber_profiles
- `user_id` 應唯一，避免同一位理髮師重複建立 profile。
- 若 `is_available = false`，自動配對不得將其視為可用。

建議索引：
- `idx_barber_profiles_user_id_unique`
- `idx_barber_profiles_is_available`

### availability_slots
- 同一位理髮師、同一天、同一時段不應重複建立可用槽位。
- 可用時段的新增 / 修改應在交易內完成，避免併發衝突。

建議唯一約束：
- `barber_id + date + start_time + end_time`

建議索引：
- `idx_availability_slots_barber_date`
- `idx_availability_slots_date_time`

### appointments
- 同一位顧客同一時段不得有兩筆有效預約。
- 同一位理髮師同一時段不得有兩筆有效預約。
- 取消狀態的預約仍應保留紀錄，但不再算進衝突檢查。
- 改期應視為先檢查新時段，再更新資料。

建議索引：
- `idx_appointments_customer_date_time`
- `idx_appointments_barber_date_time`
- `idx_appointments_status`
- `idx_appointments_created_at`

### appointment_addons
- 一筆預約可對應多個加購。
- 同一加購項目如被重複選取，應在服務端決定是否允許或去重。

建議索引：
- `idx_appointment_addons_appointment_id`
- `idx_appointment_addons_addon_id`

## 10. 交易與一致性規則
建立、改期、取消、完成預約時，請遵守以下原則：

- 任何會改動預約狀態的操作，都應在資料庫交易中完成。
- 建立預約時，先檢查顧客衝突，再檢查理髮師衝突，最後寫入資料。
- 若配對理髮師失敗，不得留下半成品預約資料。
- 若建立預約成功，相關加購關聯資料也要一併寫入。
- 若資料寫入途中失敗，整筆交易應回滾。
- 同步更新 `updated_at`，方便前端與後台顯示最新變更時間。

### 建議的狀態轉移
- `待確認` -> `已確認`
- `待確認` -> `已取消`
- `已確認` -> `已完成`
- `已確認` -> `已取消`

原則：
- `已完成` 不應再直接改回 `待確認`
- `已取消` 預約原則上不再回復為有效預約
- 若未來要支援重新啟用取消預約，應另外定義清楚的復原流程，不要直接覆寫原紀錄

## 11. 錯誤碼規格
前端需要穩定辨識錯誤，因此後端應回傳固定錯誤碼。

### 認證類
- `AUTH_INVALID_CREDENTIALS`：帳號或密碼錯誤
- `AUTH_ACCOUNT_INACTIVE`：帳號已停用
- `AUTH_TOKEN_EXPIRED`：access token 過期
- `AUTH_REFRESH_EXPIRED`：refresh token 過期
- `AUTH_REFRESH_REVOKED`：refresh token 已撤銷
- `AUTH_UNAUTHORIZED`：未登入或 token 無效

### 權限類
- `FORBIDDEN_ROLE`：角色權限不足
- `FORBIDDEN_ADMIN_ONLY`：僅管理員可用
- `FORBIDDEN_BARBER_ONLY`：僅理髮師可用

### 預約類
- `APPOINTMENT_CONFLICT`：顧客或理髮師時段衝突
- `APPOINTMENT_NOT_FOUND`：預約不存在
- `APPOINTMENT_INVALID_STATUS`：狀態不允許此操作
- `APPOINTMENT_NO_BARBER_AVAILABLE`：無可用理髮師
- `APPOINTMENT_SERVICE_INACTIVE`：服務已停用
- `APPOINTMENT_ADDON_INACTIVE`：加購已停用

### 資料驗證類
- `VALIDATION_ERROR`：欄位驗證失敗
- `DUPLICATE_EMAIL`：email 已存在
- `DUPLICATE_PHONE`：手機已存在
- `INVALID_DATE_RANGE`：日期或時間格式錯誤

## 12. 上線前最小交付範圍
若第一版要先上線，建議至少完成：

- 登入 / 註冊 / 登出 / refresh token 流程
- 服務與加購查詢 API
- 預約建立、查詢、改期、取消 API
- 後台預約查詢與狀態操作
- 預約衝突檢查與無可用理髮師處理
- 前端改接 API，移除對 `localStorage` 的正式依賴

## 13. 後續擴充方向
若之後要再擴充，建議優先順序如下：

1. 多分店支援
2. 員工排班與休假
3. 更細的預約狀態與提醒通知
4. 簡訊 / Email 通知
5. 報表與營收分析
6. 線上付款與退款流程
