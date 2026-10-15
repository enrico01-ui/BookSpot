import { Skeleton } from "#components/ui/skeleton";


export default function LoadingPage(){
    return(
        <div className="space-y-4 p-6" role="status" aria-label="Memuat halaman" >
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72 max-w-full" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-40 w-full rounded-lg" />
                ))}
            </div>
        </div>
    );
}