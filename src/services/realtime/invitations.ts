import { prisma } from "../prisma";
import { hasChannelSubcribers, sendMessageToChannel } from "../redis";

export const notifyInvitations = (userId: number) => {
  const channel = `invitations:${userId}`;

  return hasChannelSubcribers(channel)
    .then((subscribers) =>
      subscribers
        ? prisma.members
            .findMany({
              where: { userId, verified: false },
              include: { project: true },
            })
            .then((invitations) =>
              sendMessageToChannel(channel, JSON.stringify(invitations))
            )
        : undefined
    )
    .catch(() => undefined);
};
