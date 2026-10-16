import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CompaniesManager } from "./companies-manager";

export const metadata: Metadata = { title: "公司与账户" };

export default async function CompaniesPage() {
  const user = await requireUser();
  if (user.role !== "admin" && user.role !== "finance") redirect("/");
  const supabase = await createClient();
  const [{ data: companies }, { data: accounts }] = await Promise.all([
    supabase.from("companies").select("*").order("kind").order("created_at"),
    supabase.from("accounts").select("*").order("provider").order("created_at"),
  ]);

  return (
    <>
      <PageHeader
        title="公司与账户"
        description="客户公司及其 PayPal、Airwallex 和链上钱包账户。连接凭据在「连接」里单独配置。"
      />
      <CompaniesManager companies={companies ?? []} accounts={accounts ?? []} canEditCompany={user.role === "admin"} />
    </>
  );
}
