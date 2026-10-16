import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Building2,
  CreditCard,
  LayoutGrid,
  ListOrdered,
  Plug,
  Receipt,
  SlidersHorizontal,
  BarChart3,
  Users,
} from "lucide-react";
import type { UserRole } from "@/lib/db/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: UserRole[]; // 不填 = 所有角色可见
  soon?: boolean; // 还没实现的模块，先占位
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  { items: [{ href: "/", label: "工作台", icon: LayoutGrid }] },
  {
    label: "收入",
    items: [
      { href: "/income/accounts", label: "账户", icon: CreditCard, soon: true },
      { href: "/income/transactions", label: "流水", icon: ListOrdered, soon: true },
      { href: "/income/reconciliation", label: "对账", icon: ArrowLeftRight, soon: true },
    ],
  },
  {
    label: "支出",
    items: [
      { href: "/expenses", label: "业务支出", icon: Receipt, soon: true },
      { href: "/expenses/company", label: "公司开支", icon: Building2, roles: ["admin", "finance"], soon: true },
    ],
  },
  {
    label: "分析",
    items: [{ href: "/reports", label: "报表", icon: BarChart3, roles: ["admin", "finance", "viewer"], soon: true }],
  },
  {
    label: "设置",
    items: [
      { href: "/settings/companies", label: "公司与账户", icon: Building2, roles: ["admin", "finance"] },
      { href: "/settings/users", label: "用户与权限", icon: Users, roles: ["admin"] },
      { href: "/settings/connections", label: "连接", icon: Plug, roles: ["admin", "finance"], soon: true },
      { href: "/settings/rules", label: "费率规则", icon: SlidersHorizontal, roles: ["admin", "finance"], soon: true },
    ],
  },
];

export function pageTitle(pathname: string): string {
  for (const g of navGroups) for (const i of g.items) if (i.href === pathname) return i.label;
  return "DY ERP";
}
