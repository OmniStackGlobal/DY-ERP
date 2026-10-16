"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/db/types";

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

/** 浏览器端客户端，只用于登录/登出和文件上传等必须在浏览器完成的操作。 */
export function getBrowserClient() {
  if (!client) {
    client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return client;
}
