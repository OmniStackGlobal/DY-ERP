import { notFound } from "next/navigation";
import Link from "next/link";
import { Hammer } from "lucide-react";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";

/** 尚未实现的模块先占位，导航不会 404；实现后删除对应条目。 */
const PLANNED: Record<string, { title: string; description: string; module: string }> = {
  "income/accounts": { title: "账户", description: "每个 PayPal、Airwallex 和钱包的余额、最近同步与流水入口。", module: "第 3 步 · 收入" },
  "income/transactions": { title: "流水", description: "收款、手续费、提款、银行入账和链上到账，按公司和账户筛选。", module: "第 3 步 · 收入" },
  "income/reconciliation": { title: "对账", description: "提款批次：银行到账匹配、提醒客户、钱包到账核对与差额。", module: "第 3 步 · 收入" },
  expenses: { title: "业务支出", description: "广告费、IP、ADS 等代客户支付或自付的费用，带凭证与承担方。", module: "第 2 步 · 支出" },
  "expenses/company": { title: "公司开支", description: "房租、水电、工资、清洁、杂费等管理公司自身开支，支持月度固定项。", module: "第 2 步 · 支出" },
  reports: { title: "报表", description: "按公司、月份、币种的收入与支出汇总，分润结算单。", module: "第 5 步 · 报表" },
  "settings/connections": { title: "连接", description: "PayPal、Airwallex、链上查询与 Telegram 通知的凭据配置与同步状态。", module: "第 3 步 · 收入" },
  "settings/rules": { title: "费率规则", description: "换款路线的比例费、固定费、汇率与允许差额；批次创建时保存快照。", module: "第 3 步 · 收入" },
  search: { title: "搜索", description: "跨公司、流水、批次与费用的全局搜索（⌘K）。", module: "后续" },
};

export default async function PlannedPage({ params }: { params: Promise<{ slug: string[] }> }) {
  await requireUser();
  const { slug } = await params;
  const key = slug.join("/");
  const entry = PLANNED[key];
  if (!entry) notFound();
  return (
    <>
      <PageHeader title={entry.title} description={entry.description} />
      <Card>
        <EmptyState
          icon={<Hammer size={20} />}
          title={`${entry.title} 在 ${entry.module} 里实现`}
          description="模块按顺序逐个上线：地基 → 支出 → 收入 → 通知 → 报表。当前页面只是占位。"
          action={
            <Link href="/">
              <Button size="sm">回到工作台</Button>
            </Link>
          }
        />
      </Card>
    </>
  );
}
