import { useEffect, useRef } from 'react';
import type { VulnerabilityCategory } from '../../types';
import { CodeDiff } from '../CodeDiff/CodeDiff';
import { CheckList } from '../CheckList/CheckList';
import { POC } from '../POC/POC';
import './CategoryContent.css';

const STICKY_HEADER_HEIGHT = 140;

interface CategoryContentProps {
  category: VulnerabilityCategory;
  selectedItemId: string | null;
  onScrollItem: (itemId: string) => void;
}

export function CategoryContent({ category, selectedItemId, onScrollItem }: CategoryContentProps) {
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());
  const contentRef = useRef<HTMLDivElement>(null);
  const isManualScrolling = useRef(false);
  const lastScrolledItemId = useRef<string | null>(null);

  const displayedItem = selectedItemId
    ? category.items.find(i => i.id === selectedItemId) || category.items[0]
    : category.items[0];

  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl) return;

    const handleScroll = () => {
      if (isManualScrolling.current) return;

      const containerRect = contentEl.getBoundingClientRect();
      const detectionLine = containerRect.top + STICKY_HEADER_HEIGHT + 20;

      let currentItemId: string | null = null;
      let maxTop = -Infinity;

      for (const [id, element] of itemRefs.current.entries()) {
        const elementTop = element.getBoundingClientRect().top;

        if (elementTop <= detectionLine && elementTop > maxTop) {
          maxTop = elementTop;
          currentItemId = id;
        }
      }

      if (currentItemId && currentItemId !== lastScrolledItemId.current) {
        lastScrolledItemId.current = currentItemId;
        onScrollItem(currentItemId);
      }
    };

    contentEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => contentEl.removeEventListener('scroll', handleScroll);
  }, [onScrollItem]);

  useEffect(() => {
    lastScrolledItemId.current = null;
  }, [category.id]);

  useEffect(() => {
    if (!selectedItemId) return;

    if (selectedItemId === lastScrolledItemId.current) return;

    const element = itemRefs.current.get(selectedItemId);
    if (!element || !contentRef.current) return;

    isManualScrolling.current = true;

    const containerTop = contentRef.current.getBoundingClientRect().top;
    const elementTop = element.getBoundingClientRect().top;
    const currentScroll = contentRef.current.scrollTop;
    const targetScroll = currentScroll + (elementTop - containerTop) - STICKY_HEADER_HEIGHT - 10;

    contentRef.current.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: 'smooth'
    });

    const timeoutId = setTimeout(() => {
      isManualScrolling.current = false;
      lastScrolledItemId.current = selectedItemId;
    }, 600);

    return () => clearTimeout(timeoutId);
  }, [selectedItemId]);

  const setItemRef = (id: string) => (el: HTMLElement | null) => {
    if (el) {
      itemRefs.current.set(id, el);
    }
  };

  return (
    <main className="category-content" ref={contentRef}>
      {displayedItem && (
        <div className="sticky-header">
          <div className="sticky-header-category">{category.name}</div>
          <h2 className="sticky-header-title">{displayedItem.name}</h2>
          <p className="sticky-header-description">{displayedItem.description}</p>
        </div>
      )}

      <div className="content-body">
        {category.items.map((item, index) => (
          <article
            key={item.id}
            ref={setItemRef(item.id!)}
            className={`vulnerability-item ${selectedItemId === item.id ? 'is-active' : ''}`}
            data-item-id={item.id}
          >
            <div className="item-header">
              <span className="item-number">{String(index + 1).padStart(2, '0')}</span>
              <div className="item-meta">
                <div className="item-category">{category.name}</div>
                <h2 className="item-title">{item.name}</h2>
              </div>
            </div>

            <p className="item-description">{item.description}</p>

            <div className="item-content">
              <CodeDiff
                vulnerableCode={item.vulnerableCode}
                fixedCode={item.fixedCode}
              />

              <CheckList
                auditPoints={item.auditPoints}
                fixPoints={item.fixPoints}
              />

              <POC poc={item.poc} verifyUrl={item.verifyUrl} defaultPayload={item.payload} />
            </div>

            {index < category.items.length - 1 && <div className="item-divider" />}
          </article>
        ))}
      </div>
    </main>
  );
}
