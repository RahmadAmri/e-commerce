import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  const categories = await prisma.$transaction([
    prisma.category.create({
      data: { name: "Electronics", slug: "electronics" },
    }),
    prisma.category.create({ data: { name: "Books", slug: "books" } }),
    prisma.category.create({ data: { name: "Fashion", slug: "fashion" } }),
  ]);

  const [electronics, books, fashion] = categories;

  function slugify(input: string) {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  const images = ["/headphone.jpg", "/case.jpg", "/novel.jpeg", "/shirt.jpeg"];

  const products: Prisma.ProductCreateManyInput[] = [];
  for (let i = 0; i < 20; i++) {
    const idx = i + 1;
    const category = i % 3 === 0 ? electronics : i % 3 === 1 ? books : fashion;
    const categoryName =
      category.id === electronics.id
        ? "Electronics"
        : category.id === books.id
        ? "Books"
        : "Fashion";

    const name = `${categoryName} Item ${idx}`;
    const slug = `${slugify(name)}-${idx}`;
    const description = `Sample ${categoryName.toLowerCase()} product #${idx} for pagination.`;
    const price =
      categoryName === "Books"
        ? 5 + (idx % 45)
        : categoryName === "Fashion"
        ? 10 + (idx % 140)
        : 15 + (idx % 980);
    const imageUrl = images[i % images.length];
    const stock = 20 + ((idx * 7) % 200);

    products.push({
      name,
      slug,
      description,
      price,
      imageUrl,
      categoryId: category.id,
      stock,
    });
  }

  await prisma.product.createMany({
    data: products,
    skipDuplicates: true,
  });

  console.log(`Seed completed. Inserted up to ${products.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
