import type { Venue, CreateVenuePayload, UpdateVenuePayload } from '../../types/venue';
import { createVenue, updateVenue, deleteVenue } from '../../api/venue.api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { venueKeys } from './venue.keys';

export const useCreateVenue = () => {
  const queryClient = useQueryClient();
  return useMutation<Venue, unknown, CreateVenuePayload>({
    mutationFn: (venueData) => createVenue(venueData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: venueKeys.lists() });
    },
  });
};

export const useUpdateVenue = () => {
  const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({id, venueData} : { id: number; venueData: UpdateVenuePayload }) => updateVenue(id, venueData),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: venueKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: venueKeys.lists() });
        },
    });
}

export const useDeleteVenue = () => {
  const queryClient = useQueryClient();
    return useMutation({    
        mutationFn: (id: number) => deleteVenue(id),
        onSuccess: () => {

            queryClient.invalidateQueries({ queryKey: venueKeys.lists() });
        },
    });
}