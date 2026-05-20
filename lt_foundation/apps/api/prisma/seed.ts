import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.foundationCatalogItem.createMany({
    skipDuplicates: true,
    data: [
      {
        catalogRefId: 'caisson-080-140-300',
        kind: 'CAISSON',
        description: 'Tubulão Df=0.80m Db=1.40m Hf=3.00m',
        geometry: { shaftDiameter: 0.8, baseDiameter: 1.4, shaftHeight: 3.0, frustumHeight: 0.4, baseHeight: 0.8 },
      },
      {
        catalogRefId: 'caisson-100-160-350',
        kind: 'CAISSON',
        description: 'Tubulão Df=1.00m Db=1.60m Hf=3.50m',
        geometry: { shaftDiameter: 1.0, baseDiameter: 1.6, shaftHeight: 3.5, frustumHeight: 0.5, baseHeight: 1.0 },
      },
      {
        catalogRefId: 'caisson-120-200-400',
        kind: 'CAISSON',
        description: 'Tubulão Df=1.20m Db=2.00m Hf=4.00m',
        geometry: { shaftDiameter: 1.2, baseDiameter: 2.0, shaftHeight: 4.0, frustumHeight: 0.6, baseHeight: 1.2 },
      },
      {
        catalogRefId: 'footing-200-200-060',
        kind: 'FOOTING',
        description: 'Sapata 2.00x2.00x0.60m',
        geometry: { length: 2.0, width: 2.0, height: 0.6 },
      },
      {
        catalogRefId: 'footing-250-250-080',
        kind: 'FOOTING',
        description: 'Sapata 2.50x2.50x0.80m',
        geometry: { length: 2.5, width: 2.5, height: 0.8 },
      },
      {
        catalogRefId: 'footing-300-300-100',
        kind: 'FOOTING',
        description: 'Sapata 3.00x3.00x1.00m',
        geometry: { length: 3.0, width: 3.0, height: 1.0 },
      },
    ],
  });

  console.log('Seed completed.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
