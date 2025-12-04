"use client";

interface MarkdownRendererProps {
  content: string;
}

/**
 * 간단한 마크다운 렌더러
 * 지원: 헤딩(#), 리스트(-), 볼드(**), 이탤릭(*), 코드(`), 링크, 수평선(---), 테이블
 */
export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const renderMarkdown = (markdown: string): React.ReactNode[] => {
    const lines = markdown.split("\n");
    const elements: React.ReactNode[] = [];
    let i = 0;
    let listItems: string[] = [];
    let tableRows: string[][] = [];
    let isInTable = false;

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-3 text-[#1f2328]">
            {listItems.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInline(item)}
              </li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    const flushTable = () => {
      if (tableRows.length > 0) {
        const headerRow = tableRows[0];
        const bodyRows = tableRows.slice(2); // Skip header and separator
        elements.push(
          <div key={`table-${elements.length}`} className="overflow-x-auto my-4">
            <table className="min-w-full border-collapse border border-[#d0d7de]">
              <thead>
                <tr className="bg-[#f6f8fa]">
                  {headerRow.map((cell, idx) => (
                    <th
                      key={idx}
                      className="border border-[#d0d7de] px-4 py-2 text-left text-sm font-semibold text-[#1f2328]"
                    >
                      {renderInline(cell.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className={rowIdx % 2 === 0 ? "bg-white" : "bg-[#f6f8fa]"}>
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className="border border-[#d0d7de] px-4 py-2 text-sm text-[#1f2328]"
                      >
                        {renderInline(cell.trim())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        isInTable = false;
      }
    };

    while (i < lines.length) {
      const line = lines[i];

      // 빈 줄
      if (line.trim() === "") {
        flushList();
        if (isInTable) flushTable();
        i++;
        continue;
      }

      // 테이블 감지 (| 로 시작하는 줄)
      if (line.trim().startsWith("|")) {
        flushList();
        const cells = line
          .split("|")
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        tableRows.push(cells);
        isInTable = true;
        i++;
        continue;
      } else if (isInTable) {
        flushTable();
      }

      // 수평선
      if (line.trim().match(/^(-{3,}|\*{3,}|_{3,})$/)) {
        flushList();
        elements.push(
          <hr key={`hr-${elements.length}`} className="my-6 border-t border-[#d0d7de]" />
        );
        i++;
        continue;
      }

      // 헤딩
      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        flushList();
        const level = headingMatch[1].length;
        const text = headingMatch[2];
        const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
        const headingClasses: Record<number, string> = {
          1: "text-2xl font-bold text-[#1f2328] mt-6 mb-4",
          2: "text-xl font-semibold text-[#1f2328] mt-5 mb-3",
          3: "text-lg font-semibold text-[#1f2328] mt-4 mb-2",
          4: "text-base font-semibold text-[#1f2328] mt-3 mb-2",
          5: "text-sm font-semibold text-[#1f2328] mt-3 mb-1",
          6: "text-sm font-medium text-[#656d76] mt-3 mb-1",
        };
        elements.push(
          <HeadingTag key={`h-${elements.length}`} className={headingClasses[level]}>
            {renderInline(text)}
          </HeadingTag>
        );
        i++;
        continue;
      }

      // 리스트 아이템
      if (line.match(/^\s*[-*+]\s+/)) {
        const itemText = line.replace(/^\s*[-*+]\s+/, "");
        listItems.push(itemText);
        i++;
        continue;
      }

      // 숫자 리스트
      if (line.match(/^\s*\d+\.\s+/)) {
        flushList();
        const itemText = line.replace(/^\s*\d+\.\s+/, "");
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal list-inside my-3 text-[#1f2328]">
            <li className="leading-relaxed">{renderInline(itemText)}</li>
          </ol>
        );
        i++;
        continue;
      }

      // 일반 텍스트 (paragraph)
      flushList();
      elements.push(
        <p key={`p-${elements.length}`} className="my-3 text-[#1f2328] leading-relaxed">
          {renderInline(line)}
        </p>
      );
      i++;
    }

    flushList();
    if (isInTable) flushTable();

    return elements;
  };

  const renderInline = (text: string): React.ReactNode => {
    // 인라인 마크다운 처리
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // 볼드 (**text**)
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(processInlineCode(remaining.substring(0, boldMatch.index), key++));
        }
        parts.push(
          <strong key={key++} className="font-semibold">
            {processInlineCode(boldMatch[1], key++)}
          </strong>
        );
        remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
        continue;
      }

      // 이탤릭 (*text* 또는 _text_)
      const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)|_([^_]+)_/);
      if (italicMatch && italicMatch.index !== undefined) {
        if (italicMatch.index > 0) {
          parts.push(processInlineCode(remaining.substring(0, italicMatch.index), key++));
        }
        parts.push(
          <em key={key++} className="italic">
            {processInlineCode(italicMatch[1] || italicMatch[2], key++)}
          </em>
        );
        remaining = remaining.substring(italicMatch.index + italicMatch[0].length);
        continue;
      }

      // 링크 [text](url)
      const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch && linkMatch.index !== undefined) {
        if (linkMatch.index > 0) {
          parts.push(processInlineCode(remaining.substring(0, linkMatch.index), key++));
        }
        parts.push(
          <a
            key={key++}
            href={linkMatch[2]}
            className="text-[#0969da] hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {linkMatch[1]}
          </a>
        );
        remaining = remaining.substring(linkMatch.index + linkMatch[0].length);
        continue;
      }

      // 나머지 텍스트
      parts.push(processInlineCode(remaining, key++));
      break;
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  const processInlineCode = (text: string, baseKey: number): React.ReactNode => {
    // 인라인 코드 (`code`)
    const parts: React.ReactNode[] = [];
    const regex = /`([^`]+)`/g;
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <code
          key={`code-${baseKey}-${key++}`}
          className="bg-[#f6f8fa] px-1.5 py-0.5 rounded text-sm font-mono text-[#1f2328]"
        >
          {match[1]}
        </code>
      );
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  return (
    <div className="prose prose-sm max-w-none">
      {renderMarkdown(content)}
    </div>
  );
}

