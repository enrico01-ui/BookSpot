import api from "../lib/api";
import type { GetVenuesQueryParams, Venue, VenueListResponse, CreateVenuePayload, UpdateVenuePayload } from "../types/venue";


export const getVenues = async (params?: GetVenuesQueryParams): Promise<VenueListResponse> => {
  const response = await api.get<VenueListResponse>("/venues", { params });
  return response.data;
}

export const getVenueById = async (id: number): Promise<Venue> => {
  const response = await api.get<Venue>(`/venues/${id}`);
  return response.data;
}

export const createVenue = async (venueData: CreateVenuePayload): Promise<Venue> => {
  const response = await api.post<Venue>("/venues", venueData);
  return response.data;
} 

export const updateVenue = async (id: number, venueData: UpdateVenuePayload): Promise<Venue> => {
  const response = await api.put<Venue>(`/venues/${id}`, venueData);
  return response.data;
}

export const deleteVenue = async (id: number): Promise<void> => {
  await api.delete(`/venues/${id}`);
}


