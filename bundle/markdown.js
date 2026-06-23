// Minimal, dependency-free Markdown → HTML renderer for the literature review.
// Covers what reviewPrompts produces: ## / ### headings, **bold**, *italic*,
// `code`, ordered / unordered lists, and paragraphs. CSP-safe (no external libs).

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Inline spans, applied AFTER block-level escaping.
function inline(s) {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

export function renderMarkdown(md) {
  const lines = (md || "").replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let listType = null; // "ul" | "ol" | null

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (!line.trim()) {
      closeList();
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      closeList();
      const level = h[1].length;
      html.push(`<h${level}>${inline(escapeHtml(h[2]))}</h${level}>`);
      continue;
    }

    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (ol) {
      if (listType !== "ol") {
        closeList();
        html.push("<ol>");
        listType = "ol";
      }
      html.push(`<li>${inline(escapeHtml(ol[1]))}</li>`);
      continue;
    }

    const ul = line.match(/^\s*[-*+]\s+(.*)$/);
    if (ul) {
      if (listType !== "ul") {
        closeList();
        html.push("<ul>");
        listType = "ul";
      }
      html.push(`<li>${inline(escapeHtml(ul[1]))}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${inline(escapeHtml(line))}</p>`);
  }

  closeList();
  return html.join("\n");
}
