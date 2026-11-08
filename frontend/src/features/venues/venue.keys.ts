import { type GetVenuesQueryParams } from "../../types/venue";

export const venueKeys = {
    all: ["venues"] as const,
    lists: () => [...venueKeys.all, "list"] as const,
    list: (filters: GetVenuesQueryParams) => [...venueKeys.lists(), filters] as const,
    details: () => [...venueKeys.all, "detail"] as const,
    detail: (id: number) => [...venueKeys.details(), id] as const,
}