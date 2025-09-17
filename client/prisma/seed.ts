import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clear existing
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()

  const categories = await prisma.$transaction([
    prisma.category.create({ data: { name: 'Electronics', slug: 'electronics' } }),
    prisma.category.create({ data: { name: 'Books', slug: 'books' } }),
    prisma.category.create({ data: { name: 'Fashion', slug: 'fashion' } }),
  ])

  const [electronics, books, fashion] = categories

  await prisma.product.createMany({
    data: [
      {
        name: 'Wireless Headphones',
        slug: 'wireless-headphones',
        description: 'Comfortable over-ear wireless headphones with noise cancelling.',
        price: 99.99,
        imageUrl: '/vercel.svg',
        categoryId: electronics.id,
        stock: 50,
      },
      {
        name: 'Smartphone Case',
        slug: 'smartphone-case',
        description: 'Durable protective case for your smartphone.',
        price: 19.99,
        imageUrl: '/next.svg',
        categoryId: electronics.id,
        stock: 200,
      },
      {
        name: 'Novel: The Journey',
        slug: 'novel-the-journey',
        description: 'An inspiring adventure story.',
        price: 12.5,
        imageUrl: '/globe.svg',
        categoryId: books.id,
        stock: 100,
      },
      {
        name: 'T-Shirt',
        slug: 't-shirt',
        description: 'Comfortable cotton t-shirt.',
        price: 15.0,
        imageUrl: '/window.svg',
        categoryId: fashion.id,
        stock: 150,
      },
    ],
  })

  console.log('Seed completed')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
