import type { VulnerabilityCategory, VulnerabilityItem } from '../types';

interface ParsedSection {
  type: 'description' | 'vulnerableCode' | 'fixedCode' | 'auditPoints' | 'fixPoints' | 'poc' | 'verifyUrl' | 'payload' | 'unknown';
  content: string;
  items?: string[];
}

export function parseMarkdown(content: string): VulnerabilityCategory {
  const lines = content.split('\n');
  
  const category: VulnerabilityCategory = {
    name: '',
    items: [],
  };

  let currentItem: VulnerabilityItem = {
    name: '',
    description: '',
    vulnerableCode: '',
    fixedCode: '',
    auditPoints: [],
    fixPoints: [],
    poc: '',
  };

  let currentSection: ParsedSection = { type: 'unknown', content: '' };
  let currentList: string[] = [];

  const flushItem = () => {
    if (currentItem.name) {
      if (currentSection.type !== 'unknown' && currentSection.content) {
        applySectionToItem(currentItem, currentSection);
      }
      category.items.push({ ...currentItem });
      currentItem = {
        name: '',
        description: '',
        vulnerableCode: '',
        fixedCode: '',
        auditPoints: [],
        fixPoints: [],
        poc: '',
      };
      currentSection = { type: 'unknown', content: '' };
      currentList = [];
    }
  };

  const flushSection = () => {
    if (currentSection.type !== 'unknown') {
      if (currentSection.type === 'auditPoints' || currentSection.type === 'fixPoints') {
        currentSection.items = [...currentList];
      }
      applySectionToItem(currentItem, currentSection);
    }
    currentSection = { type: 'unknown', content: '' };
    currentList = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('# ') && category.name === '') {
      category.name = trimmed.substring(2).trim();
      continue;
    }

    if (trimmed.startsWith('## ')) {
      flushItem();
      currentItem.name = trimmed.substring(3).trim();
      continue;
    }

    if (trimmed.startsWith('### ')) {
      flushSection();
      const sectionTitle = trimmed.substring(4).trim().toLowerCase();
      
      if (sectionTitle === 'vulnerable-code') {
        currentSection = { type: 'vulnerableCode', content: '' };
      } else if (sectionTitle === 'fixed-code') {
        currentSection = { type: 'fixedCode', content: '' };
      } else if (sectionTitle === '审计点') {
        currentSection = { type: 'auditPoints', content: '' };
      } else if (sectionTitle === '修复点') {
        currentSection = { type: 'fixPoints', content: '' };
      } else if (sectionTitle === '利用方式' || sectionTitle === 'poc') {
        currentSection = { type: 'poc', content: '' };
      } else if (sectionTitle === '验证接口') {
        currentSection = { type: 'verifyUrl', content: '' };
      } else if (sectionTitle === 'payload') {
        currentSection = { type: 'payload', content: '' };
      } else {
        currentSection = { type: 'unknown', content: '' };
      }
      continue;
    }

    if (trimmed.startsWith('```')) {
      continue;
    }

    if (currentSection.type === 'auditPoints' || currentSection.type === 'fixPoints') {
      const listMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
      if (listMatch) {
        currentList.push(listMatch[2]);
        continue;
      }
      if (trimmed === '' && currentList.length > 0) {
        flushSection();
        continue;
      }
    }

    if (currentSection.type === 'vulnerableCode' || currentSection.type === 'fixedCode' || currentSection.type === 'payload') {
      if (trimmed !== '') {
        currentSection.content += (currentSection.content ? '\n' : '') + line;
      }
      continue;
    }

    if (currentSection.type === 'verifyUrl') {
      const codeMatch = trimmed.match(/^`([^`]+)`$/);
      if (codeMatch) {
        currentSection.content = codeMatch[1];
        applySectionToItem(currentItem, currentSection);
        currentSection = { type: 'unknown', content: '' };
      } else if (trimmed !== '') {
        currentSection.content += (currentSection.content ? '\n' : '') + trimmed;
      }
      continue;
    }

    if (currentSection.type === 'poc' || currentSection.type === 'description') {
      if (trimmed !== '') {
        currentSection.content += (currentSection.content ? '\n' : '') + trimmed;
      }
      continue;
    }

    if (currentSection.type === 'unknown' && trimmed !== '') {
      currentSection.type = 'description';
      currentSection.content += (currentSection.content ? '\n' : '') + trimmed;
    }
  }

  flushSection();
  flushItem();

  return category;
}

function applySectionToItem(item: VulnerabilityItem, section: ParsedSection) {
  switch (section.type) {
    case 'description':
      item.description = section.content.trim();
      break;
    case 'vulnerableCode':
      item.vulnerableCode = section.content.trim();
      break;
    case 'fixedCode':
      item.fixedCode = section.content.trim();
      break;
    case 'auditPoints':
      item.auditPoints = section.items || [];
      break;
    case 'fixPoints':
      item.fixPoints = section.items || [];
      break;
    case 'poc':
      item.poc = section.content.trim();
      break;
    case 'verifyUrl':
      item.verifyUrl = section.content.trim();
      break;
    case 'payload':
      item.payload = section.content.trim();
      break;
  }
}
