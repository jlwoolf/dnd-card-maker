import { Component } from "react";
import { Box, Button, Typography } from "@mui/material";
import type { ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  /** Content rendered when no error has occurred. */
  children: ReactNode;
  /** Optional custom fallback. Defaults to a simple error message with a retry button. */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/** React error boundary that catches render errors in its subtree.

  Previously any render error would crash the entire application. This
  component catches those errors and displays a user-friendly fallback
  instead of a blank white screen.
*/
export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, info);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
          p={3}
          textAlign="center"
        >
          <Typography variant="h5" gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            An unexpected error occurred. Please try refreshing the page.
          </Typography>
          <Button variant="contained" onClick={this.handleReset}>
            Try Again
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}
