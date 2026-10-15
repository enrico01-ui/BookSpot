import { Button } from "#components/ui/button";

type ErrorStateProps = {
title?: string;
message?: string;
onRetry?: () => void;
};

export function ErrorState({
    title = "Terjadi kesalahan",
    message = "Kami tidak dapat memuat data. Silakan coba lagi.",
    onRetry,
    }: ErrorStateProps) {
    return ( <div
    className="flex flex-col items-center justify-center gap-3 p-8 text-center"
    role="alert"
    > <h2 className="text-lg font-semibold">{title}</h2>


    <p className="max-w-md text-sm text-muted-foreground">
        {message}
    </p>

    {onRetry && (
        <Button onClick={onRetry} variant="outline">
        Coba Lagi
        </Button>
    )}
    </div>

);
}
