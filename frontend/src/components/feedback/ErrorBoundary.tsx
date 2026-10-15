import { Button } from "@/components/ui/button";
import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
}

type State = {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = {
        hasError: false
    };

    static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-6 text-center">
                <h1 className="text-xl font-semibold">Halaman mengalami masalah</h1>
                <p className="text-sm text-muted-foreground">
                    Coba muat ulang tampilan ini.
                </p>
                <Button onClick={() => window.location.reload()} variant="outline">
                    Muat Ulang
                </Button>
                </div>
            );
        }
    }
}

