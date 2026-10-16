"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Dot } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { fmtDate } from "@/lib/format";
import { ROLES, roleDescription, roleLabel, type CurrentUser } from "@/lib/auth-shared";
import type { Profile, UserRole } from "@/lib/db/types";
import { createUser, resetPassword, updateUser } from "./actions";

type CompanyLite = { id: string; name: string; code: string; color: string };
type Access = { user_id: string; company_id: string };

type Form = {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  password: string;
  is_active: boolean;
  company_ids: string[];
};

function randomPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const buf = new Uint32Array(12);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => chars[n % chars.length]).join("");
}

export function UsersManager({
  me,
  profiles,
  companies,
  access,
}: {
  me: CurrentUser;
  profiles: Profile[];
  companies: CompanyLite[];
  access: Access[];
}) {
  const router = useRouter();
  const [form, setForm] = React.useState<Form | null>(null);
  const [pwFor, setPwFor] = React.useState<Profile | null>(null);
  const [pw, setPw] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  const accessOf = (id: string) => access.filter((a) => a.user_id === id).map((a) => a.company_id);

  function openNew() {
    setErrors({});
    setForm({ name: "", email: "", role: "staff", password: randomPassword(), is_active: true, company_ids: [] });
  }
  function openEdit(p: Profile) {
    setErrors({});
    setForm({ id: p.id, name: p.name, email: p.email, role: p.role, password: "", is_active: p.is_active, company_ids: accessOf(p.id) });
  }

  async function submit() {
    if (!form) return;
    setSaving(true);
    const r = form.id
      ? await updateUser({ id: form.id, name: form.name, role: form.role, is_active: form.is_active, company_ids: form.company_ids })
      : await createUser({ name: form.name, email: form.email, role: form.role, password: form.password, company_ids: form.company_ids });
    setSaving(false);
    if (!r.ok) {
      setErrors(r.fields ?? {});
      toast.error(r.error);
      return;
    }
    toast.success(r.message);
    setForm(null);
    router.refresh();
  }

  async function submitPassword() {
    if (!pwFor) return;
    setSaving(true);
    const r = await resetPassword({ id: pwFor.id, password: pw });
    setSaving(false);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    toast.success(r.message);
    setPwFor(null);
  }

  const needsScope = form?.role === "staff" || form?.role === "viewer";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[13px] text-ink-3">
          {profiles.filter((p) => p.is_active).length} 位在职用户
        </span>
        <Button variant="primary" icon={<Plus size={15} />} onClick={openNew}>
          添加用户
        </Button>
      </div>

      <Card>
        <Table minWidth={760}>
          <thead>
            <tr>
              <Th>姓名</Th>
              <Th>邮箱</Th>
              <Th>角色</Th>
              <Th>可见公司</Th>
              <Th>状态</Th>
              <Th>加入</Th>
              <Th align="right"></Th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => {
              const scoped = p.role === "staff" || p.role === "viewer";
              const ids = accessOf(p.id);
              return (
                <Tr key={p.id}>
                  <Td>
                    <span className="flex items-center gap-2.5">
                      <span className="flex size-7 items-center justify-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent">
                        {(p.name || p.email).slice(0, 1).toUpperCase()}
                      </span>
                      <span className="font-medium text-ink">
                        {p.name || "—"}
                        {p.id === me.id ? <span className="ml-1.5 text-[11.5px] text-ink-4">你</span> : null}
                      </span>
                    </span>
                  </Td>
                  <Td className="text-ink-2">{p.email}</Td>
                  <Td>
                    <Badge tone={p.role === "admin" ? "blue" : "neutral"}>{roleLabel[p.role]}</Badge>
                  </Td>
                  <Td className="text-ink-2">
                    {!scoped ? (
                      <span className="text-ink-3">全部</span>
                    ) : ids.length === 0 ? (
                      <span className="text-amber">未分配</span>
                    ) : (
                      companies
                        .filter((c) => ids.includes(c.id))
                        .map((c) => c.name)
                        .join("、")
                    )}
                  </Td>
                  <Td>
                    <span className="flex items-center gap-1.5 text-[13px]">
                      <Dot tone={p.is_active ? "green" : "neutral"} />
                      {p.is_active ? "在职" : "已停用"}
                    </span>
                  </Td>
                  <Td className="text-ink-3 tabular">{fmtDate(p.created_at, "long")}</Td>
                  <Td align="right">
                    <span className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" icon={<KeyRound size={13} />} onClick={() => { setPw(randomPassword()); setPwFor(p); }}>
                        重置密码
                      </Button>
                      <Button size="sm" onClick={() => openEdit(p)}>
                        编辑
                      </Button>
                    </span>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      <Sheet
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? "编辑用户" : "添加用户"}
        description={form?.id ? undefined : "创建后把邮箱和初始密码告诉对方，登录后可自行修改"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setForm(null)}>
              取消
            </Button>
            <Button variant="primary" loading={saving} onClick={submit}>
              保存
            </Button>
          </>
        }
      >
        {form ? (
          <div className="flex flex-col gap-4">
            <Field label="姓名" error={errors.name} htmlFor="u-name">
              <Input id="u-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
            </Field>
            <Field label="邮箱" error={errors.email} htmlFor="u-email" hint={form.id ? "邮箱创建后不可修改" : undefined}>
              <Input
                id="u-email"
                type="email"
                value={form.email}
                disabled={!!form.id}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            {!form.id ? (
              <Field label="初始密码" error={errors.password} htmlFor="u-pw" hint="已自动生成，可以改成你想要的">
                <div className="flex gap-2">
                  <Input id="u-pw" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="font-mono" />
                  <Button variant="secondary" aria-label="重新生成" onClick={() => setForm({ ...form, password: randomPassword() })} icon={<RefreshCw size={14} />} />
                </div>
              </Field>
            ) : null}
            <Field label="角色" error={errors.role} htmlFor="u-role" hint={roleDescription[form.role]}>
              <Select id="u-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel[r]}
                  </option>
                ))}
              </Select>
            </Field>
            {needsScope ? (
              <Field label="可见的客户公司" hint={form.role === "staff" ? "经办人只能给这些公司记费用" : "只读角色只能看这些公司的数据"}>
                {companies.length === 0 ? (
                  <p className="text-[13px] text-ink-3">还没有客户公司，先去「公司与账户」添加。</p>
                ) : (
                  <div className="flex flex-col gap-1.5 rounded-md border border-line-soft p-2">
                    {companies.map((c) => {
                      const on = form.company_ids.includes(c.id);
                      return (
                        <label key={c.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-surface-2">
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                company_ids: e.target.checked ? [...form.company_ids, c.id] : form.company_ids.filter((x) => x !== c.id),
                              })
                            }
                          />
                          <span className="flex size-5 items-center justify-center rounded text-[11px] font-semibold" style={{ background: c.color + "1a", color: c.color }}>
                            {c.name.slice(0, 1)}
                          </span>
                          <span className="text-[13px] text-ink">{c.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </Field>
            ) : null}
            {form.id && form.id !== me.id ? (
              <label className="flex items-center gap-2 text-[13px] text-ink-2">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                在职（停用后立即无法登录，数据保留）
              </label>
            ) : null}
          </div>
        ) : null}
      </Sheet>

      <Sheet
        open={!!pwFor}
        onClose={() => setPwFor(null)}
        title="重置密码"
        description={pwFor ? `${pwFor.name || pwFor.email}` : undefined}
        width={380}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPwFor(null)}>
              取消
            </Button>
            <Button variant="primary" loading={saving} onClick={submitPassword}>
              确认重置
            </Button>
          </>
        }
      >
        <Field label="新密码" htmlFor="pw" hint="至少 8 位。重置后请把新密码告诉对方。">
          <div className="flex gap-2">
            <Input id="pw" value={pw} onChange={(e) => setPw(e.target.value)} className="font-mono" />
            <Button variant="secondary" aria-label="重新生成" onClick={() => setPw(randomPassword())} icon={<RefreshCw size={14} />} />
          </div>
        </Field>
      </Sheet>
    </>
  );
}
