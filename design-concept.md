# Visable 設計概念

Visable 是一個為美國留學生設計的求職平台，提供以下功能：
- 尋找 H-1B 工作
- 交流面試與工作心得
- 分享社群討論
- 保存個人文件與求職資料

## 技術棧
- **前端框架**: React
- **後端架構**: Supabase (PostgreSQL)
- **樣式**: SCSS
- **第三方工具**: Ant Design (UI 組件), ScrapingDog API (工作資料)

## 數據結構

### 主要表格

#### users
- `id`: uuid (主鍵)
- `email`: text (唯一)
- `password_hash`: text (可空，Google 登入不需要密碼)
- `created_at`: timestamp
- `updated_at`: timestamp
- `vpoint`: integer (默認 0)
- `resume`: text (URL 到存儲的簡歷，可空)
- `cover_letter`: text (URL 到存儲的求職信，可空)

#### boards
- `id`: uuid (主鍵)
- `name`: character varying(100) (唯一)
- `description`: text (可空)
- `created_at`: timestamp

#### posts
- `id`: uuid (主鍵)
- `user_id`: uuid (外鍵到 users)
- `board_id`: uuid (外鍵到 boards，可空)
- `board_name`: character varying(100) (冗餘欄位，加速查詢)
- `title`: character varying(200)
- `content`: text
- `is_anonymous`: boolean (默認 false)
- `category`: text (當 "career" 時，表示職業見解帖)
- `company_name`: text (職業見解相關)
- `job_title`: text (職業見解相關)
- `location`: text (職業見解相關)
- `base_salary`: numeric (職業見解相關)
- `image_path`: text (可空)
- `created_at`: timestamp

#### comments
- `id`: uuid (主鍵)
- `post_id`: uuid (外鍵到 posts)
- `user_id`: uuid (外鍵到 users)
- `content`: text
- `created_at`: timestamp

#### jobs
- `id`: uuid (主鍵)
- `job_id`: text (唯一，來自爬蟲)
- `job_position`: text
- `job_link`: text
- `company_name`: text
- `company_profile`: text (可空)
- `job_location`: text
- `job_posting_date`: date (可空)
- `company_logo_url`: text (可空)
- `created_at`: timestamp

#### saved_jobs
- `id`: uuid (主鍵)
- `user_id`: uuid (外鍵到 users)
- `job_id`: text (外鍵到 jobs.job_id)
- `created_at`: timestamp

### 關聯關係
- 用戶 (users) -> 帖子 (posts): 一對多
- 討論版 (boards) -> 帖子 (posts): 一對多
- 帖子 (posts) -> 評論 (comments): 一對多
- 用戶 (users) -> 評論 (comments): 一對多
- 用戶 (users) -> 保存工作 (saved_jobs): 一對多
- 工作 (jobs) <- 保存工作 (saved_jobs): 一對多

## 網站結構

### 頁面
1. **首頁** (HomePage): 顯示最新的社區帖子與最近發布的帖子側邊欄
2. **社區/討論版** (BoardPage): 按版塊分類的帖子
   - Visa Discussion
   - Resume
   - Career
   - Interview
3. **職業見解** (CareerInsightPage): 薪資和面試經驗分享
4. **工作機會** (JobsPage): H-1B 工作列表與詳情
5. **帳戶管理** (AccountPage): 個人信息與設置
   - 個人帳號
   - 收藏的工作
   - 文件管理 (簡歷和求職信)
6. **帖子詳情** (PostDetailPage): 查看單一帖子詳情及評論

### 組件結構
- **MainLayout**: 整體布局
  - Navbar: 頂部導航欄
  - Sidebar: 側邊欄導航
  - MainContent: 主內容區域
- **Post Components**: 帖子相關組件
  - PostCard: 帖子預覽卡片
  - PostDetailPage: 帖子詳細頁面
  - CreatePostModal: 發帖彈窗
- **Job Components**: 工作相關組件
  - JobCard: 工作預覽卡片
  - FilterButton: 工作過濾按鈕

## 用戶功能

### 認證系統
- **Google 登入**: 目前主要支持 Google OAuth 登入
- **觸發器同步**: 新用戶在 auth.users 創建時自動同步到 public.users

### 發帖系統
- **普通帖子**:
  - 需要選擇討論版
  - 支持匿名選項
- **職業見解帖子**:
  - 無需選擇討論版，直接歸類為 Career
  - 需填寫公司名稱、職位名稱等相關信息
  - 可選填薪資信息

### 評論系統
- 登入用戶可以對帖子進行評論
- 用戶只能刪除自己的評論
- 評論支持帖子作者與讀者之間的交流

### 工作功能
- **工作搜索**: 支持多種過濾條件
  - 職缺發布時間
  - 經驗要求
  - 職缺類型
- **工作收藏**: 用戶可以收藏感興趣的工作
- **工作申請**: 可以點擊申請按鈕前往原工作鏈接

### 文件管理
- **簡歷上傳**: 支持 PDF, DOC, DOCX 格式
- **求職信上傳**: 支持 PDF, DOC, DOCX 格式
- 文件存儲在 Supabase Storage 中，與用戶帳戶關聯

## 安全與權限

### 行級安全性 (RLS)
- **用戶數據**: 用戶只能訪問自己的數據
- **帖子**: 任何人可查看，但僅登入用戶可發布
- **評論**: 任何人可查看，僅登入用戶可評論，僅作者可刪除自己的評論
- **討論版**: 所有用戶可查看，僅管理員可創建

### 資料觸發器
- **用戶創建觸發器**: 同步 Auth 用戶到 public.users
- **討論版名稱觸發器**: 自動更新 posts.board_name 當 board_id 變更時

## UI 設計原則

### 顏色系統
- **主色系**: 藍色系 (#0056E5)
- **輔助色系**: 灰色系
- **狀態色**:
  - 成功: #28a745
  - 錯誤: #dc3545
  - 警告: #ffc107

### 組件風格
- **按鈕**: 圓角，主要使用藍色或灰色背景
- **卡片**: 白底，輕微陰影，懸浮時微小高度變化
- **表單**: 簡潔，清晰的標籤與錯誤提示

### 布局
- **響應式**: 支持桌面與平板設備
- **側邊欄**: 固定寬度，顯示主要導航
- **內容區**: 滑動溢出，適應不同內容大小

## 網站流程

### 用戶註冊/登入流程
1. 點擊導航欄中的 "Signup/Login"
2. 選擇使用 Google 帳號登入
3. 重定向回網站，自動同步用戶數據

### 發帖流程
1. 點擊 "Create" 按鈕
2. 選擇帖子類型 (普通貼文或職業見解)
3. 根據帖子類型填寫相應表單
4. 提交發布

### 工作搜索流程
1. 導航至工作頁面
2. 使用過濾器縮小搜索範圍
3. 瀏覽工作列表
4. 點擊工作卡片查看詳情
5. 可選擇保存或申請工作

### 討論版交流流程
1. 從側邊欄選擇討論版
2. 瀏覽該版塊的帖子
3. 點擊帖子查看詳情
4. 閱讀和發表評論

## 未來開發計劃

### 功能擴展
- 個人資料完善 (頭像、個人簡介等)
- 工作推薦系統
- 薪資比較工具
- 直接在平台申請工作
- 面試準備資源

### 技術改進
- 實時通知系統
- 性能優化
- 擴展移動端支持
- 增強搜索功能
- 集成更多求職相關API

---

**最後更新**: 2023年11月
