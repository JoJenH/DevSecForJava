import { useRef, useEffect } from 'react';
import { createTwoFilesPatch } from 'diff';
import { Diff2HtmlUI } from 'diff2html/lib/ui/js/diff2html-ui.js';
import type { Diff2HtmlUIConfig } from 'diff2html/lib/ui/js/diff2html-ui-base';
import { ColorSchemeType } from 'diff2html/lib/types';
import 'diff2html/bundles/css/diff2html.min.css';
import './CodeDiff.css';
import { useTheme } from '../../hooks/useTheme';

interface CodeDiffProps {
  vulnerableCode: string;
  fixedCode: string;
}

export function CodeDiff({ vulnerableCode, fixedCode }: CodeDiffProps) {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Generate unified diff
    const patch = createTwoFilesPatch(
      'vulnerable.java',
      'fixed.java',
      vulnerableCode,
      fixedCode,
      '',
      '',
      { context: 9999 }
    );

    // Configuration following official documentation
    const configuration: Diff2HtmlUIConfig = {
      drawFileList: false,
      matching: 'lines',
      outputFormat: 'side-by-side',
      colorScheme: isDark ? ColorSchemeType.DARK : ColorSchemeType.LIGHT,
      highlight: false,
      synchronisedScroll: true,
      fileContentToggle: false,
      stickyFileHeaders: false,
    };

    // Create Diff2HtmlUI instance and draw
    const diff2htmlUi = new Diff2HtmlUI(containerRef.current, patch, configuration);
    diff2htmlUi.draw();
  }, [vulnerableCode, fixedCode, isDark]);

  return (
    <div className="code-diff-wrapper">
      <div className="code-diff-header">
        <span className="code-diff-badge code-diff-badge--danger">漏洞代码</span>
        <span className="code-diff-badge code-diff-badge--success">修复代码</span>
      </div>
      <div
        ref={containerRef}
        className="code-diff-container"
      />
    </div>
  );
}
