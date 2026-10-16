import type { Profile, UserRole } from "@/lib/db/types";

/** 客户端和服务端都能用的用户信息与角色文案。 */
export type CurrentUser = Pick<Profile, "id" | "email" | "name" | "role">;

export const roleLabel: Record<UserRole, string> = {
  admin: "管理员",
  finance: "财务",
  staff: "经办人",
  viewer: "只读",
};

export const roleDescription: Record<UserRole, string> = {
  admin: "全部权限，管理用户、公司和费率",
  finance: "查看全部数据，录入与修改费用、对账",
  staff: "只能录入和查看自己经手的费用",
  viewer: "只读查看被授权公司的数据",
};

export const ROLES: UserRole[] = ["admin", "finance", "staff", "viewer"];
