// Markdown Message Content Renderer
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Code blocks with syntax highlighting
          code({ node: _node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const isInline = !match && !className;

            return !isInline && language ? (
              <div className="rounded-md my-2 overflow-hidden">
                <SyntaxHighlighter
                  style={vscDarkPlus as any}
                  language={language}
                  PreTag="div"
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code
                className="bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-pink-400"
                {...props}
              >
                {children}
              </code>
            );
          },
          // Styled links
          a({ node: _node, href, children, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
                {...props}
              >
                {children}
              </a>
            );
          },
          // Lists
          ul({ node: _node, children, ...props }) {
            return (
              <ul className="list-disc list-inside my-2 space-y-1" {...props}>
                {children}
              </ul>
            );
          },
          ol({ children, ...props }) {
            return (
              <ol
                className="list-decimal list-inside my-2 space-y-1"
                {...props}
              >
                {children}
              </ol>
            );
          },
          // Block quotes
          blockquote({ node: _node, children, ...props }) {
            return (
              <blockquote
                className="border-l-4 border-gray-600 pl-4 my-2 text-gray-400 italic"
                {...props}
              >
                {children}
              </blockquote>
            );
          },
          // Headers
          h1({ node: _node, children, ...props }) {
            return (
              <h1 className="text-2xl font-bold my-3" {...props}>
                {children}
              </h1>
            );
          },
          h2({ children, ...props }) {
            return (
              <h2 className="text-xl font-bold my-2" {...props}>
                {children}
              </h2>
            );
          },
          h3({ children, ...props }) {
            return (
              <h3 className="text-lg font-bold my-2" {...props}>
                {children}
              </h3>
            );
          },
          // Tables (from GFM)
          table({ node: _node, children, ...props }) {
            return (
              <div className="overflow-x-auto my-2">
                <table
                  className="border-collapse border border-gray-700 min-w-full"
                  {...props}
                >
                  {children}
                </table>
              </div>
            );
          },
          thead({ children, ...props }) {
            return (
              <thead className="bg-gray-800" {...props}>
                {children}
              </thead>
            );
          },
          th({ children, ...props }) {
            return (
              <th
                className="border border-gray-700 px-4 py-2 text-left font-semibold"
                {...props}
              >
                {children}
              </th>
            );
          },
          td({ children, ...props }) {
            return (
              <td className="border border-gray-700 px-4 py-2" {...props}>
                {children}
              </td>
            );
          },
          // Horizontal rule
          hr({ node: _node, ...props }) {
            return <hr className="my-4 border-t border-gray-700" {...props} />;
          },
          // Paragraphs
          p({ node: _node, children, ...props }) {
            return (
              <p className="my-1" {...props}>
                {children}
              </p>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
