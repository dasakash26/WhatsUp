import { AppError } from "../../utils/app-error";
import { prisma } from "../../lib/prisma";
import type { Role } from "../../../generated/prisma/enums";
import { verifyToken } from "@clerk/backend";
import { getAuth } from "@clerk/hono";
import type { Context } from "hono";
import { CLERK_SECRET_KEY } from "../../utils/secrets";

export async function requireCurrentUser(c: Context) {
  const clerkToken = c.req.query("clerkToken");
  let clerkId: string | null;

  if (clerkToken) {
    try {
      const { sub } = await verifyToken(clerkToken, {
        secretKey: CLERK_SECRET_KEY,
      });
      clerkId = sub;
    } catch (e) {
      throw new AppError(403, "Invalid or expired token");
    }
  } else {
    const { userId } = getAuth(c);
    clerkId = userId;
  }

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
