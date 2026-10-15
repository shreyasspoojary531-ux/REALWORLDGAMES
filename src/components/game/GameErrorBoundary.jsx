import { Component } from 'react';
import { Button } from '@/components/ui/Button';

export class GameErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Game error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-surface-container rounded-DEFAULT border border-error/30 max-w-lg mx-auto my-12">
          <div className="w-14 h-14 rounded-full bg-error-container/20 border border-error/30 flex items-center justify-center text-error mb-4">
            <span className="material-symbols-outlined text-[28px]">warning</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-2">
            {this.props.fallbackTitle || 'Game Interrupted'}
          </h3>
          <p className="text-body-sm text-on-surface-variant max-w-md mb-6">
            An unexpected error occurred during gameplay. You can safely restart the match.
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              icon={<span className="material-symbols-outlined text-[20px]">refresh</span>}
              onClick={this.handleReset}
            >
              Restart Game
            </Button>
            <Button
              variant="surface"
              size="md"
              icon={<span className="material-symbols-outlined text-[20px]">arrow_back</span>}
              onClick={() => window.location.assign('/')}
            >
              Return to Hub
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
