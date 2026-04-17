import Markdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface MarkdownProps {
  content?: string | null;
}

const components: Components = {
  h1: ({ node: _n, ...props }) => <h1 className="text-3xl font-bold mb-4 text-white" {...props} />,
  h2: ({ node: _n, ...props }) => (
    <h2 className="text-2xl font-bold mb-3 mt-6 text-white" {...props} />
  ),
  h3: ({ node: _n, ...props }) => (
    <h3 className="text-xl font-bold mb-2 mt-4 text-white" {...props} />
  ),
  h4: ({ node: _n, ...props }) => (
    <h4 className="text-lg font-semibold mb-2 mt-3 text-white" {...props} />
  ),
  p: ({ node: _n, ...props }) => (
    <p className="mb-4 text-text-secondary leading-relaxed" {...props} />
  ),
  ul: ({ node: _n, ...props }) => (
    <ul className="list-disc ml-6 mb-4 text-text-secondary space-y-1" {...props} />
  ),
  ol: ({ node: _n, ...props }) => (
    <ol className="list-decimal ml-6 mb-4 text-text-secondary space-y-1" {...props} />
  ),
  li: ({ node: _n, ...props }) => <li className="leading-relaxed" {...props} />,
  strong: ({ node: _n, ...props }) => <strong className="text-white font-semibold" {...props} />,
  a: ({ node: _n, ...props }) => (
    <a
      className="text-brand hover:underline"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  blockquote: ({ node: _n, ...props }) => (
    <blockquote
      className="border-l-4 border-brand/40 pl-4 my-4 text-text-secondary italic"
      {...props}
    />
  ),
  hr: ({ node: _n, ...props }) => <hr className="border-surface my-6" {...props} />,
  code: ({ node: _n, className, children, ...props }) => {
    const isBlock = /language-(\w+)/.test(className ?? '');
    if (isBlock) {
      return (
        <code className="text-sm font-mono" {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="bg-surface text-brand rounded px-1 py-0.5 text-sm font-mono"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ node: _n, ...props }) => (
    <div className="px-1 py-2 md:p-4 mb-4 w-full min-w-0 overflow-x-auto rounded-lg border border-white/5 bg-surface">
      <pre className="text-sm" {...props} />
    </div>
  ),
  table: ({ node: _n, ...props }) => (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-sm text-left border-collapse" {...props} />
    </div>
  ),
  thead: ({ node: _n, ...props }) => <thead className="border-b border-surface" {...props} />,
  th: ({ node: _n, ...props }) => (
    <th className="px-4 py-2 text-white font-semibold text-left" {...props} />
  ),
  td: ({ node: _n, ...props }) => (
    <td className="px-4 py-2 text-text-secondary border-b border-surface/50" {...props} />
  ),
};

export default function MarkdownContent({ content }: MarkdownProps) {
  return (
    <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={components}>
      {content ?? ''}
    </Markdown>
  );
}
