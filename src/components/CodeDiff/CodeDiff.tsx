import { useRef, useEffect } from 'react';
import { createTwoFilesPatch } from 'diff';
import { Diff2HtmlUI } from 'diff2html/lib/ui/js/diff2html-ui-base.js';
import type { Diff2HtmlUIConfig } from 'diff2html/lib/ui/js/diff2html-ui-base';
import { ColorSchemeType } from 'diff2html/lib/types';
import 'diff2html/bundles/css/diff2html.min.css';
import hljs from 'highlight.js/lib/core';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import typescript from 'highlight.js/lib/languages/typescript';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import php from 'highlight.js/lib/languages/php';
import ruby from 'highlight.js/lib/languages/ruby';
import yaml from 'highlight.js/lib/languages/yaml';
import './CodeDiff.css';
import { useTheme } from '../../hooks/useTheme';

hljs.registerLanguage('java', java);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('json', json);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('go', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('c', c);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('php', php);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('yaml', yaml);

function applyHighlight(container: HTMLElement, language: string) {
  if (!hljs.getLanguage(language)) {
    language = 'plaintext';
  }
  const codeLines = container.querySelectorAll('.d2h-code-line-ctn');
  codeLines.forEach((line) => {
    const text = line.textContent;
    if (!text) return;
    const result = hljs.highlight(text, { language, ignoreIllegals: true });
    line.innerHTML = result.value;
    line.classList.add('hljs');
  });
}

interface CodeDiffProps {
  vulnerableCode: string;
  fixedCode: string;
}

export function CodeDiff({ vulnerableCode, fixedCode }: CodeDiffProps) {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const patch = createTwoFilesPatch(
      'vulnerable.java',
      'fixed.java',
      vulnerableCode,
      fixedCode,
      '',
      '',
      { context: 9999 }
    );

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

    const diff2htmlUi = new Diff2HtmlUI(containerRef.current, patch, configuration);
    diff2htmlUi.draw();

    applyHighlight(containerRef.current, 'java');
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
