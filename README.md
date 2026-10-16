# DY ERP

DY 管理公司的资金与费用工作台：客户公司的 PayPal → Airwallex → 钱包资金流对账，业务支出与公司开支，多用户权限。

## 技术栈

- Next.js 16（App Router）+ TypeScript + Tailwind CSS v4
- Supabase：Postgres（表结构与 RLS 权限）、Auth（邮箱登录）、Storage（费用凭证）
- 部署：Vercel（网页与接口）；定时任务放在 Supabase（pg_cron）

## 模块进度

| 步骤 | 内容 | 状态 |
| --- | --- | --- |
| 1 地基 | 登录、用户与角色、公司与账户主数据、应用壳、设计系统 | ✅ |
| 2 支出 | 业务支出、公司开支、凭证上传、承担方、月度固定项 | 进行中 |
| 3 收入 | PayPal / Airwallex / 钱包同步、对账批次、费率规则 | 待做 |
| 4 通知 | Telegram 通知、后台定时同步、汇率抓取 | 待做 |
| 5 报表 | 按公司/月份/币种汇总、分润结算 | 待做 |

## 第一次部署（只做一次）

### 1. Supabase 建表

在 Supabase 控制台左侧 **SQL Editor** → New query，把 `supabase/migrations/0001_foundation.sql` 的全部内容粘贴进去，点 **Run**。

### 2. 创建第一个账号

Supabase 控制台 → **Authentication → Users → Add user → Create new user**：填邮箱和密码，勾选 **Auto Confirm User**。
系统里第一个用户会自动成为管理员，之后的用户都在系统内「用户与权限」页面创建。

### 3. Vercel 导入

1. Vercel → Add New → Project → Import `OmniStackGlobal/DY-ERP`
2. Framework 自动识别为 Next.js，不用改
3. **Environment Variables** 填三项（值在 Supabase → Settings → API）：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`（Publishable key）
   - `SUPABASE_SERVICE_ROLE_KEY`（service_role，只在服务端用）
4. Deploy。之后每次推送到 `main` 自动上线。

### 4. 以后改表不用动手（可选）

GitHub 仓库 → Settings → Secrets and variables → Actions，添加三个 secret 后，`supabase/migrations/` 有新文件推上来会自动应用：

- `SUPABASE_ACCESS_TOKEN`：supabase.com/dashboard/account/tokens 生成
- `SUPABASE_DB_PASSWORD`：建项目时的数据库密码
- `SUPABASE_PROJECT_REF`：项目 URL 里 `https://<ref>.supabase.co` 的 `<ref>`

## 权限模型

| 角色 | 能做什么 |
| --- | --- |
| 管理员 admin | 全部；管理用户、公司、费率 |
| 财务 finance | 看全部数据；录入与修改费用、对账 |
| 经办人 staff | 只能录入和查看自己经手的费用；可见公司由管理员指定 |
| 只读 viewer | 只读查看被授权公司的数据 |

规则都写在数据库的 RLS 策略里（`supabase/migrations`），前端只是不显示没权限的入口。

## 本地开发

```bash
npm install
cp .env.example .env.local   # 填入 Supabase 的三个值
npm run dev
```

改了表结构后重新生成类型（需要能连到数据库）：

```bash
npx supabase gen types typescript --db-url "<数据库连接串>" --schema public > src/lib/db/database.types.ts
npx prettier --write src/lib/db/database.types.ts
```

## 目录

```
src/app/(auth)/login        登录
src/app/(app)/              登录后的页面（工作台、设置…）
src/components/shell        侧栏与应用壳
src/components/ui           基础组件（按钮、输入、表格、滑出面板…）
src/lib/supabase            服务端 / 浏览器端客户端
src/lib/auth.ts             当前用户与角色校验
supabase/migrations         数据库表结构与权限
```
