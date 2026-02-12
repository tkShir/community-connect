import { t } from "./i18n";

/**
 * Centralized profile option definitions.
 *
 * Each option is stored in the DB as a locale-independent key (e.g. "technology").
 * Display labels are resolved at render time via the translation system.
 */

export const PROFESSION_KEYS = [
  "technology",
  "finance",
  "consulting",
  "healthcare",
  "education",
  "arts",
  "engineering",
  "law",
  "marketing",
  "real_estate",
  "manufacturing",
  "retail",
  "media_entertainment",
  "government",
  "non_profit",
  "architecture_design",
  "hospitality_tourism",
  "agriculture_food",
  "logistics_transportation",
  "energy",
  "pharmaceutical",
  "insurance",
  "telecommunications",
  "human_resources",
  "accounting",
] as const;

export const GOAL_KEYS = [
  "find_mentor",
  "find_mentee",
  "professional_networking",
  "friendship_social",
  "activity_partner",
] as const;

export const INTEREST_KEYS = [
  "ai",
  "startups",
  "investing",
  "ux_design",
  "data_science",
  "product_management",
  "growth_hacking",
  "blockchain",
  "sustainability",
  "leadership",
  "cloud_computing",
  "cybersecurity",
  "machine_learning",
  "digital_marketing",
  "entrepreneurship",
  "social_impact",
  "fintech",
  "ecommerce",
  "remote_work",
  "career_development",
] as const;

export const HOBBY_KEYS = [
  "soccer",
  "tennis",
  "reading",
  "hiking",
  "cooking",
  "photography",
  "traveling",
  "yoga",
  "gaming",
  "painting",
  "running",
  "gym_fitness",
  "music",
  "movies",
  "meditation",
  "surfing",
  "cycling",
  "dancing",
  "crafts_diy",
  "wine_sake",
  "camping",
  "golf",
  "basketball",
  "swimming",
  "gardening",
] as const;

export const AGE_RANGE_KEYS = [
  "age_below_18",
  "age_18_22",
  "age_23_26",
  "age_27_30",
  "age_30_34",
  "age_above_34",
] as const;

export const CONTACT_METHOD_KEYS = [
  "phone",
  "email",
  "line",
] as const;

/** Translate a single profile option key to the current locale label. */
export function translateOptionKey(key: string): string {
  const translationKey = "onboarding." + key;
  const translated = t(translationKey);
  // t() returns the full key string when no translation is found
  return translated === translationKey ? key : translated;
}

/** Translate an array of profile option keys. */
export function translateOptionKeys(keys: string[]): string[] {
  return keys.map(translateOptionKey);
}

/** Build { key, label } options array for a set of keys. */
export function buildOptions(keys: readonly string[]): { key: string; label: string }[] {
  return keys.map((key) => ({ key, label: translateOptionKey(key) }));
}

/**
 * Reverse mapping: legacy translated values (both EN and JA) → key.
 * Used to migrate profiles that stored translated strings instead of keys.
 */
const LEGACY_MAP: Record<string, string> = {};

function addLegacy(key: string, en: string, ja: string) {
  LEGACY_MAP[en] = key;
  LEGACY_MAP[en.toLowerCase()] = key;
  LEGACY_MAP[ja] = key;
}

// Professions (original 10)
addLegacy("technology", "Technology", "テクノロジー");
addLegacy("finance", "Finance", "金融");
addLegacy("consulting", "Consulting", "コンサルティング");
addLegacy("healthcare", "Healthcare", "医療・ヘルスケア");
addLegacy("education", "Education", "教育");
addLegacy("arts", "Arts", "アート");
addLegacy("engineering", "Engineering", "エンジニアリング");
addLegacy("law", "Law", "法律");
addLegacy("marketing", "Marketing", "マーケティング");
addLegacy("real_estate", "Real Estate", "不動産");

// Goals
addLegacy("find_mentor", "Find a Mentor", "メンターを探す");
addLegacy("find_mentee", "Find a Mentee", "メンティーを探す");
addLegacy("professional_networking", "Professional Networking", "ビジネス交流");
addLegacy("friendship_social", "Friendship / Social", "友人・交流");
addLegacy("activity_partner", "Activity Partner", "一緒に活動する相手");

// Interests (original 10)
addLegacy("ai", "AI", "AI");
addLegacy("startups", "Startups", "スタートアップ");
addLegacy("investing", "Investing", "投資");
addLegacy("ux_design", "UX Design", "UXデザイン");
addLegacy("data_science", "Data Science", "データサイエンス");
addLegacy("product_management", "Product Management", "プロダクトマネジメント");
addLegacy("growth_hacking", "Growth Hacking", "グロースハック");
addLegacy("blockchain", "Blockchain", "ブロックチェーン");
addLegacy("sustainability", "Sustainability", "サステナビリティ");
addLegacy("leadership", "Leadership", "リーダーシップ");

// Hobbies (original 10)
addLegacy("soccer", "Soccer", "サッカー");
addLegacy("tennis", "Tennis", "テニス");
addLegacy("reading", "Reading", "読書");
addLegacy("hiking", "Hiking", "ハイキング");
addLegacy("cooking", "Cooking", "料理");
addLegacy("photography", "Photography", "写真");
addLegacy("traveling", "Traveling", "旅行");
addLegacy("yoga", "Yoga", "ヨガ");
addLegacy("gaming", "Gaming", "ゲーム");
addLegacy("painting", "Painting", "絵画");

// Age ranges
addLegacy("age_below_18", "below 18", "18歳未満");
addLegacy("age_18_22", "18-22", "18〜22歳");
addLegacy("age_23_26", "23-26", "23〜26歳");
addLegacy("age_27_30", "27-30", "27〜30歳");
addLegacy("age_30_34", "30-34", "30〜34歳");
addLegacy("age_above_34", "above 34", "35歳以上");

// Contact methods
addLegacy("phone", "Phone", "電話");
addLegacy("email", "Email", "メール");
addLegacy("line", "LINE", "LINE");

/** Convert a legacy translated value to its key. Returns value as-is if not found. */
export function migrateToKey(value: string): string {
  return LEGACY_MAP[value] ?? LEGACY_MAP[value.toLowerCase()] ?? value;
}

/** Migrate an array of legacy values to keys. */
export function migrateArrayToKeys(values: string[]): string[] {
  return values.map(migrateToKey);
}
