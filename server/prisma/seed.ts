import { PrismaClient, MessageStatus } from "@prisma/client";
const prisma = new PrismaClient();

const firstNames = [
  "Arjun",
  "Priya",
  "Rahul",
  "Neha",
  "Aditya",
  "Kavita",
  "Vikram",
  "Meera",
  "Akash",
];

const lastNames = [
  "Patel",
  "Sharma",
  "Kumar",
  "Singh",
  "Gupta",
  "Verma",
  "Shah",
  "Reddy",
  "Das",
];

const generateEmail = (firstName: string, lastName: string) => {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
};

async function main() {
  await prisma.message.deleteMany();
  await prisma.conversationUser.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.user.deleteMany();

  const users = await Promise.all(
    firstNames.map(async (firstName, index) => {
      const lastName = lastNames[index];
      const clerkId = `user_${Math.random().toString(36).substr(2, 9)}`;

      return prisma.user.create({
        data: {
          id: clerkId,
          username: `${firstName}${lastName}`,
          email: generateEmail(firstName, lastName),
          phoneNumber: `+91${Math.floor(
            1000000000 + Math.random() * 9000000000
          )}`,
          avatarUrl:
            Math.random() > 0.3
              ? `https://avatar.example.com/${firstName.toLowerCase()}.jpg`
              : null,
          lastSeen: new Date(),
          createdAt: new Date(),
        },
      });
    })
  );

  // Create one-on-one conversations between users
  const conversations = [];
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const conversation = await prisma.conversation.create({
        data: {
          isGroup: false,
          participants: {
            create: [
              { userId: users[i].id, isAdmin: false },
              { userId: users[j].id, isAdmin: false },
            ],
          },
          createdAt: new Date(),
        },
        include: {
          participants: true,
        },
      });
      conversations.push(conversation);
    }
  }

  // Create a few group conversations
  const groupConversations = await Promise.all([
    prisma.conversation.create({
      data: {
        name: "Project Team",
        isGroup: true,
        participants: {
          create: users.slice(0, 5).map((user) => ({
            userId: user.id,
            isAdmin: user.id === users[0].id,
          })),
        },
        createdAt: new Date(),
      },
      include: {
        participants: true,
      },
    }),
    prisma.conversation.create({
      data: {
        name: "Family Group",
        isGroup: true,
        participants: {
          create: users.slice(4, 9).map((user) => ({
            userId: user.id,
            isAdmin: user.id === users[4].id,
          })),
        },
        createdAt: new Date(),
      },
      include: {
        participants: true,
      },
    }),
  ]);

  conversations.push(...groupConversations);

  const messageContents = [
    "Kaise ho yaar?",
    "Chai peene chalein?",
    "Weekend pe movie dekhne ka plan hai?",
    "Project ka kya status hai?",
    "Namaste! Kya chal raha hai?",
    "Is weekend free ho?",
    "Aaj lunch saath karein?",
    "Meeting ke baad milte hain",
  ];

  const sampleImages = [
    null,
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg",
  ];

  // Create messages in conversations
  for (const conversation of conversations) {
    const participants = conversation.participants;
    const messageCount = Math.floor(Math.random() * 10) + 1; // 1-10 messages per conversation

    for (let i = 0; i < messageCount; i++) {
      const randomParticipant =
        participants[Math.floor(Math.random() * participants.length)];
      const status = [
        MessageStatus.SENT,
        MessageStatus.DELIVERED,
        MessageStatus.READ,
      ][Math.floor(Math.random() * 3)];

      await prisma.message.create({
        data: {
          text: messageContents[
            Math.floor(Math.random() * messageContents.length)
          ],
          image: sampleImages[Math.floor(Math.random() * sampleImages.length)],
          status: status,
          senderId: randomParticipant.userId,
          conversationId: conversation.id,
          createdAt: new Date(
            Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
          ), // Random date within last week
        },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
