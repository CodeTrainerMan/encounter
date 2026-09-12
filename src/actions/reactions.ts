"use server";

import { revalidatePath } from "next/cache";
import { signIn } from "@/auth";
import { safeReturnTo } from "@/i18n/paths";
import { toggleReaction } from "@/lib/reactions";
import { getCurrentAuthor } from "@/lib/session";
import { DEFAULT_LOCALE, isLocale, isReactionEmoji, type Locale } from "@/lib/types";

function readLocale(formData: FormData): Locale {
  const raw = String(formData.get("locale") ?? "");
  return isLocale(raw) ? raw : DEFAULT_LOCALE;
}

/**
 * 贴 / 取消一个表情。
 *
 * 未登录时不报错，而是顺路把人送去 Discord 登录、再回到原页面：
 * 点了表情才需要登录，比一开始就把按钮禁用掉更少劝退。
 */
export async function toggleReactionAction(formData: FormData): Promise<void> {
  const encounterId = String(formData.get("encounterId") ?? "").trim();
  const emoji = String(formData.get("emoji") ?? "").trim();

  // 非法输入直接忽略：这里没有值得展示给用户的错误
  if (!encounterId || !isReactionEmoji(emoji)) return;

  // 身份只从会话读，不从表单读
  const author = await getCurrentAuthor();

  if (!author) {
    const locale = readLocale(formData);
    await signIn("discord", { redirectTo: safeReturnTo(formData.get("returnTo"), locale) });
    return;
  }

  await toggleReaction(encounterId, author.id, emoji);

  // 不 redirect：表单 action 完成后 Next 会重新渲染当前路由
  revalidatePath("/", "layout");
}
