"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, EmptyState } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Sheet, Segmented } from "@/components/ui/sheet";
import { CURRENCIES } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Account, AccountProvider, Company, WalletChain } from "@/lib/db/types";
import { saveAccount, saveCompany, type AccountInput, type CompanyInput } from "./actions";

const providerLabel: Record<AccountProvider, string> = { paypal: "PayPal", airwallex: "Airwallex", wallet: "链上钱包" };
const chainLabel: Record<WalletChain, string> = { tron: "Tron", ethereum: "Ethereum", base: "Base" };
const PALETTE = ["#1f4fd8", "#0f766e", "#b45309", "#7c3aed", "#be123c", "#0369a1", "#4d7c0f", "#16181d"];

type CompanyForm = { id?: string; name: string; code: string; color: string; note: string; is_active: boolean };
type AccountForm = {
  id?: string;
  company_id: string;
  provider: AccountProvider;
  name: string;
  identifier: string;
  currency: string;
  holder_name: string;
  chain: WalletChain | "";
  address: string;
  bank_account_id: string;
  wallet_account_id: string;
  note: string;
  is_active: boolean;
};

export function CompaniesManager({
  companies,
  accounts,
  canEditCompany,
}: {
  companies: Company[];
  accounts: Account[];
  canEditCompany: boolean;
}) {
  const router = useRouter();
  const [companySheet, setCompanySheet] = React.useState<CompanyForm | null>(null);
  const [accountSheet, setAccountSheet] = React.useState<AccountForm | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  const clients = companies.filter((c) => c.kind === "client");
  const management = companies.find((c) => c.kind === "management");

  function openNewCompany() {
    setErrors({});
    setCompanySheet({ name: "", code: "", color: PALETTE[clients.length % PALETTE.length], note: "", is_active: true });
  }
  function openEditCompany(c: Company) {
    setErrors({});
    setCompanySheet({ id: c.id, name: c.name, code: c.code, color: c.color, note: c.note, is_active: c.is_active });
  }
  function openNewAccount(companyId: string, provider: AccountProvider = "paypal") {
    setErrors({});
    setAccountSheet({
      company_id: companyId,
      provider,
      name: "",
      identifier: "",
      currency: provider === "wallet" ? "USDT" : "USD",
      holder_name: "",
      chain: provider === "wallet" ? "tron" : "",
      address: "",
      bank_account_id: "",
      wallet_account_id: "",
      note: "",
      is_active: true,
    });
  }
  function openEditAccount(a: Account) {
    setErrors({});
    setAccountSheet({
      id: a.id,
      company_id: a.company_id,
      provider: a.provider,
      name: a.name,
      identifier: a.identifier,
      currency: a.currency,
      holder_name: a.holder_name,
      chain: a.chain ?? "",
      address: a.address ?? "",
      bank_account_id: a.bank_account_id ?? "",
      wallet_account_id: a.wallet_account_id ?? "",
      note: a.note,
      is_active: a.is_active,
    });
  }

  async function submitCompany() {
    if (!companySheet) return;
    setSaving(true);
    const input: CompanyInput = { ...companySheet, code: companySheet.code.toUpperCase() };
    const r = await saveCompany(input);
    setSaving(false);
    if (!r.ok) {
      setErrors(r.fields ?? {});
      toast.error(r.error);
      return;
    }
    toast.success(r.message);
    setCompanySheet(null);
    router.refresh();
  }

  async function submitAccount() {
    if (!accountSheet) return;
    setSaving(true);
    const input: AccountInput = {
      ...accountSheet,
      currency: accountSheet.currency as (typeof CURRENCIES)[number],
      chain: accountSheet.chain || null,
      address: accountSheet.address || null,
      bank_account_id: accountSheet.bank_account_id || null,
      wallet_account_id: accountSheet.wallet_account_id || null,
    };
    const r = await saveAccount(input);
    setSaving(false);
    if (!r.ok) {
      setErrors(r.fields ?? {});
      toast.error(r.error);
      return;
    }
    toast.success(r.message);
    setAccountSheet(null);
    router.refresh();
  }

  const sameCompany = (id: string, provider: AccountProvider) =>
    accounts.filter((a) => a.company_id === id && a.provider === provider && a.is_active);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[13px] text-ink-3">
          {clients.length} 家客户公司 · {accounts.filter((a) => a.is_active).length} 个账户
        </span>
        {canEditCompany ? (
          <Button variant="primary" icon={<Plus size={15} />} onClick={openNewCompany}>
            添加公司
          </Button>
        ) : null}
      </div>

      {clients.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Building2 size={20} />}
            title="还没有客户公司"
            description="每家客户公司下面挂它的 PayPal、Airwallex 和钱包账户，之后的流水和对账都按公司归类。"
            action={
              canEditCompany ? (
                <Button variant="primary" size="sm" onClick={openNewCompany}>
                  添加第一家公司
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-[18px]">
          {clients.map((c) => (
            <CompanyCard
              key={c.id}
              company={c}
              accounts={accounts.filter((a) => a.company_id === c.id)}
              allAccounts={accounts}
              canEditCompany={canEditCompany}
              onEditCompany={() => openEditCompany(c)}
              onNewAccount={(p) => openNewAccount(c.id, p)}
              onEditAccount={openEditAccount}
            />
          ))}
        </div>
      )}

      {management ? (
        <Card className="px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <Mark name={management.name} color={management.color} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-[13.5px] font-semibold text-ink">{management.name}</span>
              <span className="text-[12px] text-ink-3">管理公司自身 · 公司开支和自付费用记在这里</span>
            </div>
            {canEditCompany ? (
              <Button size="sm" icon={<Pencil size={13} />} onClick={() => openEditCompany(management)}>
                编辑
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}

      {/* 公司表单 */}
      <Sheet
        open={!!companySheet}
        onClose={() => setCompanySheet(null)}
        title={companySheet?.id ? "编辑公司" : "添加客户公司"}
        description="名称与代码会出现在流水、批次和报表里"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCompanySheet(null)}>
              取消
            </Button>
            <Button variant="primary" loading={saving} onClick={submitCompany}>
              保存
            </Button>
          </>
        }
      >
        {companySheet ? (
          <div className="flex flex-col gap-4">
            <Field label="公司名称" error={errors.name} htmlFor="c-name">
              <Input
                id="c-name"
                value={companySheet.name}
                onChange={(e) => setCompanySheet({ ...companySheet, name: e.target.value })}
                placeholder="例如：安公司"
                autoFocus
              />
            </Field>
            <Field label="代码" hint="1–8 位字母数字，用于批次编号，如 AN-PP-03" error={errors.code} htmlFor="c-code">
              <Input
                id="c-code"
                value={companySheet.code}
                onChange={(e) => setCompanySheet({ ...companySheet, code: e.target.value.toUpperCase() })}
                placeholder="AN"
                className="uppercase tabular"
                maxLength={8}
              />
            </Field>
            <Field label="标识色" error={errors.color}>
              <div className="flex flex-wrap gap-2">
                {PALETTE.map((p) => (
                  <button
                    key={p}
                    type="button"
                    aria-label={p}
                    onClick={() => setCompanySheet({ ...companySheet, color: p })}
                    className={cn(
                      "size-7 rounded-full border-2 transition-transform",
                      companySheet.color === p ? "scale-110 border-ink" : "border-transparent",
                    )}
                    style={{ background: p }}
                  />
                ))}
              </div>
            </Field>
            <Field label="备注" htmlFor="c-note">
              <Textarea
                id="c-note"
                value={companySheet.note}
                onChange={(e) => setCompanySheet({ ...companySheet, note: e.target.value })}
                placeholder="联系人、合作方式等"
              />
            </Field>
            {companySheet.id ? (
              <label className="flex items-center gap-2 text-[13px] text-ink-2">
                <input
                  type="checkbox"
                  checked={companySheet.is_active}
                  onChange={(e) => setCompanySheet({ ...companySheet, is_active: e.target.checked })}
                />
                仍在合作（取消勾选会从工作台隐藏，历史数据保留）
              </label>
            ) : null}
          </div>
        ) : null}
      </Sheet>

      {/* 账户表单 */}
      <Sheet
        open={!!accountSheet}
        onClose={() => setAccountSheet(null)}
        title={accountSheet?.id ? "编辑账户" : "添加账户"}
        description={accountSheet ? companies.find((c) => c.id === accountSheet.company_id)?.name : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAccountSheet(null)}>
              取消
            </Button>
            <Button variant="primary" loading={saving} onClick={submitAccount}>
              保存
            </Button>
          </>
        }
      >
        {accountSheet ? (
          <div className="flex flex-col gap-4">
            {!accountSheet.id ? (
              <Segmented
                value={accountSheet.provider}
                onChange={(p) =>
                  setAccountSheet({
                    ...accountSheet,
                    provider: p,
                    currency: p === "wallet" ? "USDT" : "USD",
                    chain: p === "wallet" ? "tron" : "",
                  })
                }
                options={[
                  { value: "paypal", label: "PayPal" },
                  { value: "airwallex", label: "Airwallex" },
                  { value: "wallet", label: "链上钱包" },
                ]}
                className="self-start"
              />
            ) : (
              <Badge tone="blue" className="self-start">
                {providerLabel[accountSheet.provider]}
              </Badge>
            )}

            <Field label="账户名称" hint="你们内部的叫法，例如 AN-PP-03" error={errors.name} htmlFor="a-name">
              <Input
                id="a-name"
                value={accountSheet.name}
                onChange={(e) => setAccountSheet({ ...accountSheet, name: e.target.value })}
                autoFocus
              />
            </Field>

            {accountSheet.provider === "paypal" ? (
              <>
                <Field label="PayPal 登录邮箱" error={errors.identifier} htmlFor="a-id">
                  <Input
                    id="a-id"
                    value={accountSheet.identifier}
                    onChange={(e) => setAccountSheet({ ...accountSheet, identifier: e.target.value })}
                    placeholder="用于识别，不是登录凭据"
                  />
                </Field>
                <Field label="提款到哪个银行账户" error={errors.bank_account_id} htmlFor="a-bank">
                  <Select
                    id="a-bank"
                    value={accountSheet.bank_account_id}
                    onChange={(e) => setAccountSheet({ ...accountSheet, bank_account_id: e.target.value })}
                  >
                    <option value="">稍后选择</option>
                    {sameCompany(accountSheet.company_id, "airwallex").map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                        {a.identifier ? ` · 尾号 ${a.identifier}` : ""}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="最终到哪个钱包" error={errors.wallet_account_id} htmlFor="a-wallet">
                  <Select
                    id="a-wallet"
                    value={accountSheet.wallet_account_id}
                    onChange={(e) => setAccountSheet({ ...accountSheet, wallet_account_id: e.target.value })}
                  >
                    <option value="">稍后选择</option>
                    {sameCompany(accountSheet.company_id, "wallet").map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} · {a.currency} · {a.chain ? chainLabel[a.chain] : ""}
                      </option>
                    ))}
                  </Select>
                </Field>
              </>
            ) : null}

            {accountSheet.provider === "airwallex" ? (
              <>
                <Field label="户名" error={errors.holder_name} htmlFor="a-holder">
                  <Input
                    id="a-holder"
                    value={accountSheet.holder_name}
                    onChange={(e) => setAccountSheet({ ...accountSheet, holder_name: e.target.value })}
                  />
                </Field>
                <Field label="账号尾号" error={errors.identifier} htmlFor="a-id">
                  <Input
                    id="a-id"
                    value={accountSheet.identifier}
                    onChange={(e) => setAccountSheet({ ...accountSheet, identifier: e.target.value.replace(/\D/g, "") })}
                    placeholder="8821"
                    className="tabular"
                    maxLength={8}
                  />
                </Field>
              </>
            ) : null}

            {accountSheet.provider === "wallet" ? (
              <>
                <Field label="网络" error={errors.chain} htmlFor="a-chain">
                  <Select
                    id="a-chain"
                    value={accountSheet.chain}
                    onChange={(e) => {
                      const chain = e.target.value as WalletChain;
                      setAccountSheet({ ...accountSheet, chain, currency: chain === "tron" ? "USDT" : "USDC" });
                    }}
                  >
                    <option value="tron">Tron · USDT</option>
                    <option value="ethereum">Ethereum · USDC</option>
                    <option value="base">Base · USDC</option>
                  </Select>
                </Field>
                <Field label="公开地址" hint="只需要收款地址，不需要私钥" error={errors.address} htmlFor="a-addr">
                  <Input
                    id="a-addr"
                    value={accountSheet.address}
                    onChange={(e) => setAccountSheet({ ...accountSheet, address: e.target.value.trim() })}
                    className="font-mono text-[12.5px]"
                    spellCheck={false}
                  />
                </Field>
              </>
            ) : null}

            <Field label="币种" error={errors.currency} htmlFor="a-cur">
              <Select
                id="a-cur"
                value={accountSheet.currency}
                onChange={(e) => setAccountSheet({ ...accountSheet, currency: e.target.value })}
                disabled={accountSheet.provider === "wallet"}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="备注" htmlFor="a-note">
              <Textarea
                id="a-note"
                value={accountSheet.note}
                onChange={(e) => setAccountSheet({ ...accountSheet, note: e.target.value })}
              />
            </Field>
            {accountSheet.id ? (
              <label className="flex items-center gap-2 text-[13px] text-ink-2">
                <input
                  type="checkbox"
                  checked={accountSheet.is_active}
                  onChange={(e) => setAccountSheet({ ...accountSheet, is_active: e.target.checked })}
                />
                仍在使用
              </label>
            ) : null}
          </div>
        ) : null}
      </Sheet>
    </>
  );
}

function Mark({ name, color, size = 32 }: { name: string; color: string; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-md font-semibold"
      style={{ width: size, height: size, background: color + "1a", color, fontSize: size * 0.42 }}
    >
      {name.slice(0, 1)}
    </span>
  );
}

function CompanyCard({
  company,
  accounts,
  allAccounts,
  canEditCompany,
  onEditCompany,
  onNewAccount,
  onEditAccount,
}: {
  company: Company;
  accounts: Account[];
  allAccounts: Account[];
  canEditCompany: boolean;
  onEditCompany: () => void;
  onNewAccount: (p: AccountProvider) => void;
  onEditAccount: (a: Account) => void;
}) {
  const groups: AccountProvider[] = ["paypal", "airwallex", "wallet"];
  const nameOf = (id: string | null) => allAccounts.find((a) => a.id === id)?.name;
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3 px-5 pt-4 pb-3">
        <Mark name={company.name} color={company.color} />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-ink">{company.name}</span>
            <Badge>{company.code}</Badge>
            {!company.is_active ? <Badge tone="amber">已停用</Badge> : null}
          </div>
          {company.note ? <span className="truncate text-[12px] text-ink-3">{company.note}</span> : null}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" icon={<Plus size={13} />} onClick={() => onNewAccount("paypal")}>
            添加账户
          </Button>
          {canEditCompany ? (
            <Button size="sm" variant="ghost" icon={<Pencil size={13} />} onClick={onEditCompany}>
              编辑
            </Button>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-1 border-t border-line-soft md:grid-cols-3">
        {groups.map((p, i) => {
          const list = accounts.filter((a) => a.provider === p);
          return (
            <div key={p} className={cn("flex flex-col px-5 py-3", i > 0 && "border-t border-line-soft md:border-t-0 md:border-l")}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[12px] font-medium text-ink-3">
                  {providerLabel[p]} <span className="tabular">{list.length}</span>
                </span>
                <button type="button" onClick={() => onNewAccount(p)} className="text-[12px] text-accent hover:underline">
                  添加
                </button>
              </div>
              {list.length === 0 ? (
                <span className="py-1.5 text-[12.5px] text-ink-4">—</span>
              ) : (
                <ul className="flex flex-col">
                  {list.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => onEditAccount(a)}
                        className="flex w-full items-center gap-2 rounded-md py-1.5 text-left hover:bg-surface-2"
                      >
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className={cn("truncate text-[13px] font-medium", a.is_active ? "text-ink" : "text-ink-4 line-through")}>
                            {a.name}
                          </span>
                          <span className="truncate text-[11.5px] text-ink-3 tabular">
                            {p === "paypal" &&
                              (a.identifier || "—") +
                                (a.bank_account_id ? ` → ${nameOf(a.bank_account_id)}` : "") +
                                (a.wallet_account_id ? ` → ${nameOf(a.wallet_account_id)}` : "")}
                            {p === "airwallex" && `${a.currency}${a.identifier ? ` · 尾号 ${a.identifier}` : ""}${a.holder_name ? ` · ${a.holder_name}` : ""}`}
                            {p === "wallet" && `${a.currency} · ${a.chain ? chainLabel[a.chain] : ""} · ${shortAddr(a.address)}`}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function shortAddr(a: string | null): string {
  if (!a) return "—";
  return a.length > 14 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}
