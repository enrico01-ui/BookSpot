import { createVenueSchema, updateVenueSchema, getVenuesSchema, venueIdParamSchema } from "./venue.schema.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { createVenue, getVenues, getVenueById, updateVenue, deleteVenue } from "./venue.controller.js";
import {validate} from "../../middlewares/validate.middleware.js";
import { Router } from "express";


const router = Router();

router.post("/", authenticate, authorize("ADMIN", "OWNER"), validate({body: createVenueSchema}), createVenue);
router.get("/", authenticate, authorize("ADMIN", "OWNER", "USER"), validate({query: getVenuesSchema}), getVenues);
router.get("/:id", authenticate, authorize("ADMIN", "OWNER", "USER"), validate({params: venueIdParamSchema}), getVenueById);
router.put("/:id", authenticate, authorize("ADMIN", "OWNER"), validate({params: venueIdParamSchema}), validate({body: updateVenueSchema}), updateVenue);
router.delete("/:id", authenticate, authorize("ADMIN", "OWNER"), validate({params: venueIdParamSchema}), deleteVenue);