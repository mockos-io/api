import { RequestHandler } from "express";
import { HttpError } from "../errors/http";
import { authenticateUser } from "../helpers/auth";
import { prisma } from "../services/prisma";
import { notifyInvitations } from "../services/realtime/invitations";
import { subscribeToChannel, unsubscribeFromChannel } from "../services/redis";
import { invitationsParamsValidator } from "../validators/invitations/params";

export const acceptInvitation: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);
  const { invitationId } = invitationsParamsValidator.parse(req.params);

  const invitation = await prisma.members.findUnique({
    where: { id: invitationId, userId: user.id },
  });
  if (!invitation || invitation.verified)
    throw new HttpError(404, "Invitation not found");

  const member = await prisma.members.update({
    where: { id: invitation.id },
    data: { verified: true },
  });

  res.status(200).json(member);

  // Send realtime
  notifyInvitations(user.id);
};

export const rejectInvitation: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);
  const { invitationId } = invitationsParamsValidator.parse(req.params);

  const invitation = await prisma.members.findUnique({
    where: { id: invitationId, userId: user.id },
  });
  if (!invitation || invitation.verified)
    throw new HttpError(404, "Invitation not found");

  await prisma.members.delete({ where: { id: invitation.id } });

  res.status(200).json({ message: "Invitation rejected" });

  // Send realtime
  notifyInvitations(user.id);
};

export const listenInvitations: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);

  const invitations = await prisma.members.findMany({
    where: { userId: user.id, verified: false },
    include: { project: true },
  });

  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  res.write(`data: ${JSON.stringify(invitations)}\n\n`);

  const listener = (message: string) => {
    res.write(`data: ${message}\n\n`);
  };

  res.on("close", () => {
    unsubscribeFromChannel(`invitations:${user.id}`, listener);
  });

  await subscribeToChannel(`invitations:${user.id}`, listener);
};
