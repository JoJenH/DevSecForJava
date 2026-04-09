export interface VulnerabilityItem {
  name: string;
  description: string;
  vulnerableCode: string;
  fixedCode: string;
  vulnerableCodeLanguage?: string;
  fixedCodeLanguage?: string;
  auditPoints: string[];
  fixPoints: string[];
  poc: string;
  payload?: string;
}

export interface VulnerabilityCategory {
  name: string;
  items: VulnerabilityItem[];
}

export interface CategoryInfo {
  name: string;
}

export interface CategoryContent {
  name: string;
  content: string;
}
