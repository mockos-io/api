import { prisma } from "../prisma";
import { hasChannelSubcribers, sendMessageToChannel } from "../redis";

export const notifyResponses = (routeId: number) => {
  const channel = `route:${routeId}`;

  return hasChannelSubcribers(channel)
    .then((subscribers) =>
      subscribers
        ? prisma.response
            .findMany({
              where: { routeId },
            })
            .then((responses) =>
              sendMessageToChannel(channel, JSON.stringify(responses))
            )
        : undefined
    )
    .catch(() => undefined);
};
