import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import Card from '@/components/ui/Card';

interface AgentErrorProps {
  message: string;
  onRetry?: () => void;
}

export function AgentError({ message, onRetry }: AgentErrorProps) {
  const isNotConfigured = message.includes('not configured');

  return (
    <Card className="mt-4">
      <div className="flex items-start gap-3 py-2">
        <FontAwesomeIcon
          icon={faTriangleExclamation}
          className="w-4 h-4 text-error mt-0.5 flex-shrink-0"
        />
        <div>
          <p className="text-error text-sm font-medium">
            {isNotConfigured ? 'Agent not configured' : 'Request failed'}
          </p>
          <p className="text-text-muted text-xs mt-1">
            {isNotConfigured
              ? 'Set NEXT_PUBLIC_DERIBIT_AGENT_URL and NEXT_PUBLIC_DERIBIT_AGENT_API_KEY in your .env file.'
              : message}
          </p>
          {onRetry && !isNotConfigured && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 text-xs text-brand hover:underline"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
