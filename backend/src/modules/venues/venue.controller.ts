import type { Request, Response } from "express";
import { AppError } from "../../errors/appError.js";
import type { CreateVenueInput, GetVenuesInput, UpdateVenueInput, VenueIdParam } from "./venue.schema.js";
import {
  createVenueService,
  deleteVenueService,
  getVenueByIdService,
  getVenuesService,
  updateVenueService,
  type Actor,
} from "./venue.service.js";

const toActor = (user: Request["user"]): Actor | undefined =>
  user && typeof user.sub === "number" ? { id: user.sub, role: user.role } : undefined;

const requireActor = (user: Request["user"]): Actor => {
  const actor = toActor(user);
  if (!actor) throw new AppError("Unauthorized", 401);
  return actor;
};

export const createVenue = async (req: Request<unknown, unknown, CreateVenueInput>, res: Response) => {
  const venue = await createVenueService(req.body, requireActor(req.user));
  res.status(201).json({ venue });
};

export const getVenues = async (req: Request<unknown, unknown, unknown, GetVenuesInput>, res: Response) => {
  res.json(await getVenuesService(req.query, toActor(req.user))); // { items, meta }
};

export const getVenueById = async (req: Request<VenueIdParam>, res: Response) => {
  res.json({ venue: await getVenueByIdService(req.params, toActor(req.user)) });
};

export const updateVenue = async (req: Request<VenueIdParam, unknown, UpdateVenueInput>, res: Response) => {
  res.json({ venue: await updateVenueService(req.params, req.body, requireActor(req.user)) });
};

export const deleteVenue = async (req: Request<VenueIdParam>, res: Response) => {
  await deleteVenueService(req.params, requireActor(req.user));
  res.status(204).send();
};