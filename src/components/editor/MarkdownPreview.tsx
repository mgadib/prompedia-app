import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import DOMPurify from 'isomorphic-dompurify';

interface MarkdownPreviewProps {
    content: string;
    className?: string;
}

// Custom components for rendering
const components: Components = {
    // Code blocks with syntax highlighting styling
    code({ className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        const isInline = !match && !className?.includes('hljs');

        if (isInline) {
            return (
                <code
                    className="px-1.5 py-0.5 rounded bg-code text-code-foreground font-mono text-sm"
                    {...props}
                >
                    {children}
                </code>
            );
        }

        return (
            <code className={`${className || ''} block`} {...props}>
                {children}
            </code>
        );
    },
    // Code block wrapper
    pre({ children, ...props }) {
        return (
            <pre
                className="code-block overflow-x-auto p-4 rounded-md bg-code border border-code-border font-mono text-sm leading-relaxed my-4 custom-scrollbar"
                {...props}
            >
                {children}
            </pre>
        );
    },
    // Headings
    h1: ({ children, ...props }) => (
        <h1 className="text-2xl font-bold mt-6 mb-4 text-foreground" {...props}>{children}</h1>
    ),
    h2: ({ children, ...props }) => (
        <h2 className="text-xl font-bold mt-5 mb-3 text-foreground" {...props}>{children}</h2>
    ),
    h3: ({ children, ...props }) => (
        <h3 className="text-lg font-semibold mt-4 mb-2 text-foreground" {...props}>{children}</h3>
    ),
    h4: ({ children, ...props }) => (
        <h4 className="text-base font-semibold mt-3 mb-2 text-foreground" {...props}>{children}</h4>
    ),
    h5: ({ children, ...props }) => (
        <h5 className="text-sm font-semibold mt-2 mb-1 text-foreground" {...props}>{children}</h5>
    ),
    h6: ({ children, ...props }) => (
        <h6 className="text-sm font-medium mt-2 mb-1 text-muted-foreground" {...props}>{children}</h6>
    ),
    // Paragraph
    p: ({ children, ...props }) => (
        <p className="my-2 leading-relaxed text-foreground" {...props}>{children}</p>
    ),
    // Lists
    ul: ({ children, ...props }) => (
        <ul className="list-disc list-inside my-2 space-y-1 text-foreground" {...props}>{children}</ul>
    ),
    ol: ({ children, ...props }) => (
        <ol className="list-decimal list-inside my-2 space-y-1 text-foreground" {...props}>{children}</ol>
    ),
    li: ({ children, ...props }) => (
        <li className="leading-relaxed" {...props}>{children}</li>
    ),
    // Blockquote
    blockquote: ({ children, ...props }) => (
        <blockquote
            className="border-l-4 border-primary/30 pl-4 my-4 italic text-muted-foreground"
            {...props}
        >
            {children}
        </blockquote>
    ),
    // Horizontal rule
    hr: (props) => (
        <hr className="my-6 border-border" {...props} />
    ),
    // Links
    a: ({ children, href, ...props }) => (
        <a
            href={href}
            className="text-primary underline underline-offset-2 hover:text-primary/80"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
        >
            {children}
        </a>
    ),
    // Strong/Bold
    strong: ({ children, ...props }) => (
        <strong className="font-semibold text-foreground" {...props}>{children}</strong>
    ),
    // Emphasis/Italic
    em: ({ children, ...props }) => (
        <em className="italic" {...props}>{children}</em>
    ),
    // Tables (GFM)
    table: ({ children, ...props }) => (
        <div className="overflow-x-auto my-4 custom-scrollbar">
            <table className="min-w-full border-collapse border border-border" {...props}>
                {children}
            </table>
        </div>
    ),
    thead: ({ children, ...props }) => (
        <thead className="bg-secondary/50" {...props}>{children}</thead>
    ),
    tbody: ({ children, ...props }) => (
        <tbody {...props}>{children}</tbody>
    ),
    tr: ({ children, ...props }) => (
        <tr className="border-b border-border" {...props}>{children}</tr>
    ),
    th: ({ children, ...props }) => (
        <th className="px-4 py-2 text-left font-semibold text-foreground border border-border" {...props}>
            {children}
        </th>
    ),
    td: ({ children, ...props }) => (
        <td className="px-4 py-2 text-foreground border border-border" {...props}>{children}</td>
    ),
};

/**
 * Sanitize markdown content to prevent XSS attacks.
 * Removes potentially dangerous HTML while preserving markdown syntax.
 */
function sanitizeMarkdownContent(content: string): string {
    // Remove script tags and event handlers that might be embedded in markdown
    // This is a defense-in-depth measure - react-markdown already sanitizes by default
    const sanitized = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: [], // Don't allow any HTML tags in markdown content
        KEEP_CONTENT: true, // Keep text content
        ALLOW_DATA_ATTR: false,
    });
    
    return sanitized;
}

export const MarkdownPreview = ({ content, className = '' }: MarkdownPreviewProps) => {
    // Handle empty content
    if (!content || !content.trim()) {
        return (
            <div className={`text-muted-foreground italic ${className}`}>
                No content to preview
            </div>
        );
    }

    // Sanitize content before rendering to prevent XSS attacks
    const sanitizedContent = sanitizeMarkdownContent(content);

    return (
        <div className={`prose-preview ${className}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {sanitizedContent}
            </ReactMarkdown>
        </div>
    );
};
