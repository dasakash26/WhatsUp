import type { Request } from "express";
import { getAuth } from "@clerk/express";
import { AppError } from "../../utils/app-error";
import { prisma } from "../../lib/prisma";
import type { Role } from "../../../generated/prisma/enums";

export async function requireCurrentUser(req: Request) {
  const { userId: clerkId } = getAuth(req);

  if (!clerkId) throw new AppError(403, "unauthorized");

  const user = await prisma.user.findFirst({ where: { clerkId } });

  if (!user || user.deletedAt) throw new AppError(404, "user not found");

  return user;
}

export async function requireChatRole(
  chatId: string,
  userId: string,
  allowedRoles: Role[] = ["MEMBER", "ADMIN", "SUPERADMIN"],
) {
  const member = await prisma.chatMember.findUnique({
    where: {
      chatId_userId: {
        chatId,
        userId,
      },
    },
  });

  if (!member || !allowedRoles.includes(member.role))
    throw new AppError(403, "unauthorized");

  return member;
}
