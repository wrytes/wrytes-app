import { cn } from '@/lib/utils';

interface TagListProps {
  tags: string[];
  activeTags?: string[];
  className?: string;
}

// Full class-name strings kept as literals so Tailwind's scanner includes them.
const TAG_PALETTE = [
  { bg: 'bg-blue-500/10',    text: 'text-blue-300',    border: 'border-blue-500/20'    },
  { bg: 'bg-violet-500/10',  text: 'text-violet-300',  border: 'border-violet-500/20'  },
  { bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/20' },
  { bg: 'bg-teal-500/10',    text: 'text-teal-300',    border: 'border-teal-500/20'    },
  { bg: 'bg-amber-500/10',   text: 'text-amber-300',   border: 'border-amber-500/20'   },
  { bg: 'bg-rose-500/10',    text: 'text-rose-300',    border: 'border-rose-500/20'    },
  { bg: 'bg-indigo-500/10',  text: 'text-indigo-300',  border: 'border-indigo-500/20'  },
  { bg: 'bg-cyan-500/10',    text: 'text-cyan-300',    border: 'border-cyan-500/20'    },
];

function tagColor(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) & 0xffff;
  }
  return TAG_PALETTE[hash % TAG_PALETTE.length];
}

export function TagList({ tags, activeTags = [], className }: TagListProps) {
  if (tags.length === 0) {
    return <span className="text-xs text-text-secondary italic">—</span>;
  }

  return (
    <div
      className={cn(
        'flex gap-1.5',
        'flex-col items-end',
        'md:flex-row md:flex-wrap md:justify-end',
        className,
      )}
    >
      {tags.map((tag) => {
        const active = activeTags.includes(tag);
        const { bg, text, border } = active
          ? { bg: 'bg-accent-orange/20', text: 'text-accent-orange', border: 'border-accent-orange/30' }
          : tagColor(tag);

        return (
          <span
            key={tag}
            className={cn(
              'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border',
              bg, text, border,
            )}
          >
            {tag}
          </span>
        );
      })}
    </div>
  );
}
