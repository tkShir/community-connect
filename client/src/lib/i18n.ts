import translationsJson from "../../translation.json";

type FileKey = keyof typeof translationsJson;

export function t(file: FileKey, key: string): string {
  const fileTranslations = translationsJson[file];
  return (fileTranslations && fileTranslations[key]) || key;
}

export function tWithVars(
  file: FileKey,
  key: string,
  vars: Record<string, string | number>
): string {
  let text = t(file, key);
  for (const [k, v] of Object.entries(vars)) {
    text = text.replaceAll(`{${k}}`, String(v));
  }
  return text;
}

