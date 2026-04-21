'use client';

import React, { startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RetryUIProps {
  minHeight: string;
  onReset: () => void;
}

function RetryUI({ minHeight, onReset }: RetryUIProps) {
  const router = useRouter();

  const handleRetry = () => {
    onReset();
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div
      className={`rounded-[24px] bg-muted border border-border shadow-sm p-8 flex flex-col items-center justify-center gap-3 ${minHeight}`}
    >
      <AlertCircle className="h-5 w-5 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Something went wrong</p>
      <Button
        variant="link"
        size="sm"
        onClick={handleRetry}
        className="h-auto p-0 text-xs font-semibold"
      >
        Retry
      </Button>
    </div>
  );
}

interface SectionErrorBoundaryProps {
  children: React.ReactNode;
  minHeight?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class SectionErrorBoundary extends React.Component<
  SectionErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <RetryUI
          minHeight={this.props.minHeight ?? 'min-h-[200px]'}
          onReset={() => this.setState({ hasError: false })}
        />
      );
    }
    return this.props.children;
  }
}
