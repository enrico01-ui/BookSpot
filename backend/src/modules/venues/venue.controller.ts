import type { Request, Response } from "express";
import { AppError } from "../../errors/appError.js";
import type { CreateVenueInput, GetVenuesInput, UpdateVenueInput, VenueIdParam, RejectVenueInput, SuspendVenueInput } from "./venue.schema.js";
import {
  createVenueService,
  deleteVenueService,
  getVenueByIdService,
  getVenuesService,
  updateVenueService,
  rejectVenueService,
  suspendVenueService,
  publishVenueService,
  pendingApprovalVenueService,
  draftVenueService,
  type Actor,
  reactivateVenueService,
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
  const result = await getVenuesService(
    req.query,
    toActor(req.user),
  );

  res.json(result);
};

export const getVenueById = async (req: Request<VenueIdParam>, res: Response) => {
   const venue = await getVenueByIdService(
    req.params,
    toActor(req.user),
  );

  res.json({ venue });
};

export const updateVenue = async (req: Request<VenueIdParam, unknown, UpdateVenueInput>, res: Response) => {
  const venue = await updateVenueService(
    req.params,
    req.body,
    requireActor(req.user),
  );

  res.json({ venue });
};

export const deleteVenue = async (req: Request<VenueIdParam>, res: Response) => {
  await deleteVenueService(req.params, requireActor(req.user));
  res.status(204).send();
};

export const rejectVenue = async (req: Request<VenueIdParam, unknown, RejectVenueInput>, res: Response) => {
  await rejectVenueService(req.params, req.body, requireActor(req.user));
  res.status(204).send();
}

export const suspendVenue = async (req: Request<VenueIdParam, unknown, SuspendVenueInput>, res: Response) => {
  await suspendVenueService(req.params, req.body, requireActor(req.user));
  res.status(204).send();
}

export const publishVenue = async (req: Request<VenueIdParam>, res: Response) => {
  await publishVenueService(req.params, requireActor(req.user));
  res.status(204).send();
}

export const pendingApprovalVenue = async (req: Request<VenueIdParam>, res: Response) => {
  const venue = await pendingApprovalVenueService(
    req.params,
    requireActor(req.user),
  );

  res.json({ venue });
};

export const draftVenue = async (req: Request<VenueIdParam>, res: Response) => {
  const venue = await draftVenueService(
    req.params,
    requireActor(req.user),
  );

  res.json({ venue });
};

export const reactivateVenue = async (
  req: Request<VenueIdParam>,
  res: Response,
) => {
  const venue = await reactivateVenueService(
    req.params,
    requireActor(req.user),
  );

  res.json({ venue });
};