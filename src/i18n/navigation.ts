import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * 语言感知的导航 API。用它替换 `next/link` 与 `next/navigation` 中的对应项，
 * href 会自动带上正确的语言前缀（英文为默认语言时不加前缀）。
 */
export const { Link, redirect, permanentRedirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
