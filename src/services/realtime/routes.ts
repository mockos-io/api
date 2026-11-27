import { prisma } from "../prisma";
import { hasChannelSubcribers, sendMessageToChannel } from "../redis";

export const notifyRoutes = (projectId: number) => {
  const channel = `project:${projectId}`;

  return hasChannelSubcribers(channel)
    .then((subscribers) =>
      subscribers
        ? prisma.route
            .findMany({
              include: { children: { orderBy: { order: "asc" } } },
              where: { projectId, parentFolderId: null },
              orderBy: { order: "asc" },
            })
            .then((routes) =>
              sendMessageToChannel(channel, JSON.stringify(routes))
            )
        : undefined
    )
    .catch(() => undefined);
};
