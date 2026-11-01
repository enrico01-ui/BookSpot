import { createVenueSchema, updateVenueSchema, getVenuesSchema, venueIdParamSchema, rejectVenueSchema, suspendVenueSchema } from "./venue.schema.js";
import { authenticate, authorize, optionalAuthenticate } from "../../middlewares/auth.middleware.js";
import { createVenue, getVenues, getVenueById, updateVenue, deleteVenue, rejectVenue, suspendVenue, publishVenue, pendingApprovalVenue, draftVenue, reactivateVenue} from "./venue.controller.js";
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

router.post("/:id/reject", authenticate, authorize("ADMIN"), validate({ params: venueIdParamSchema, body: rejectVenueSchema }), rejectVenue);
router.post("/:id/suspend", authenticate, authorize("ADMIN"), validate({ params: venueIdParamSchema, body: suspendVenueSchema }), suspendVenue);
router.post("/:id/publish", authenticate, authorize("ADMIN"), validate({ params: venueIdParamSchema }), publishVenue);
router.post("/:id/pending-approval", authenticate, authorize("OWNER"), validate({ params: venueIdParamSchema }), pendingApprovalVenue);
router.post("/:id/draft", authenticate, authorize("OWNER"), validate({ params: venueIdParamSchema }), draftVenue);
router.post("/:id/reactivate", authenticate, authorize("OWNER"), validate({ params: venueIdParamSchema }), reactivateVenue);
export default router;