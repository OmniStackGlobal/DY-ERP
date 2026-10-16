import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { UsersManager } from "./users-manager";

export const metadata: Metadata = { title: "用户与权限" };

export default async function UsersPage() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  const supabase = await createClient();
  const [{ data: profiles }, { data: companies }, { data: access }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at"),
    supabase.from("companies").select("id,name,code,color,kind,is_active").eq("kind", "client").eq("is_active", true).order("name"),
    supabase.from("company_access").select("user_id,company_id"),
  ]);
  return (
    <>
      <PageHeader
        title="用户与权限"
        description="账号由管理员创建；经办人只能看到自己经手的费用，只读角色可按公司限定范围。"
      />
      <UsersManager me={user} profiles={profiles ?? []} companies={companies ?? []} access={access ?? []} />
    </>
  );
}
