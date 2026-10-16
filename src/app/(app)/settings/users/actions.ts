"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { errorMessage, fail, type ActionResult } from "@/lib/utils";

const roleEnum = z.enum(["admin", "finance", "staff", "viewer"]);

const createSchema = z.object({
  name: z.string().trim().min(1, "请填写姓名").max(40),
  email: z.string().trim().toLowerCase().email("邮箱格式不正确"),
  role: roleEnum,
  password: z.string().min(8, "初始密码至少 8 位").max(72),
  company_ids: z.array(z.string().uuid()).default([]),
});
export type CreateUserInput = z.input<typeof createSchema>;

export async function createUser(input: CreateUserInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole("admin");
    const parsed = createSchema.safeParse(input);
    if (!parsed.success) return fail("请检查填写内容", zodFields(parsed.error));
    const { name, email, role, password, company_ids } = parsed.data;

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    });
    if (error || !data.user) {
      const msg = error?.message ?? "";
      if (/already|exists|registered/i.test(msg)) return fail("这个邮箱已经有账号了", { email: "已存在" });
      return fail("创建失败：" + msg);
    }
    const id = data.user.id;
    // 触发器已按 user_metadata 建档；这里确保姓名与角色落库（触发器会把第一个用户设为管理员）
    await admin.from("profiles").update({ name, role }).eq("id", id).neq("role", "admin");
    if (company_ids.length && (role === "staff" || role === "viewer")) {
      await admin.from("company_access").insert(company_ids.map((company_id) => ({ user_id: id, company_id })));
    }
    const supabase = await createClient();
    await supabase.rpc("log_action", { p_action: "user.create", p_entity: "user", p_entity_id: id, p_detail: { name, role } });
    revalidatePath("/settings/users");
    revalidatePath("/");
    return { ok: true, data: { id }, message: `已创建 ${name} 的账号` };
  } catch (e) {
    return fail(errorMessage(e));
  }
}

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, "请填写姓名").max(40),
  role: roleEnum,
  is_active: z.boolean(),
  company_ids: z.array(z.string().uuid()).default([]),
});
export type UpdateUserInput = z.input<typeof updateSchema>;

export async function updateUser(input: UpdateUserInput): Promise<ActionResult> {
  try {
    const me = await requireRole("admin");
    const parsed = updateSchema.safeParse(input);
    if (!parsed.success) return fail("请检查填写内容", zodFields(parsed.error));
    const { id, name, role, is_active, company_ids } = parsed.data;
    if (id === me.id && (role !== "admin" || !is_active)) return fail("不能降低或停用自己的管理员账号");

    const admin = createAdminClient();
    if (role !== "admin") {
      const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin").eq("is_active", true).neq("id", id);
      if (!count) return fail("系统至少要保留一位管理员");
    }
    const { error } = await admin.from("profiles").update({ name, role, is_active }).eq("id", id);
    if (error) return fail("保存失败：" + error.message);
    await admin.from("company_access").delete().eq("user_id", id);
    if (company_ids.length && (role === "staff" || role === "viewer")) {
      await admin.from("company_access").insert(company_ids.map((company_id) => ({ user_id: id, company_id })));
    }
    if (!is_active) {
      // 停用后立刻让其会话失效
      await admin.auth.admin.signOut(id, "global").catch(() => {});
    }
    const supabase = await createClient();
    await supabase.rpc("log_action", { p_action: "user.update", p_entity: "user", p_entity_id: id, p_detail: { name, role, is_active } });
    revalidatePath("/settings/users");
    return { ok: true, message: "已保存" };
  } catch (e) {
    return fail(errorMessage(e));
  }
}

const passwordSchema = z.object({ id: z.string().uuid(), password: z.string().min(8, "密码至少 8 位").max(72) });

export async function resetPassword(input: z.input<typeof passwordSchema>): Promise<ActionResult> {
  try {
    await requireRole("admin");
    const parsed = passwordSchema.safeParse(input);
    if (!parsed.success) return fail("请检查填写内容", zodFields(parsed.error));
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(parsed.data.id, { password: parsed.data.password });
    if (error) return fail("重置失败：" + error.message);
    const { data: p } = await admin.from("profiles").select("name").eq("id", parsed.data.id).maybeSingle();
    const supabase = await createClient();
    await supabase.rpc("log_action", { p_action: "user.password", p_entity: "user", p_entity_id: parsed.data.id, p_detail: { name: p?.name ?? "" } });
    return { ok: true, message: "密码已重置，请把新密码告诉对方" };
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
