export interface VulnerabilityItem {
  id: string;
  name: string;
  shortName: string;
  description: string;
  vulnerableCode: string;
  fixedCode: string;
  auditPoints: string[];
  fixPoints: string[];
  poc: string;
}

export interface VulnerabilityCategory {
  id: string;
  name: string;
  items: VulnerabilityItem[];
}

export interface VulnerabilityData {
  categories: VulnerabilityCategory[];
}
