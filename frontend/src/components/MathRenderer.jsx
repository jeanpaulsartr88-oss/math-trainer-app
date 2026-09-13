import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';

export default function MathRenderer({ content, block = false, className = '' }) {
  if (!content) return null;

  // If text is pure LaTeX formula without markers
  const trimmed = content.trim();

  // If content contains $$ formula $$ or $ inline $
  if (trimmed.includes('$')) {
    // Split by $$...$$ and $...$
    const parts = [];
    const regex = /(\$\$[\s\S]*?\$\$|\$[^$]+?\$)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          value: content.substring(lastIndex, match.index),
        });
      }
      const raw = match[0];
      if (raw.startsWith('$$') && raw.endsWith('$$')) {
        parts.push({
          type: 'block',
          value: raw.slice(2, -2).trim(),
        });
      } else {
        parts.push({
          type: 'inline',
          value: raw.slice(1, -1).trim(),
        });
      }
      lastIndex = match.index + raw.length;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        value: content.substring(lastIndex),
      });
    }

    return (
      <div className={`leading-relaxed ${className}`}>
        {parts.map((p, idx) => {
          if (p.type === 'block') {
            return (
              <div key={idx} className="my-3 overflow-x-auto text-center">
                <BlockMath math={p.value} errorColor="#ef4444" />
              </div>
            );
          }
          if (p.type === 'inline') {
            return <InlineMath key={idx} math={p.value} errorColor="#ef4444" />;
          }
          return (
            <span key={idx} className="whitespace-pre-line">
              {p.value}
            </span>
          );
        })}
      </div>
    );
  }

  // If it's a LaTeX snippet without $ delimiters (e.g. \frac{2}{3} in options)
  const isLatex = /[\\[\]{}^_]/.test(trimmed);

  if (isLatex) {
    if (block) {
      return (
        <div className={`overflow-x-auto text-center ${className}`}>
          <BlockMath math={trimmed} errorColor="#ef4444" />
        </div>
      );
    }
    return (
      <span className={className}>
        <InlineMath math={trimmed} errorColor="#ef4444" />
      </span>
    );
  }

  return <span className={className}>{content}</span>;
}
