"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CURRENCIES } from "@/lib/format";
import { errorMessage, fail, type ActionResult } from "@/lib/utils";

const companySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "请填写公司名称").max(60),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{1,8}$/, "代码用 1–8 位字母或数字，例如 AN"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "颜色格式不正确"),
  note: z.string().trim().max(500).default(""),
  is_active: z.boolean().default(true),
});

export type CompanyInput = z.input<typeof companySchema>;

export async function saveCompany(input: CompanyInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole("admin");
    const parsed = companySchema.safeParse(input);
    if (!parsed.success) return fail("请检查填写内容", zodFields(parsed.error));
    const { id, ...data } = parsed.data;
    const supabase = await createClient();
    if (id) {
      const { error } = await supabase.from("companies").update(data).eq("id", id);
      if (error) return fail(dbMessage(error.message));
      await supabase.rpc("log_action", { p_action: "company.update", p_entity: "company", p_entity_id: id, p_detail: { name: data.name } });
      revalidatePath("/settings/companies");
      revalidatePath("/");
      return { ok: true, data: { id }, message: "公司已更新" };
    }
    const { data: row, error } = await supabase.from("companies").insert({ ...data, kind: "client" }).select("id").single();
    if (error || !row) return fail(dbMessage(error?.message));
    await supabase.rpc("log_action", { p_action: "company.create", p_entity: "company", p_entity_id: row.id, p_detail: { name: data.name } });
    revalidatePath("/settings/companies");
    revalidatePath("/");
    return { ok: true, data: { id: row.id }, message: "公司已添加" };
  } catch (e) {
    return fail(errorMessage(e));
  }
}

const accountSchema = z
  .object({
    id: z.string().uuid().optional(),
    company_id: z.string().uuid("请选择所属公司"),
    provider: z.enum(["paypal", "airwallex", "wallet"]),
    name: z.string().trim().min(1, "请填写账户名称").max(60),
    identifier: z.string().trim().max(120).default(""),
    currency: z.enum(CURRENCIES),
    holder_name: z.string().trim().max(80).default(""),
    chain: z.enum(["tron", "ethereum", "base"]).nullable().default(null),
    address: z.string().trim().max(120).nullable().default(null),
    bank_account_id: z.string().uuid().nullable().default(null),
    wallet_account_id: z.string().uuid().nullable().default(null),
    note: z.string().trim().max(500).default(""),
    is_active: z.boolean().default(true),
  })
  .superRefine((a, ctx) => {
    if (a.provider === "wallet") {
      if (!a.chain) ctx.addIssue({ code: "custom", path: ["chain"], message: "请选择网络" });
      const addr = a.address ?? "";
      if (a.chain === "tron" && !/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(addr))
        ctx.addIssue({ code: "custom", path: ["address"], message: "Tron 地址格式不正确" });
      if ((a.chain === "ethereum" || a.chain === "base") && !/^0x[a-fA-F0-9]{40}$/.test(addr))
        ctx.addIssue({ code: "custom", path: ["address"], message: "Ethereum / Base 地址格式不正确" });
      if (a.chain === "tron" && a.currency !== "USDT")
        ctx.addIssue({ code: "custom", path: ["currency"], message: "Tron 网络目前只读取 USDT" });
      if ((a.chain === "ethereum" || a.chain === "base") && a.currency !== "USDC")
        ctx.addIssue({ code: "custom", path: ["currency"], message: "Ethereum / Base 目前只读取 USDC" });
    }
    if (a.provider === "airwallex" && !/^\d{0,8}$/.test(a.identifier))
      ctx.addIssue({ code: "custom", path: ["identifier"], message: "填写账号尾号（数字）" });
  });

export type AccountInput = z.input<typeof accountSchema>;

export async function saveAccount(input: AccountInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole("admin", "finance");
    const parsed = accountSchema.safeParse(input);
    if (!parsed.success) return fail("请检查填写内容", zodFields(parsed.error));
    const { id, ...data } = parsed.data;
    const supabase = await createClient();

    // 关联账户必须属于同一家公司
    for (const [field, linkId, provider] of [
      ["bank_account_id", data.bank_account_id, "airwallex"],
      ["wallet_account_id", data.wallet_account_id, "wallet"],
    ] as const) {
      if (!linkId) continue;
      const { data: linked } = await supabase.from("accounts").select("company_id,provider").eq("id", linkId).maybeSingle();
      if (!linked || linked.company_id !== data.company_id || linked.provider !== provider)
        return fail("请检查填写内容", { [field]: "关联账户必须是同一家公司的对应类型账户" });
    }
    if (data.provider !== "paypal") {
      data.bank_account_id = null;
      data.wallet_account_id = null;
    }
    if (data.provider !== "wallet") {
      data.chain = null;
      data.address = null;
    }

    if (id) {
      const { data: existing } = await supabase.from("accounts").select("provider,company_id").eq("id", id).maybeSingle();
      if (!existing) return fail("账户不存在");
      if (existing.provider !== data.provider || existing.company_id !== data.company_id)
        return fail("已建账户的类型和所属公司不能更改，请新建一个");
      const { error } = await supabase.from("accounts").update(data).eq("id", id);
      if (error) return fail(dbMessage(error.message));
      await supabase.rpc("log_action", { p_action: "account.update", p_entity: "account", p_entity_id: id, p_detail: { name: data.name } });
      revalidatePath("/settings/companies");
      revalidatePath("/");
      return { ok: true, data: { id }, message: "账户已更新" };
    }
    const { data: row, error } = await supabase.from("accounts").insert(data).select("id").single();
    if (error || !row) return fail(dbMessage(error?.message));
    await supabase.rpc("log_action", { p_action: "account.create", p_entity: "account", p_entity_id: row.id, p_detail: { name: data.name } });
    revalidatePath("/settings/companies");
    revalidatePath("/");
    return { ok: true, data: { id: row.id }, message: "账户已添加" };
  } catch (e) {
    return fail(errorMessage(e));
  }
}

function zodFields(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function dbMessage(message?: string): string {
  if (!message) return "保存失败，请重试";
  if (message.includes("companies_code_key")) return "公司代码已存在，换一个";
  if (message.includes("row-level security")) return "没有权限执行此操作";
  return "保存失败：" + message;
}
