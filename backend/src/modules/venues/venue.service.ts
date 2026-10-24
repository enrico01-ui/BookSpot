
import {CreateVenueInput, UpdateVenueInput, GetVenuesInput, VenueIdParam} from "./venue.schema.js";
import { AppError } from "../../errors/appError.js";
import { prisma } from "../../lib/prisma.js";

export const createVenueService = async (data: CreateVenueInput, userId: number) => {
    try{
        const venue = await prisma.venue.create({
        data: {
            ownerId: userId,
            name: data.name,
            address: data.address,
            city: data.city,
            latitude: data.latitude ?? null,
            longitude: data.longitude ?? null,
            description: data.description ?? null,
        },
    });
    return venue;
    } catch (error) {
        throw new AppError("Error creating venue", 500);
    }
}

export const getVenuesService = async (query: GetVenuesInput) => {
    try{
        const { ownerId, status, city, page, limit } = query;
        const where: any = {};
        if (ownerId) where.ownerId = ownerId;
        if (status) where.status = status;
        if (city) where.city = city;
        const venues = await prisma.venue.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
        });
        return venues;
    } catch (error) {
        throw new AppError("Error fetching venues", 500);
    }
}

export const getVenueByIdService = async (id: VenueIdParam) => {
    try{
        const venue = await prisma.venue.findUnique({
            where: { id: id.id },
        });
        if (!venue) {
            throw new AppError("Venue not found", 404);
        }
        return venue;
    } catch (error) {
        throw new AppError("Error fetching venue by ID", 500);
    }
}

export const updateVenueService = async (id: VenueIdParam, data: UpdateVenueInput) => {
    try {
        // 1. Validasi keberadaan ID sebelum melakukan update
       if (!id?.id) {
        throw new AppError('Venue ID is required', 400);
        }

        // 1. Cek keberadaan record sebelum update (menangani P2025 secara langsung)
        const existingVenue = await prisma.venue.findUnique({
        where: { id: id.id },
        });

        if (!existingVenue || existingVenue.deletedAt !== null) {
        throw new AppError('Venue not found', 404);
        }

        // 2. Jalankan update
        const venue = await prisma.venue.update({
        where: { id: id.id },
        data: {
            name: data.name ?? existingVenue.name,
            address: data.address ?? existingVenue.address,
            city: data.city ?? existingVenue.city,
            latitude: data.latitude ?? existingVenue.latitude,
            longitude: data.longitude ?? existingVenue.longitude,
            description: data.description ?? existingVenue.description,
        }
        });

        return venue;
    } catch (error) {

        
        // 3. Menangani custom AppError yang dilempar dari blok try
        if (error instanceof AppError) {
        throw error;
        }

        // 4. Meneruskan pesan error asli (opsional) untuk mempermudah debugging internal
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new AppError(`Error updating venue: ${errorMessage}`, 500);
    }
}

export const deleteVenueService = async (id: VenueIdParam) => {
    try{
        await prisma.venue.delete({
            where: { id: id.id },
        })
        return { message: "Venue deleted successfully" };
    }catch (error) {    
        throw new AppError("Error deleting venue", 500);
    }
}