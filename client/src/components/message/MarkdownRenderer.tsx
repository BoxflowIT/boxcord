// Markdown Renderer - Render messages with markdown support
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/github-dark.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className = ''
}: MarkdownRendererProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Style code blocks
          code: ({ node: _node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !className;
            return !isInline ? (
              <div className="relative my-2">
                {match && (
                  <div className="absolute top-2 right-2 text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
                    {match[1]}
                  </div>
                )}
                <code className={className} {...props}>
                  {children}
                </code>
              </div>
            ) : (
              <code
                className="bg-gray-800/50 px-1.5 py-0.5 rounded text-sm"
                {...props}
              >
                {children}
              </code>
            );
          },
          // Style links
          a: ({ node: _node, children, ...props }) => (
            <a
              {...props}
              className="text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          // Style blockquotes
          blockquote: ({ node: _node, children, ...props }) => (
            <blockquote
              className="border-l-4 border-gray-600 pl-4 my-2 italic text-gray-300"
              {...props}
            >
              {children}
            </blockquote>
          ),
          // Style lists
          ul: ({ node: _node, children, ...props }) => (
            <ul className="list-disc list-inside my-2 space-y-1" {...props}>
              {children}
            </ul>
          ),
          ol: ({ node: _node, children, ...props }) => (
            <ol className="list-decimal list-inside my-2 space-y-1" {...props}>
              {children}
            </ol>
          ),
          // Style headings
          h1: ({ node: _node, children, ...props }) => (
            <h1 className="text-2xl font-bold my-2" {...props}>
              {children}
            </h1>
          ),
          h2: ({ node: _node, children, ...props }) => (
            <h2 className="text-xl font-bold my-2" {...props}>
              {children}
            </h2>
          ),
          h3: ({ node: _node, children, ...props }) => (
            <h3 className="text-lg font-bold my-2" {...props}>
              {children}
            </h3>
          ),
          // Style horizontal rules
          hr: ({ node: _node, ...props }) => (
            <hr className="border-gray-600 my-4" {...props} />
          ),
          // Style tables
          table: ({ node: _node, children, ...props }) => (
            <div className="overflow-x-auto my-2">
              <table
                className="border-collapse border border-gray-600"
                {...props}
              >
                {children}
              </table>
            </div>
          ),
          th: ({ node: _node, children, ...props }) => (
            <th
              className="border border-gray-600 px-3 py-2 bg-gray-800"
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ node: _node, children, ...props }) => (
            <td className="border border-gray-600 px-3 py-2" {...props}>
              {children}
            </td>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
