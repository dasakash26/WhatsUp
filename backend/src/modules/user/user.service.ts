import type { UserJSON } from "@clerk/express";
import { prisma } from "../../lib/prisma";

interface ClerkUser {
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
}

export function extractUserFromEventData(data: UserJSON): ClerkUser {
  const primaryEmail = data.email_addresses.find(
    (email) => email.id === data.primary_email_address_id,
  );

  const email =
    primaryEmail?.email_address ?? data.email_addresses[0]?.email_address;

  if (!email) {
    throw new Error(`Clerk user ${data.id} has no email address`);
  }

  return {
    clerkId: data.id,
    email,
    firstName: data.first_name,
    lastName: data.last_name,
    imageUrl: data.image_url ?? data.image_url,
  };
}

export async function upsertUser({
  clerkId,
  email,
  firstName,
  lastName,
  imageUrl,
}: ClerkUser) {
  const res = await prisma.user.upsert({
    where: {
      clerkId: clerkId,
    },
    update: {
      email,
      firstName,
      lastName,
      imageUrl,
    },
    create: {
      clerkId,
      email,
      firstName,
      lastName,
      imageUrl,
    },
  });
  return res;
}

export async function deleteUser(clerkId: string) {
  return await prisma.user.update({
    where: {
      clerkId,
    },
    data: {
      deletedAt: new Date(),
    },
  });
}

export async function getUserFromlerkId(clerkId: string) {
  return await prisma.user.findUnique({
    where: { clerkId },
  });
}
