import { Router } from "express";
import {
  acceptInvitation,
  listenInvitations,
  rejectInvitation,
} from "../controllers/invitations";

const router = Router();

router.get("/realtime", listenInvitations);
router.post("/:invitationId/accept", acceptInvitation);
router.delete("/:invitationId", rejectInvitation);

export const invitationsRouter = router;
