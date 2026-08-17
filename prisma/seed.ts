import { PrismaClient } from "@prisma/client";
import { LAB_DEFINITIONS } from "../src/lib/labs/registry";

const prisma = new PrismaClient();

async function main() {
  const instructor = await prisma.user.upsert({
    where: { email: "instructor@training.local" },
    update: {},
    create: { email: "instructor@training.local", role: "INSTRUCTOR" },
  });

  const student = await prisma.user.upsert({
    where: { email: "student@training.local" },
    update: {},
    create: { email: "student@training.local", role: "STUDENT" },
  });

  for (const [index, lab] of LAB_DEFINITIONS.entries()) {
    await prisma.lab.upsert({
      where: { slug: lab.slug },
      update: {
        title: lab.title,
        description: lab.description,
        difficulty: lab.difficulty,
        category: lab.category,
        order: index,
      },
      create: {
        slug: lab.slug,
        title: lab.title,
        description: lab.description,
        difficulty: lab.difficulty,
        category: lab.category,
        order: index,
        enabled: true,
      },
    });
  }

  console.log(`Seeded instructor (${instructor.email}), student (${student.email}), and ${LAB_DEFINITIONS.length} labs.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
