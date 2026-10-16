import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { Card, CardHeader, EmptyState, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDate, money, monthRange, relativeTime, weekdayCN } from "@/lib/format";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const month = monthRange();
  const isFinance = user.role === "admin" || user.role === "finance";

  const [companiesRes, accountsRes, usersRes, expensesRes, auditRes] = await Promise.all([
    supabase.from("companies").select("id,name,code,kind,color,is_active").eq("is_active", true).order("kind").order("name"),
    supabase.from("accounts").select("id,provider,company_id").eq("is_active", true),
    isFinance ? supabase.from("profiles").select("id", { count: "exact", head: true }) : Promise.resolve({ count: null }),
    supabase
      .from("expenses")
      .select("scope,amount,currency,sharing")
      .gte("expense_date", month.start)
      .lt("expense_date", month.end),
    supabase.from("audit_log").select("id,action,entity,detail,created_at,actor_id").order("created_at", { ascending: false }).limit(8),
  ]);

  const companies = companiesRes.data ?? [];
  const clients = companies.filter((c) => c.kind === "client");
  const accounts = accountsRes.data ?? [];
  const userCount = "count" in usersRes ? (usersRes.count ?? 0) : 0;
  const expenses = expensesRes.data ?? [];
  const audit = auditRes.data ?? [];

  const byCurrency = new Map<string, { business: number; company: number; pending: number }>();
  for (const e of expenses) {
    const row = byCurrency.get(e.currency) ?? { business: 0, company: 0, pending: 0 };
    const n = Number(e.amount);
    if (e.scope === "business") row.business += n;
    else row.company += n;
    if (e.sharing === "pending") row.pending += n;
    byCurrency.set(e.currency, row);
  }

  const setup = [
    { done: clients.length > 0, label: "添加客户公司", href: "/settings/companies" },
    { done: accounts.length > 0, label: "录入 PayPal / Airwallex / 钱包账户", href: "/settings/companies" },
    { done: userCount > 1, label: "邀请同事并分配角色", href: "/settings/users" },
    { done: false, label: "连接 PayPal 与 Airwallex（下一模块）", href: "/settings/connections" },
  ];
  const setupDone = setup.filter((s) => s.done).length;

  return (
    <>
      <PageHeader
        title="工作台"
        description={`${fmtDate(new Date(), "long")} · ${weekdayCN()} · 北京时间`}
        actions={
          <Link href="/expenses">
            <Button variant="primary">记一笔</Button>
          </Link>
        }
      />

      {/* 资金流：收入模块接入前先保留结构 */}
      <Card className="gap-4 px-[22px] pt-5 pb-[22px]">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-[15px] font-semibold text-ink">资金流</h2>
            <span className="text-[12.5px] text-ink-3">{month.label} · PayPal → Airwallex → 钱包</span>
          </div>
          <span className="text-[12px] text-ink-4">收入模块接入后显示</span>
        </div>
        <div className="grid grid-cols-2 gap-y-4 md:grid-cols-5 md:gap-y-0">
          {["PayPal 收款", "已提款", "银行到账 · Airwallex", "应到钱包", "钱包实到"].map((label, i) => (
            <div
              key={label}
              className={cn(
                "flex flex-col gap-1.5 py-1 md:border-r md:border-line-soft md:px-[18px] md:last:border-r-0",
                i === 0 && "md:pl-0",
              )}
            >
              <span className="text-[12px] font-medium text-ink-3">{label}</span>
              <span className="text-[24px] font-semibold tracking-[-0.015em] text-ink-4 tabular">—</span>
              <span className="text-[12px] text-ink-4">尚未接入</span>
            </div>
          ))}
        </div>
        <div className="h-2 overflow-hidden rounded-[4px] bg-line-soft" />
      </Card>

      <div className="flex flex-wrap items-start gap-[18px]">
        <div className="flex min-w-0 flex-[2_1_520px] flex-col gap-[18px]">
          <Card>
            <CardHeader
              title="本月支出"
              caption="业务支出与公司开支 · 各币种分开"
              action={
                <Link href="/expenses" className="flex items-center gap-1 text-[13px] font-medium text-accent">
                  全部支出 <ArrowRight size={14} />
                </Link>
              }
            />
            {byCurrency.size === 0 ? (
              <EmptyState
                title="本月还没有费用记录"
                description="支出模块上线后，在这里按分类、经办人和承担方查看。"
                className="py-10"
              />
            ) : (
              <div className="flex flex-wrap border-t border-line-soft">
                {[...byCurrency.entries()].map(([cur, v]) => (
                  <div key={cur} className="flex flex-1 basis-[200px] flex-col gap-0.5 border-r border-line-soft px-5 py-3.5 last:border-r-0">
                    <span className="text-[12px] text-ink-3">{cur}</span>
                    <span className="text-[20px] font-semibold tracking-[-0.01em] tabular">{money(v.business + v.company, cur)}</span>
                    <span className="text-[12px] text-ink-3 tabular">
                      业务 {money(v.business, cur)} · 公司 {money(v.company, cur)}
                      {v.pending > 0 ? <> · 待确认 {money(v.pending, cur)}</> : null}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {isFinance ? (
            <Card>
              <CardHeader title="客户公司" caption={`${clients.length} 家 · ${accounts.length} 个账户`} />
              {clients.length === 0 ? (
                <EmptyState
                  title="还没有客户公司"
                  description="先把三家客户公司和它们的 PayPal、Airwallex、钱包账户录进来，收入模块接入时直接使用。"
                  action={
                    <Link href="/settings/companies">
                      <Button variant="primary" size="sm">
                        添加公司
                      </Button>
                    </Link>
                  }
                  className="py-10"
                />
              ) : (
                <div className="flex flex-col px-5 pb-2">
                  {clients.map((c) => {
                    const own = accounts.filter((a) => a.company_id === c.id);
                    const n = (p: string) => own.filter((a) => a.provider === p).length;
                    return (
                      <Link
                        key={c.id}
                        href="/settings/companies"
                        className="flex items-center gap-3 border-t border-line-soft py-3 first:border-t-0"
                      >
                        <span
                          className="flex size-7 items-center justify-center rounded-md text-[12px] font-semibold"
                          style={{ background: c.color + "1a", color: c.color }}
                        >
                          {c.name.slice(0, 1)}
                        </span>
                        <span className="flex-1 text-[13.5px] font-medium text-ink">{c.name}</span>
                        <span className="text-[12.5px] text-ink-3 tabular">
                          PayPal {n("paypal")} · Airwallex {n("airwallex")} · 钱包 {n("wallet")}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Card>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-[18px]">
          {setupDone < setup.length ? (
            <Card>
              <CardHeader title="开始使用" caption={`${setupDone} / ${setup.length}`} />
              <div className="flex flex-col px-5 pb-4">
                {setup.map((s) => (
                  <Link
                    key={s.label}
                    href={s.href}
                    className={cn(
                      "flex items-center gap-2.5 border-t border-line-soft py-2.5 text-[13px] first:border-t-0",
                      s.done ? "text-ink-4 line-through" : "text-ink hover:text-accent",
                    )}
                  >
                    {s.done ? <CheckCircle2 size={16} className="text-green" /> : <Circle size={16} className="text-ink-4" />}
                    {s.label}
                  </Link>
                ))}
              </div>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="最近动态" />
            {audit.length === 0 ? (
              <EmptyState title="还没有操作记录" className="py-8" />
            ) : (
              <div className="flex flex-col px-5 pb-3">
                {audit.map((a) => (
                  <div key={a.id} className="flex gap-3 border-t border-line-soft py-2.5 first:border-t-0">
                    <span className="w-14 shrink-0 pt-px text-[12px] text-ink-4 tabular">{relativeTime(a.created_at)}</span>
                    <div className="flex min-w-0 flex-col">
                      <span className="text-[13px] text-ink">{describeAction(a.action, a.detail)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function describeAction(action: string, detail: unknown): string {
  const d = detail && typeof detail === "object" && !Array.isArray(detail) ? (detail as Record<string, unknown>) : {};
  const name = typeof d.name === "string" ? d.name : "";
  const map: Record<string, string> = {
    "company.create": `新建公司 ${name}`,
    "company.update": `更新公司 ${name}`,
    "account.create": `新建账户 ${name}`,
    "account.update": `更新账户 ${name}`,
    "user.create": `新建用户 ${name}`,
    "user.update": `更新用户 ${name}`,
    "user.password": `重置密码 ${name}`,
  };
  return map[action] ?? `${action} ${name}`.trim();
}
