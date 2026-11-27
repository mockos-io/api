import { object, z } from "zod";

export const invitationsParamsValidator = object({
  invitationId: z.coerce
    .number("A valid invitation id is required")
    .int()
    .positive("A valid invitation id is required"),
});
