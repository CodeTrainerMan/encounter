import { getRequestConfig } from "next-intl/server";
import { routing, type AppLocale } from "./routing";

function resolveLocale(value: string | undefined): AppLocale {
  const locales = routing.locales as readonly string[];
  return value && locales.includes(value) ? (value as AppLocale) : routing.defaultLocale;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = resolveLocale(await requestLocale);

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
