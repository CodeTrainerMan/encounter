"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "@/i18n/navigation";
import { createEncounter, deleteEncounter, updateEncounter } from "@/lib/encounters";
import { UnauthenticatedError } from "@/lib/errors";
import { toErrorKey, type FormState } from "@/lib/form-state";
import { getCurrentAuthor } from "@/lib/session";
import {
  DEFAULT_LOCALE,
  isEncounterType,
  isLocale,
  type Author,
  type EncounterInput,
  type EncounterType,
  type Locale,
} from "@/lib/types";
import { postTitle, todayISO } from "@/lib/utils";

/** 一条帖子的正文上限：比标题宽松得多，但仍然拦一下明显异常的输入 */
const MAX_POST_LENGTH = 2000;

/**
 * Server Actions
 * ------------------------------------------------------------
 * 语言通过表单里的隐藏字段传递，而不是依赖服务端上下文，
 * 这样跳转一定落在用户当前所在的语言上。
 *
 * 身份一律从**会话**读，绝不从表单读：表单字段是客户端可以随便改的，
 * 用它判断「谁在操作」等于没有鉴权。
 */

function readLocale(formData: FormData): Locale {
  const raw = String(formData.get("locale") ?? "");
  return isLocale(raw) ? raw : DEFAULT_LOCALE;
}

function requireAuthor(actor: Author | null): Author {
  if (!actor) throw new UnauthenticatedError();
  return actor;
}

/** 标签：逗号 / 顿号 / 空格分隔，去重后最多保留 12 个 */
function parseTags(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[,，、\s]+/)
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ).slice(0, 12);
}

function parseForm(formData: FormData): {
  errors: Record<string, string>;
  input: EncounterInput;
} {
  const errors: Record<string, string> = {};

  const title = String(formData.get("title") ?? "").trim();
  const typeRaw = String(formData.get("type") ?? "moment");
  const happenedAt = String(formData.get("happenedAt") ?? "").trim() || todayISO();
  const location = String(formData.get("location") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const coverImage = String(formData.get("coverImage") ?? "").trim();
  const tagsRaw = String(formData.get("tags") ?? "");
  const ratingRaw = String(formData.get("rating") ?? "").trim();
  const favorite = formData.get("favorite") !== null;

  if (!title) {
    errors.title = "titleRequired";
  } else if (title.length > 120) {
    errors.title = "titleTooLong";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(happenedAt)) {
    errors.happenedAt = "dateInvalid";
  }

  if (summary.length > 200) {
    errors.summary = "summaryTooLong";
  }

  if (coverImage && !/^https?:\/\//i.test(coverImage)) {
    errors.coverImage = "coverInvalid";
  }

  const tags = parseTags(tagsRaw);

  let rating: number | null = null;
  if (ratingRaw) {
    const parsed = Number(ratingRaw);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 5) rating = Math.round(parsed);
  }

  const type: EncounterType = isEncounterType(typeRaw) ? typeRaw : "moment";

  return {
    errors,
    input: {
      title,
      type,
      happenedAt,
      location,
      summary,
      content,
      tags,
      coverImage,
      rating,
      favorite,
    },
  };
}

export async function saveEncounterAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = readLocale(formData);
  const id = String(formData.get("id") ?? "").trim();
  const { errors, input } = parseForm(formData);
  const actor = await getCurrentAuthor();

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  let slug: string;
  try {
    // 新建必须登录（记录要有归属）；改已有记录由数据层校验是不是作者本人
    const saved = id
      ? await updateEncounter(id, input, actor)
      : await createEncounter(input, requireAuthor(actor).id);
    slug = saved.slug;
  } catch (error) {
    return { ok: false, messageKey: toErrorKey(error) };
  }

  // redirect 通过抛出信号实现跳转，必须放在 try/catch 之外，否则会被吞掉
  revalidatePath("/", "layout");
  redirect({ href: { pathname: `/encounters/${encodeURIComponent(slug)}` }, locale });

  // 不可达：上面的 redirect 一定会抛出跳转信号
  return { ok: true };
}

/**
 * 首页发帖框的提交入口。
 *
 * 和完整表单的区别：只要求写正文，其余字段都可选并给默认值。
 * 标题由正文首行推导 —— 列表与详情页需要一个短标题，正文则原样保存。
 * 发布后跳回首页，新帖子出现在时间流最上面。
 */
export async function postEncounterAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = readLocale(formData);
  const body = String(formData.get("body") ?? "").trim();

  if (!body) return { ok: false, messageKey: "bodyRequired" };
  if (body.length > MAX_POST_LENGTH) return { ok: false, messageKey: "bodyTooLong" };

  const typeRaw = String(formData.get("type") ?? "moment");
  const happenedAtRaw = String(formData.get("happenedAt") ?? "").trim();

  const input: EncounterInput = {
    title: postTitle(body),
    type: isEncounterType(typeRaw) ? typeRaw : "moment",
    happenedAt: /^\d{4}-\d{2}-\d{2}$/.test(happenedAtRaw) ? happenedAtRaw : todayISO(),
    location: String(formData.get("location") ?? "").trim(),
    summary: "",
    content: body,
    tags: parseTags(String(formData.get("tags") ?? "")),
    coverImage: "",
    rating: null,
    favorite: formData.get("favorite") !== null,
  };

  try {
    // 发帖必须有作者：记录要有归属
    const author = requireAuthor(await getCurrentAuthor());
    await createEncounter(input, author.id);
  } catch (error) {
    return { ok: false, messageKey: toErrorKey(error) };
  }

  // redirect 通过抛出信号实现跳转，必须放在 try/catch 之外，否则会被吞掉
  revalidatePath("/", "layout");
  redirect({ href: { pathname: "/" }, locale });

  // 不可达：上面的 redirect 一定会抛出跳转信号
  return { ok: true };
}

export async function deleteEncounterAction(formData: FormData): Promise<void> {
  const locale = readLocale(formData);
  const id = String(formData.get("id") ?? "").trim();
  const actor = await getCurrentAuthor();

  if (!id) {
    redirect({ href: { pathname: "/encounters" }, locale });
  }

  try {
    await deleteEncounter(id, actor);
  } catch (error) {
    revalidatePath("/", "layout");
    redirect({
      href: { pathname: "/encounters", query: { error: toErrorKey(error) } },
      locale,
    });
  }

  revalidatePath("/", "layout");
  redirect({ href: { pathname: "/encounters", query: { deleted: "1" } }, locale });
}
