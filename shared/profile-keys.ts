/**
 * Predefined profile option keys.
 * Shared between client and server to identify custom vs predefined values.
 */

export const PROFESSION_KEYS = [
  // Technology & Digital
  "technology",
  "software_engineering",
  "data_science_ai",
  "product_management_prof",
  "ux_ui_design",
  "cybersecurity",
  "cloud_infrastructure",
  // Finance & Investment
  "finance",
  "investment_banking",
  "private_equity_vc",
  "asset_management",
  "accounting",
  "insurance",
  "fintech",
  // Business & Strategy
  "consulting",
  "management_strategy",
  "business_development",
  "human_resources",
  "marketing",
  "public_relations",
  "logistics_transportation",
  // Law & Compliance
  "law",
  "legal_compliance",
  "intellectual_property",
  // Healthcare & Life Sciences
  "healthcare",
  "pharmaceutical",
  "medical_devices",
  // Manufacturing & Engineering
  "engineering",
  "manufacturing",
  "automotive",
  "aerospace_defense",
  "energy",
  "architecture_design",
  // Real Estate & Infrastructure
  "real_estate",
  "construction",
  // Media, Arts & Education
  "media_entertainment",
  "arts",
  "education",
  "research_academia",
  // Consumer & Retail
  "retail",
  "fashion_luxury",
  "hospitality_tourism",
  "agriculture_food",
  // Public & Social
  "government",
  "non_profit",
  "international_organizations",
  // Other
  "telecommunications",
  "family_business_management",
] as const;

export const CAREER_STATUS_KEYS = [
  "career_student",
  "career_company_employee",
  "career_family_business",
  "career_executive",
  "career_other",
] as const;

// Keep for backward compat (existing DB data references these)
export const GOAL_KEYS = [
  "find_mentor",
  "find_mentee",
  "professional_networking",
  "friendship_social",
  "activity_partner",
] as const;

export const INTEREST_KEYS = [
  // Leadership & Management
  "leadership",
  "management",
  "corporate_governance",
  "organizational_development",
  "change_management",
  // Strategy & Growth
  "business_strategy",
  "entrepreneurship",
  "startups",
  "innovation_management",
  "operational_excellence",
  // Finance & Investment
  "investing",
  "ma_mergers_acquisitions",
  "ipo",
  "private_equity",
  "wealth_management",
  "fintech",
  // Technology & Digital Transformation
  "ai",
  "dx_digital_transformation",
  "data_science",
  "cloud_computing",
  "cybersecurity",
  "product_management",
  // Marketing & Branding
  "brand_strategy",
  "digital_marketing",
  "growth_hacking",
  "ecommerce",
  "pr_communications",
  // International & Cross-Cultural
  "global_expansion",
  "cross_cultural_management",
  "international_trade",
  // Sustainability & Social Impact
  "sustainability",
  "esg",
  "social_impact",
  "family_business_succession",
  // Career Development
  "career_development",
  "negotiation",
  "public_speaking",
  "executive_coaching",
  "networking_skills",
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
