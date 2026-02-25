import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class EventErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Event listener crashed:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || <p>Live updates temporarily unavailable</p>;
    }
    return this.props.children;
  }
}
