/**
 * 数据库类型。
 * `database.types.ts` 由 Supabase CLI 从迁移后的库生成（见 README「改表流程」），不要手改。
 * 这里只给常用表起短名字。
 */
import type { Enums, Tables } from "./database.types";

export type { Database, Json } from "./database.types";

export type UserRole = Enums<"user_role">;
export type CompanyKind = Enums<"company_kind">;
export type AccountProvider = Enums<"account_provider">;
export type WalletChain = Enums<"wallet_chain">;
export type ExpenseScope = Enums<"expense_scope">;
export type ExpenseSharing = Enums<"expense_sharing">;

export type Profile = Tables<"profiles">;
export type Company = Tables<"companies">;
export type CompanyAccess = Tables<"company_access">;
export type Account = Tables<"accounts">;
export type ExpenseCategory = Tables<"expense_categories">;
export type Expense = Tables<"expenses">;
export type ExpenseAttachment = Tables<"expense_attachments">;
export type FxRate = Tables<"fx_rates">;
export type AuditLog = Tables<"audit_log">;
