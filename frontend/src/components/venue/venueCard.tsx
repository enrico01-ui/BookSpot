import { Link } from "react-router-dom";
import type { Venue } from "../../types/venue";

const venueColors = [
    { background: "#0e806d", line: "#8fd5c7" },
    { background: "#2450d6", line: "#9db4ff" },
    { background: "#cc3e08", line: "#ff9f7d" },
    { background: "#7026dd", line: "#c5a2ff" },
    { background: "#4b7f0a", line: "#b8d77f" },
];


const formatPrice = (price: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);


export default function VenueCard({ venue, index }: { venue: Venue; index: number }) {
    const color = venueColors[index % venueColors.length];

    return (
        <Link
            to={`/venues/${venue.id}`}
            className="group block overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
            <div
                className="relative h-36 overflow-hidden px-3 pt-3 sm:h-40"
                style={{ backgroundColor: color.background }}
                aria-hidden="true"
            >
                <span className="relative z-10 inline-flex rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-ink">
                    Venue
                </span>
                {
                    venue.thumbnail != null && !venue.thumbnail!.includes("placehold") ? (
                        <img
                            src={venue.thumbnail!}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                    ) : (
                        <div
                            className="absolute inset-x-3 bottom-2 h-[calc(100%-2.75rem)] rounded-md border"
                            style={{ borderColor: color.line }}
                        >
                            <span
                                className="absolute inset-y-0 left-1/2 border-l"
                                style={{ borderColor: color.line }}
                            />
                            <span
                                className="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full border"
                                style={{ borderColor: color.line }}
                            />
                        </div>
                    )
                }
            </div>
           <div className="min-w-0 space-y-3 p-4">
                <div>
                <h3 className="truncate text-base font-bold text-ink">
                    {venue.name}
                </h3>

                <p className="mt-1 truncate text-xs text-muted">
                    {venue.city}
                </p>
                </div>

                {/* Resource count and rating */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
                <span className="rounded-md bg-canvas px-2 py-1">
                    ▦ {venue.totalResources} lapangan
                </span>

                {venue.rating? (
                    <span className="rounded-md bg-canvas px-2 py-1">
                    ⭐ {venue.rating.average} ({venue.rating.count} ulasan)
                    </span>
                ) : (
                    <span className="text-muted">
                    Belum ada ulasan
                    </span>
                )}
                </div>

                {/* Facilities */}
                {venue.facilities && venue.facilities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {venue.facilities.map((facility) => (
                    <span
                        key={facility}
                        className="rounded-md bg-canvas px-2 py-1 text-[10px] text-ink"
                    >
                        {facility}
                    </span>
                    ))}
                </div>
                )}

                {/* Price */}
                <div className="flex items-end justify-between gap-2 border-t border-line pt-3">
                <div>
                    <p className="text-[11px] text-muted">
                    Mulai dari
                    </p>

                    <p className="mt-1 break-words text-base font-bold text-ink sm:text-lg">
                    {venue.startingPrice !== null
                        ? formatPrice(venue.startingPrice!)
                        : "Belum tersedia"}
                    {venue.startingPrice !== null && (
                        <span className="text-xs font-normal text-muted">
                        /jam
                        </span>
                    )}
                    </p>
                </div>

                <span className="shrink-0 whitespace-nowrap text-xs font-bold text-primary transition group-hover:translate-x-1">
                    Lihat detail →
                </span>
                </div>
            </div>
        </Link>
    );
}