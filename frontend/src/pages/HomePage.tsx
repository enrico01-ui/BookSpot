import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useVenues } from "../features/venues/venue.queries";
import type { GetVenuesQueryParams } from "../types/venue";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import VenueCard from "../components/venue/venueCard";
import VenueCardSkeleton from "../components/venue/venueCardSkeleton";

const categories = [
  { value: "", label: "Semua" },
  { value: "FUTSAL", label: "Futsal" },
  { value: "BADMINTON", label: "Badminton" },
  { value: "BASKET", label: "Basket" },
  { value: "TENNIS", label: "Tenis" },
  { value: "PADEL", label: "Padel" },
];
export default function HomePage() {
    
    const [searchParams, setSearchParams] = useSearchParams();

    const getPositiveNumber = (value: string | null, fallback: number) => {
    const parsed = Number(value);

    return Number.isInteger(parsed) && parsed > 0
        ? parsed
        : fallback;
    };

    const sortByValue = searchParams.get("sortBy");
    const sortOrderValue = searchParams.get("sortOrder");

    const validSortBy = ["createdAt", "name", "updatedAt"] as const;
    const validSortOrder = ["asc", "desc"] as const;

    const searchQuery: GetVenuesQueryParams = {
        name: searchParams.get("name") || undefined,
        city: searchParams.get("city") || undefined,
        type: searchParams.get("type") || undefined,
        sortBy: validSortBy.includes(sortByValue as (typeof validSortBy)[number])
            ? (sortByValue as GetVenuesQueryParams["sortBy"])
            : "createdAt",
        sortOrder: validSortOrder.includes(
            sortOrderValue as (typeof validSortOrder)[number]
        )
            ? (sortOrderValue as GetVenuesQueryParams["sortOrder"])
            : "desc",
        page: getPositiveNumber(searchParams.get("page"), 1),
        limit: getPositiveNumber(searchParams.get("limit"), 10),
    };

    const [filterDraft, setFilterDraft] = useState<
        Pick<GetVenuesQueryParams, "name" | "city">
        >({
        name: searchQuery.name ?? "",
        city: searchQuery.city ?? "",
    });

    const { 
        data: venues,
        isLoading,
        isFetching,
        isPlaceholderData,
        error,
    } = useVenues(searchQuery);

    // Sinkronkan input ketika URL berubah,
    // termasuk ketika pengguna menekan Back/Forward.
    useEffect(() => {
        setFilterDraft({
            name: searchQuery.name ?? "",
            city: searchQuery.city ?? "",
        });
    }, [searchParams]);

    const updateUrlParams = (
        updates: Record<string, string | number | undefined>
        ) => {
        setSearchParams((current) => {
            const next = new URLSearchParams(current);

            Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === "") {
                next.delete(key);
            } else {
                next.set(key, String(value));
            }
            });

            return next;
        });
    };

    const updateFilterDraft = (
        key: "name" | "city",
        value: string
        ) => {
        setFilterDraft((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const handleSearchSubmit = () => {
        updateUrlParams({
            name: filterDraft.name?.trim() || undefined,
            city: filterDraft.city?.trim() || undefined,
            page: 1,
        });
    };

    const selectedCategory = searchQuery.type ?? "";

    const handleCategoryChange = (category: string) => {
        updateUrlParams({
            type: category || undefined,
            page: 1,
        });
    };

    const handleSortChange = (value: string) => {
        const [sortBy, sortOrder] = value.split("-");

        updateUrlParams({
            sortBy,
            sortOrder,
            page: 1,
        });
    };

    const handlePageChange = (page: number) => {
        updateUrlParams({ page });

        window.scrollTo({
            top: 450,
            behavior: "smooth",
        });
    };

    const handleReset = () => {
        setFilterDraft({
            name: "",
            city: "",
        });

        setSearchParams({});
    };

    const currentPage = venues?.meta.page ?? searchQuery.page ?? 1;
    const totalPages = venues?.meta.totalPages ?? 1;

    return (
        <div className="min-h-screen bg-canvas pb-12">
            <header className="bg-ink px-4 pb-24 pt-8 text-white sm:px-8 sm:pb-28 lg:px-12">
                <div className="mx-auto w-full max-w-7xl">
                    <div className="max-w-2xl">
                        <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
                            Booking lapangan,{" "}
                            <span className="text-accent">tanpa ribet.</span>
                        </h1>
                        <p className="mt-4 max-w-lg text-sm leading-relaxed text-on-dark sm:text-base">
                            Cek slot kosong, bayar, lalu main. Tanpa telepon,
                            tanpa tanya-tanya.
                        </p>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
                <div className="relative -mt-12 px-10">
                    <Card className="rounded-2xl border border-line bg-surface p-4 shadow-xl sm:p-6">
                        <form
                            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:items-end"
                            onSubmit={(event) => {
                                event.preventDefault();
                                handleSearchSubmit();
                            }}
                        >
                            <label className="text-xs font-medium text-muted">
                                Nama venue
                                <Input
                                    className="mt-2 h-11 w-full rounded-xl border-line px-3"
                                    placeholder="Cari venue"
                                    value={filterDraft.name ?? ""}
                                    onChange={(event) =>
                                        updateFilterDraft("name", event.target.value)
                                    }
                                />
                            </label>
                            <label className="text-xs font-medium text-muted">
                                Kota
                                <Input
                                    className="mt-2 h-11 w-full rounded-xl border-line px-3"
                                    placeholder="Semua kota"
                                    value={filterDraft.city ?? ""}
                                    onChange={(event) =>
                                        updateFilterDraft("city", event.target.value)
                                    }
                                />
                            </label>

                            <label className="text-xs font-medium text-muted flex flex-col gap-1">
                                Sort By
                                <select
                                    value={`${searchQuery.sortBy}-${searchQuery.sortOrder}`}
                                    onChange={(event) => handleSortChange(event.target.value)}
                                    className="h-11 rounded-xl border border-line bg-surface px-3 text-sm"
                                    >
                                    <option value="createdAt-desc">Terbaru</option>
                                    <option value="createdAt-asc">Terlama</option>
                                    <option value="name-asc">Nama A–Z</option>
                                    <option value="name-desc">Nama Z–A</option>
                                </select>
                            </label>
                            <div className="sm:col-span-2 lg:col-span-1">
                                <Button
                                type="submit"
                                className="h-11 w-1/2 rounded-xl bg-primary px-5 text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                >
                                    Cari venue
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>

                <section className="mt-8 grid gap-5 border-b border-line pb-8 md:grid-cols-3">
                    {[
                        ["1", "Pilih slot", "Lihat jadwal kosong tiap lapangan."],
                        ["2", "Bayar", "Slot ditahan 15 menit untukmu."],
                        ["3", "Main", "Datang dan tunjukkan kode booking."],
                    ].map(([number, title, description]) => (
                        <div className="flex items-start gap-3" key={number}>
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-ink">
                                {number}
                            </span>
                            <div>
                                <h2 className="text-sm font-bold text-ink">{title}</h2>
                                <p className="mt-1 text-xs leading-relaxed text-muted">
                                    {description}
                                </p>
                            </div>
                        </div>
                    ))}
                </section>

                <section className="pt-8">
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-primary">
                                Temukan tempat bermain
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">

                                {categories.map((category) => {
                                const active = selectedCategory === category.value;

                                return (
                                    <button
                                    key={category.value}
                                    type="button"
                                    onClick={() => handleCategoryChange(category.value)}
                                    className={`rounded-full border px-4 py-2 text-xs font-semibold transition sm:px-5 ${
                                        active
                                        ? "border-ink bg-ink text-white"
                                        : "border-line bg-surface text-ink hover:border-primary hover:text-primary"
                                    }`}
                                    >
                                    {category.label}
                                    </button>
                                );
                                })}

                            </div>
                        </div>
                        {venues?.meta.total ? (
                            <span className="text-xs text-muted sm:pb-1">
                                {venues.meta.total} venue
                            </span>
                        ) : null}
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {[...Array(6)].map((_, index) => (
                                <VenueCardSkeleton key={index} />
                            ))}
                        </div>
                    ) : error ? (
                        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                            Terjadi kesalahan saat memuat data venue.
                        </p>
                    ) : venues?.venues.length ? (
                         <>
                         {isFetching && !isLoading && (
                        <p className="mb-3 text-xs text-muted">
                            Memperbarui daftar venue...
                        </p>
                        )}
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {venues.venues.map((venue, index) => (
                                <VenueCard key={venue.id} venue={venue} index={index} />
                            ))}
                        </div>
                        {totalPages > 1 && (
                            <div className="mt-8 flex max-w-full flex-wrap items-center justify-center gap-2 px-1">

                            <button
                                type="button"
                                disabled={currentPage <= 1 || isFetching}
                                onClick={() => handlePageChange(currentPage - 1)}
                                className="flex size-10 items-center justify-center rounded-xl border border-line bg-surface disabled:opacity-40"
                            >
                                ‹
                            </button>

                            {Array.from(
                                { length: totalPages },
                                (_, index) => index + 1,
                            ).map((page) => (
                                <button
                                key={page}
                                type="button"
                                disabled={isFetching}
                                onClick={() => handlePageChange(page)}
                                className={`flex size-10 items-center justify-center rounded-xl border text-sm font-semibold transition ${
                                    currentPage === page
                                    ? "border-ink bg-ink text-white"
                                    : "border-line bg-surface text-ink hover:border-primary"
                                }`}
                                >
                                {page}
                                </button>
                            ))}

                            <button
                                type="button"
                                disabled={currentPage >= totalPages || isFetching}
                                onClick={() => handlePageChange(currentPage + 1)}
                                className="flex size-10 items-center justify-center rounded-xl border border-line bg-surface disabled:opacity-40"
                            >
                                ›
                            </button>

                            </div>
                        )}
                        </>
                    ) : (
                         <div className="rounded-2xl border border-line bg-surface p-10 text-center">
                        <h3 className="font-bold text-ink">
                            Venue tidak ditemukan
                        </h3>

                        <p className="mt-2 text-sm text-muted">
                            Coba gunakan kata kunci atau kategori olahraga lain.
                        </p>

                        <button
                            type="button"
                            onClick={handleReset}
                            className="mt-4 text-sm font-semibold text-primary hover:underline"
                        >
                            Reset pencarian
                        </button>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
