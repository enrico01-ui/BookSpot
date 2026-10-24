import {Response, Request} from "express";
import {createVenueService, getVenuesService, getVenueByIdService, updateVenueService, deleteVenueService} from "./venue.service.js";
import {createVenueSchema, updateVenueSchema, getVenuesSchema, venueIdParamSchema} from "./venue.schema.js";

export const createVenue = async (req: Request, res: Response) => {
    if(!req.user || typeof req.user.sub !== "number") {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const venue = await createVenueService(req.body, req.user.sub);
    res.status(201).json({
        message: "Venue created successfully",
        venue,
    });
}

export const getVenues = async (req: Request, res: Response) => {
    const venues = await getVenuesService(req.query as any);
    res.status(200).json({
        message: "Venues fetched successfully",
        venues,
    });
}

export const getVenueById = async (req: Request, res: Response) => {
    const venue = await getVenueByIdService(req.params as any);
    res.status(200).json({
        message: "Venue fetched successfully",
        venue,
    });
}

export const updateVenue = async (req: Request, res: Response) => {
    const venue = await updateVenueService(req.params as any, req.body);
    res.status(200).json({
        message: "Venue updated successfully",
        venue,
    });
}
    
export const deleteVenue = async (req: Request, res: Response) => {
    await deleteVenueService(req.params as any);
    res.status(200).json({
        message: "Venue deleted successfully",
    });
}