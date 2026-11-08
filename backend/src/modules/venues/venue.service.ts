
import {CreateVenueInput, UpdateVenueInput, GetVenuesInput, VenueIdParam, RejectVenueInput, SuspendVenueInput} from "./venue.schema.js";
import { AppError } from "../../errors/appError.js";
import { prisma } from "../../lib/prisma.js";
import { Prisma } from "../../generated/prisma/browser.js";
import { Prisma as Prism } from "../../generated/prisma/client.js";
import { VenueStatus } from "../../generated/prisma/enums.js";
import z from "zod";

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
        ...(type ? { resources: { some: { type: { contains: type, mode: "insensitive" }, deletedAt: null,} } } : {}),

    }
    const orderBy: Prisma.VenueOrderByWithRelationInput[] = [
        { [sortBy]: sortOrder },
        { id: "desc" },
    ];
    const venueCardSelect = {
      id: true, name: true, city: true, address: true,
      latitude: true, longitude: true, status: true, createdAt: true,
      images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
      facilities: { select: { facility: { select: { id: true, name: true } } } },
      resources: {
        where: { deletedAt: null, status: "ACTIVE" },
        select: { type: true, basePrice: true },
      },
    } satisfies Prisma.VenueSelect;
    const[ venues, total] = await prisma.$transaction([
        prisma.venue.findMany({
            where,
            select: venueCardSelect,
            orderBy: orderBy, 
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.venue.count({ where })
    ])
    const ratings = await prisma.review.groupBy({
      by: ["venueId"],
      where: { venueId: { in: venues.map((v) => v.id) } },
      _avg: { rating: true },
      _count: { _all: true },
    });
    const ratingMap = new Map(ratings.map((r) => [r.venueId, r]));

    const data = venues.map(({ images, facilities, resources, ...v }) => {
      const r = ratingMap.get(v.id);
      return {
        ...v,
        thumbnail: images[0]?.url ?? null,
        facilities: facilities.map((f) => f.facility.name),
        resourceTypes: [...new Set(resources.map((x) => x.type))],
        startingPrice: resources.length ? Math.min(...resources.map((x) => Number(x.basePrice))) : null,
        totalResources: resources.length,
        rating: {
          average: r?._avg.rating ? Number(r._avg.rating.toFixed(1)) : null,
          count: r?._count._all ?? 0,
        },
      };
    });

    return { venues:data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };

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




const validateVenueCompleteness = async (id: number, actor: Actor) => {
  // Check if the venue is complete before allowing it to be published or pending approval also check photo, facilities, and resources, operating hours are not empty
  const venue = await prisma.venue.findFirst({
    where: {
      id,
      ...(
        actor.role === "ADMIN"
          ? {}
          : { ownerId: actor.id }
      ),
      deletedAt: null,
    },
   select: {
      name: true,
      address: true,
      city: true,
      latitude: true,
      longitude: true,
      description: true,

      images: {
        select: {
          id: true,
          url: true,
        },
      },

      facilities: true,

      resources: {
        select: {
          id: true,
          type: true,
          name: true,
          description: true,
          basePrice: true,
        },
        where: {
          deletedAt: null,
          status: "ACTIVE",
        },
      },

      operatingHours: true,
    },
  });


  if (!venue) {
    throw new AppError("Venue not found", 404);
  }
  
  if (
    !venue.name ||
    !venue.address ||
    !venue.city ||
    venue.latitude == null ||
    venue.longitude == null ||
    !venue.description ||
    venue.images.length === 0 ||
    venue.facilities.length === 0 ||
    venue.resources.length === 0 ||
    venue.operatingHours.length === 0
  ) {
    throw new AppError("Venue is not complete", 400);
  }
  const price = venue.resources.reduce(
    (acc, resource) => acc + (resource.basePrice?.toNumber() ?? 0),
    0,
  );
  if (price <= 0) {
    throw new AppError("Venue resources must have a total price greater than 0", 400);
  }


};

const transitionVenueStatus = async (
  id: number,
  actor: Actor,
  fromStatus: VenueStatus[],
  toStatus: VenueStatus,
  extraData: Prisma.VenueUpdateInput = {}
) => {
  try {
    return await prisma.venue.update({
      where: {
        id,
        deletedAt: null,
        ...(actor.role === "ADMIN"
          ? {}
          : { ownerId: actor.id }),
        status: {
          in: fromStatus,
        },
      },
      data: {
        status: toStatus,
        ...extraData,
      },
    });
  } catch (error) {
    if (
      error instanceof Prism.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new AppError(
        "Venue not found or status transition is no longer valid",
        409
      );
    }

    throw error;
  }
};

export const rejectVenueService = ({ id }: VenueIdParam, { reason }: RejectVenueInput, actor: Actor) => 
   transitionVenueStatus(
    id,
    actor,
    ["PENDING_APPROVAL"],
    "REJECTED",
    { rejectionReason: reason }
  );


export const suspendVenueService = ({ id }: VenueIdParam, { reason }: SuspendVenueInput, actor: Actor) => 
  transitionVenueStatus(
    id,
    actor,
    ["PUBLISHED"],
    "SUSPENDED",
    { suspensionReason: reason }
  );


export const publishVenueService = ({ id }: VenueIdParam, actor: Actor) => 
  transitionVenueStatus(
    id,
    actor,
    ["PENDING_APPROVAL"],
    "PUBLISHED",
    {
      rejectionReason: null,
      suspensionReason: null,
    }
  );
  


export const pendingApprovalVenueService = async ({ id }: VenueIdParam, actor: Actor) => {
  await validateVenueCompleteness(id, actor);

  return transitionVenueStatus(
    id,
    actor,
    ["DRAFT"],
    "PENDING_APPROVAL"
  );
}

export const draftVenueService = ({ id }: VenueIdParam, actor: Actor) => 
   transitionVenueStatus(
    id,
    actor,
    ["PENDING_APPROVAL", "REJECTED"],
    "DRAFT",
    { rejectionReason: null }
  );

export const reactivateVenueService = ({ id }: VenueIdParam, actor: Actor) => 
  transitionVenueStatus(
    id,
    actor,
    ["SUSPENDED"],
    "PUBLISHED",
    { suspensionReason: null }
  );
