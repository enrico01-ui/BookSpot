export type VenueStatus = "DRAFT" | "PUBLISHED" | "REJECTED" | "SUSPENDED" | "PENDING_APPROVAL";



export interface Venue {
    id: number;
    name: string;
    address: string;
    city: string;
    latitude?: number | null;
    longitude?: number | null;
    description?: string | null;
    status: VenueStatus;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
    rejectionReason?: string | null;
    suspensionReason?: string | null;
    thumbnail?: string | null;
    facilities?: string[];
    resourcesTypes?: string[];
    totalResources?: number;
    startingPrice?: number | null;
    rating?: {
      average: number | null;
      count: number;
    } | null;

}

export interface VenueListResponse {
  venues: Venue[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetVenuesQueryParams {
  ownerId?: number;
  name?: string;
  type?: string;
  sortBy?: "createdAt" | "name" | "updatedAt";
  sortOrder?: "asc" | "desc"; 
  status?: VenueStatus;
  city?: string;
  page?: number;
  limit?: number;  
}

export interface CreateVenuePayload {
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  description: string;
}

export interface UpdateVenuePayload {
  name?: string;
  address?: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
}