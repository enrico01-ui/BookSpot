import { createVenueSchema, updateVenueSchema, getVenuesSchema, venueIdParamSchema } from "./venue.schema.js";
import { authenticate, authorize, optionalAuthenticate } from "../../middlewares/auth.middleware.js";
import { createVenue, getVenues, getVenueById, updateVenue, deleteVenue } from "./venue.controller.js";
import {validate} from "../../middlewares/validate.middleware.js";
import { Router } from "express";


const router = Router();

router.get("/", optionalAuthenticate, validate({ query: getVenuesSchema }), getVenues);
router.get("/:id", optionalAuthenticate, validate({ params: venueIdParamSchema }), getVenueById);
router.post("/", authenticate, authorize("OWNER", "ADMIN"), validate({ body: createVenueSchema }), createVenue);
router.patch(
  "/:id",
  authenticate,
  authorize("OWNER", "ADMIN"),
  validate({ params: venueIdParamSchema, body: updateVenueSchema }),
  updateVenue,
);
router.delete("/:id", authenticate, authorize("OWNER", "ADMIN"), validate({ params: venueIdParamSchema }), deleteVenue);

export default router;