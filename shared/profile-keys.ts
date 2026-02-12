/**
 * Predefined profile option keys.
 * Shared between client and server to identify custom vs predefined values.
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

export type OptionCategory = "profession" | "interests" | "hobbies";

const PREDEFINED_SETS: Record<OptionCategory, ReadonlySet<string>> = {
  profession: new Set(PROFESSION_KEYS),
  interests: new Set(INTEREST_KEYS),
  hobbies: new Set(HOBBY_KEYS),
};

/** Check if a value is a predefined key for a given category. */
export function isPredefinedKey(category: OptionCategory, value: string): boolean {
  return PREDEFINED_SETS[category]?.has(value) ?? false;
}
