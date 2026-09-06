import React from "react";

/**
 * Strips raw markdown bold tokens from plain string
 */
export function cleanMarkdownText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/gm, "");
}

function renderFormattedInline(text: string) {
  // Split by **bold** markers
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={idx} className="font-semibold text-zinc-900 dark:text-zinc-100">
          {boldText}
        </strong>
      );
    }
    const clean = part.replace(/\*\*/g, "");
    return <React.Fragment key={idx}>{clean}</React.Fragment>;
  });
}

/**
 * Renders AI message text with clean formatting:
 * - Markdown headings (###, ##) rendered as styled section titles
 * - Bullet lists (- or *) rendered as nice disc items
 * - Numbered steps (1., 2.) styled with amber badges
 * - **bold** markers rendered as semibold text
 */
export const FormattedAiMessage: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;

  const lines = content.split("\n");

  return (
    <div className="space-y-1.5 leading-relaxed text-sm text-zinc-800 dark:text-zinc-200">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lineIdx} className="h-1" />;
        }

        // Check for headings: ### or ## or #
        const headerMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
        if (headerMatch) {
          const level = headerMatch[1].length;
          const text = headerMatch[2];
          if (level <= 2) {
            return (
              <h3 key={lineIdx} className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-2 mb-1">
                {renderFormattedInline(text)}
              </h3>
            );
          }
          return (
            <h4 key={lineIdx} className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1.5 mb-0.5">
              {renderFormattedInline(text)}
            </h4>
          );
        }

        // Check for bullet lists: - or *
        const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
        if (bulletMatch) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 ml-2">
              <span className="text-amber-500 font-bold select-none leading-5">•</span>
              <div className="flex-1">{renderFormattedInline(bulletMatch[1])}</div>
            </div>
          );
        }

        // Check for numbered steps: 1. or 2.
        const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
        if (numMatch) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 ml-1 mt-0.5">
              <span className="inline-flex items-center justify-center h-4.5 w-4.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-[11px] font-bold shrink-0 mt-0.5">
                {numMatch[1]}
              </span>
              <div className="flex-1">{renderFormattedInline(numMatch[2])}</div>
            </div>
          );
        }

        // Regular line
        return (
          <div key={lineIdx} className="break-words">
            {renderFormattedInline(line)}
          </div>
        );
      })}
    </div>
  );
};
