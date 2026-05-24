import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.foundationCatalogItem.createMany({
    skipDuplicates: true,
    data: [
      // Tubulões (CAISSON) — tipo TM
      { catalogRefId: 'TM-080-140-300', kind: 'CAISSON', typeCode: 'TM', description: 'Tubulão Df=0.80m Db=1.40m H=3.00m', geometry: { shaftDiameter: 0.8, baseDiameter: 1.4, shaftHeight: 3, frustumHeight: 0.4, baseHeight: 0.8 }, loadCapacity: { compression: 800, tension: 400 } },
      { catalogRefId: 'TM-100-160-350', kind: 'CAISSON', typeCode: 'TM', description: 'Tubulão Df=1.00m Db=1.60m H=3.50m', geometry: { shaftDiameter: 1, baseDiameter: 1.6, shaftHeight: 3.5, frustumHeight: 0.5, baseHeight: 1 }, loadCapacity: { compression: 1200, tension: 600 } },
      { catalogRefId: 'TM-120-200-400', kind: 'CAISSON', typeCode: 'TM', description: 'Tubulão Df=1.20m Db=2.00m H=4.00m', geometry: { shaftDiameter: 1.2, baseDiameter: 2, shaftHeight: 4, frustumHeight: 0.6, baseHeight: 1.2 }, loadCapacity: { compression: 1800, tension: 900 } },
      { catalogRefId: 'TM-140-240-450', kind: 'CAISSON', typeCode: 'TM', description: 'Tubulão Df=1.40m Db=2.40m H=4.50m', geometry: { shaftDiameter: 1.4, baseDiameter: 2.4, shaftHeight: 4.5, frustumHeight: 0.7, baseHeight: 1.4 }, loadCapacity: { compression: 2500, tension: 1200 } },
      // Tubulões tipo TE
      { catalogRefId: 'TE-100-180-400', kind: 'CAISSON', typeCode: 'TE', description: 'Tubulão Escavado Df=1.00m Db=1.80m H=4.00m', geometry: { shaftDiameter: 1, baseDiameter: 1.8, shaftHeight: 4, frustumHeight: 0.5, baseHeight: 1 }, loadCapacity: { compression: 1400, tension: 700 } },
      { catalogRefId: 'TE-120-220-450', kind: 'CAISSON', typeCode: 'TE', description: 'Tubulão Escavado Df=1.20m Db=2.20m H=4.50m', geometry: { shaftDiameter: 1.2, baseDiameter: 2.2, shaftHeight: 4.5, frustumHeight: 0.6, baseHeight: 1.2 }, loadCapacity: { compression: 2000, tension: 1000 } },
      // Sapatas (FOOTING) — tipo S
      { catalogRefId: 'S-200-200-060', kind: 'FOOTING', typeCode: 'S', description: 'Sapata 2.00×2.00×0.60m', geometry: { length: 2, width: 2, height: 0.6 }, loadCapacity: { compression: 600, tension: 200 } },
      { catalogRefId: 'S-250-250-080', kind: 'FOOTING', typeCode: 'S', description: 'Sapata 2.50×2.50×0.80m', geometry: { length: 2.5, width: 2.5, height: 0.8 }, loadCapacity: { compression: 900, tension: 300 } },
      { catalogRefId: 'S-300-300-100', kind: 'FOOTING', typeCode: 'S', description: 'Sapata 3.00×3.00×1.00m', geometry: { length: 3, width: 3, height: 1 }, loadCapacity: { compression: 1300, tension: 450 } },
      { catalogRefId: 'S-350-350-120', kind: 'FOOTING', typeCode: 'S', description: 'Sapata 3.50×3.50×1.20m', geometry: { length: 3.5, width: 3.5, height: 1.2 }, loadCapacity: { compression: 1800, tension: 600 } },
      // Sapatas tipo SM (com stub metálico)
      { catalogRefId: 'SM-250-250-100', kind: 'FOOTING', typeCode: 'SM', description: 'Sapata c/stub 2.50×2.50×1.00m', geometry: { length: 2.5, width: 2.5, height: 1 }, loadCapacity: { compression: 1000, tension: 500 } },
      { catalogRefId: 'SM-300-300-120', kind: 'FOOTING', typeCode: 'SM', description: 'Sapata c/stub 3.00×3.00×1.20m', geometry: { length: 3, width: 3, height: 1.2 }, loadCapacity: { compression: 1500, tension: 750 } },
    ],
  });

  const adminHash = await bcrypt.hash('Admin@123', 12);
  const engHash = await bcrypt.hash('Eng@123456', 12);

  await prisma.user.upsert({
    where: { email: 'admin@ltfoundation.com' },
    update: {},
    create: { email: 'admin@ltfoundation.com', name: 'Administrador', role: 'ADMIN', passwordHash: adminHash, active: true },
  });

  await prisma.user.upsert({
    where: { email: 'engenheiro@ltfoundation.com' },
    update: {},
    create: { email: 'engenheiro@ltfoundation.com', name: 'Engenheiro Padrão', role: 'ENGINEER', passwordHash: engHash, active: true },
  });

  console.log('Seed completed.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
