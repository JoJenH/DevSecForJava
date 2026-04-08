export interface VulnerabilityItem {
  name: string;
  description: string;
  vulnerableCode: string;
  fixedCode: string;
  auditPoints: string[];
  fixPoints: string[];
  poc: string;
  verifyUrl?: string;
  payload?: string;
}

export interface VulnerabilityCategory {
  name: string;
  items: VulnerabilityItem[];
}

export interface VulnerabilityData {
  categories: VulnerabilityCategory[];
}

export interface CategoryInfo {
  name: string;
}

export interface CategoryContent {
  name: string;
  content: string;
}
