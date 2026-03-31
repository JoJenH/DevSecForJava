import { useEffect, useRef, useState, useCallback } from 'react';
import type { VulnerabilityItem, VulnerabilityCategory } from '../../types';
import { CodeDiff } from '../CodeDiff/CodeDiff';
import { CheckList } from '../CheckList/CheckList';
import { POC } from '../POC/POC';
import './Content.css';

interface ContentProps {
  items: VulnerabilityItem[];
  categories: VulnerabilityCategory[];
  selectedItemId: string | null;
  onItemVisible: (itemId: string) => void;
}

export function Content({ items, categories, selectedItemId, onItemVisible }: ContentProps) {
  const [activeItemId, setActiveItemId] = useState<string | null>(selectedItemId);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Track which item is currently visible
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const offset = 100; // Offset for sticky header

      let currentActiveId: string | null = null;
      
      for (const [id, element] of itemRefs.current.entries()) {
        const rect = element.getBoundingClientRect();
        const containerRect = contentRef.current.getBoundingClientRect();
        const relativeTop = rect.top - containerRect.top;
        
        if (relativeTop <= offset) {
          currentActiveId = id;
        }
      }
      
      if (currentActiveId && currentActiveId !== activeItemId) {
        setActiveItemId(currentActiveId);
        onItemVisible(currentActiveId);
      }
    };

    const contentEl = contentRef.current;
    if (contentEl) {
      contentEl.addEventListener('scroll', handleScroll);
      return () => contentEl.removeEventListener('scroll', handleScroll);
    }
  }, [activeItemId, onItemVisible]);

  // Scroll to selected item
  useEffect(() => {
    if (selectedItemId && itemRefs.current.has(selectedItemId)) {
      const element = itemRefs.current.get(selectedItemId);
      if (element && contentRef.current) {
        const containerRect = contentRef.current.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const relativeTop = elementRect.top - containerRect.top + contentRef.current.scrollTop;
        
        contentRef.current.scrollTo({
          top: relativeTop - 80,
          behavior: 'smooth'
        });
      }
    }
  }, [selectedItemId]);

  const setItemRef = useCallback((id: string) => (el: HTMLElement | null) => {
    if (el) {
      itemRefs.current.set(id, el);
    }
  }, []);

  const getCategoryName = (itemId: string) => {
    const category = categories.find(cat => cat.items.some(item => item.id === itemId));
    return category?.name || '';
  };

  const activeItem = items.find(item => item.id === activeItemId);

  if (items.length === 0) {
    return (
      <main className="content" ref={contentRef}>
        <div className="empty-state">
          <p>暂无数据</p>
        </div>
      </main>
    );
  }

  return (
    <main className="content" ref={contentRef}>
      {/* Sticky Header */}
      <div className="sticky-header" ref={headerRef}>
        {activeItem ? (
          <>
            <div className="sticky-header-category">{getCategoryName(activeItem.id)}</div>
            <h2 className="sticky-header-title">{activeItem.name}</h2>
            <p className="sticky-header-description">{activeItem.description}</p>
          </>
        ) : (
          <>
            <div className="sticky-header-category">安全开发指南</div>
            <h2 className="sticky-header-title">Java 代码审计参考</h2>
            <p className="sticky-header-description">选择左侧导航查看各类漏洞详情</p>
          </>
        )}
      </div>

      {/* Content Items */}
      <div className="content-body">
        {items.map(item => (
          <article
            key={item.id}
            ref={setItemRef(item.id)}
            className={`vulnerability-item ${activeItemId === item.id ? 'is-active' : ''}`}
            data-item-id={item.id}
          >
            <div className="item-header">
              <div className="item-category">{getCategoryName(item.id)}</div>
              <h2 className="item-title">{item.name}</h2>
              <p className="item-description">{item.description}</p>
            </div>
            
            <div className="item-content">
              <CodeDiff 
                vulnerableCode={item.vulnerableCode} 
                fixedCode={item.fixedCode} 
              />
              
              <CheckList 
                auditPoints={item.auditPoints} 
                fixPoints={item.fixPoints} 
              />
              
              <POC poc={item.poc} />
            </div>
            
            <div className="item-divider" />
          </article>
        ))}
      </div>
    </main>
  );
}
