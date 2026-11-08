import { getVenueById, getVenues } from "../../api/venue.api";
import { type GetVenuesQueryParams, type Venue, type VenueListResponse } from "../../types/venue";
import {
  useQuery,
  keepPreviousData,
} from "@tanstack/react-query";
import { venueKeys } from "./venue.keys";

export const useVenues = (params?: GetVenuesQueryParams) => {
  return useQuery<VenueListResponse>({
    queryKey: venueKeys.list(params ?? {}),
    queryFn: () => getVenues(params),
    staleTime: 5 * 60 * 1000,

    placeholderData: keepPreviousData,
  });
}

export const useVenue = (id: number) => {
  return useQuery<Venue>({
    queryKey: venueKeys.detail(id),
    queryFn: () => getVenueById(id),
    enabled: Boolean(id), 
  });
}