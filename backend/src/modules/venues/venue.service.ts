
import {CreateVenueInput, UpdateVenueInput, GetVenuesInput, VenueIdParam} from "./venue.schema.js";
import { AppError } from "../../errors/appError.js";
import { prisma } from "../../lib/prisma.js";
import { Prisma } from "../../generated/prisma/browser.js";

export interface Actor {
    id: number;
    role: "OWNER" | "ADMIN" | "CUSTOMER";
}

const manageableVenue = (id: number, actor: Actor): Prisma.VenueWhereUniqueInput =>
  actor.role === "ADMIN"
    ? { id, deletedAt: null }
    : { id, ownerId: actor.id, deletedAt: null };

const visibleTo = (actor?: Actor): Prisma.VenueWhereInput => {
  if (actor?.role === "ADMIN") return {};
  if (actor) return { OR: [{ status: "PUBLISHED" }, { ownerId: actor.id }] };
  return { status: "PUBLISHED" };
};

export const createVenueService = async (data: CreateVenueInput, actor: Actor) => {
    const venue = await prisma.venue.create({
        data: {
            ownerId: actor.id,
            name: data.name,
            address: data.address,
            city: data.city,
            latitude: data.latitude ?? null,
            longitude: data.longitude ?? null,
            description: data.description ?? null,
        },
    });
    return venue;
}

export const getVenuesService = async (query: GetVenuesInput, actor?: Actor) => {
    const { ownerId, status, city, page, limit, name, type, sortBy, sortOrder } = query;
    if (page < 1 || limit < 1) {
        throw new AppError("Page and limit must be positive integers", 400);
    }
    
    const where: Prisma.VenueWhereInput = {
        deletedAt: null,
        AND: [visibleTo(actor)],
        ...(ownerId ? { ownerId } : {}),
        ...(status ? { status } : {}),
        ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
        ...(name ? { name: { contains: name, mode: "insensitive" } } : {}),
        ...(type ? { resources: { some: { type: { contains: type, mode: "insensitive" } } } } : {}),

    }
    const orderBy: Prisma.VenueOrderByWithRelationInput[] = [
        { [sortBy]: sortOrder },
        { id: "desc" },
    ];
    const[ venues, total] = await prisma.$transaction([
        prisma.venue.findMany({
            where,
            orderBy: orderBy, 
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.venue.count({ where })
    ])
    return { venues, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };

}

export const getVenueByIdService = async ({ id }: VenueIdParam, actor?: Actor) => {
  const venue = await prisma.venue.findFirst({
    where: { id, deletedAt: null, AND: [visibleTo(actor)] },
  });
  if (!venue) throw new AppError("Venue not found", 404);
  return venue;
};

// Satu query: kepemilikan ada di klausa where. Bukan pemilik / tidak ada / sudah dihapus
// → Prisma P2025 → error handler global memetakannya ke 404.
export const updateVenueService = ({ id }: VenueIdParam, data: UpdateVenueInput, actor: Actor) =>
  prisma.venue.update({ where: manageableVenue(id, actor), data: {
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.address !== undefined ? { address: data.address } : {}),
    ...(data.city !== undefined ? { city: data.city } : {}),
    ...(data.latitude !== undefined ? { latitude: data.latitude } : {}),
    ...(data.longitude !== undefined ? { longitude: data.longitude } : {}),
    ...(data.description !== undefined ? { description: data.description } : {}),
  }  });

export const deleteVenueService = async ({ id }: VenueIdParam, actor: Actor) => {
  // TODO (Sprint 3): tolak bila masih ada booking mendatang
  await prisma.venue.update({
    where: manageableVenue(id, actor),
    data: { deletedAt: new Date() },
    select: { id: true },
  });
};