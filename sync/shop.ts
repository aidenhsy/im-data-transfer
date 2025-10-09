import { DatabaseService } from './../database';

// const runScm = async () => {
//   const database = new DatabaseService();

//   const brands = await database.scmProd.scm_shop_brand.findMany();
//   const clientOrganizations =
//     await database.scmProd.client_organizations.findMany();
//   const businessDistricts =
//     await database.scmProd.scm_business_district.findMany();
//   const shops = await database.scmProd.scm_shop.findMany();

//   for (const brand of brands) {
//     await database.scmOrderProd.scm_shop_brand.upsert({
//       where: {
//         id: brand.id,
//       },
//       create: {
//         ...brand,
//       },
//       update: {
//         ...brand,
//       },
//     });
//   }

//   for (const clientOrganization of clientOrganizations) {
//     await database.scmOrderProd.client_organizations.upsert({
//       where: {
//         id: clientOrganization.id,
//       },
//       create: {
//         ...(clientOrganization as any),
//       },
//       update: {
//         ...(clientOrganization as any),
//       },
//     });
//   }

//   for (const businessDistrict of businessDistricts) {
//     await database.scmOrderProd.scm_business_district.upsert({
//       where: {
//         id: businessDistrict.id,
//       },
//       create: {
//         ...businessDistrict,
//       },
//       update: {
//         ...businessDistrict,
//       },
//     });
//   }

//   for (const shop of shops) {
//     await database.scmOrderProd.scm_shop.upsert({
//       where: {
//         id: shop.id,
//       },
//       create: {
//         ...shop,
//       },
//       update: {
//         ...shop,
//       },
//     });
//   }
// };

// runScm();

const runIm = async () => {
  const database = new DatabaseService();

  const brands = await database.imBasicProd.scm_shop_brand.findMany();
  const clientOrganizations = await database.imBasicProd.big_org.findMany();
  const shops = await database.imBasicProd.scm_shop.findMany({
    orderBy: {
      id: 'desc',
    },
  });

  for (const clientOrganization of clientOrganizations) {
    await database.imAccountingProd.big_org.upsert({
      where: {
        id: clientOrganization.id,
      },
      create: {
        ...(clientOrganization as any),
      },
      update: {
        ...(clientOrganization as any),
      },
    });
  }

  for (const brand of brands) {
    await database.imAccountingProd.scm_shop_brand.upsert({
      where: {
        id: brand.id,
      },
      create: {
        ...brand,
      },
      update: {
        ...brand,
      },
    });
  }

  for (const shop of shops) {
    await database.imAccountingProd.scm_shop.upsert({
      where: {
        id: shop.id,
      },
      create: {
        ...(shop as any),
      },
      update: {
        ...(shop as any),
      },
    });
    const { serial_num, ...shopData } = shop;
    await database.imPredictProd.scm_shop.upsert({
      where: {
        id: shop.id,
      },
      create: {
        shop_name: shopData.shop_name,
        id: shopData.id,
        status: shopData.status,
      },
      update: {
        shop_name: shopData.shop_name,
        id: shopData.id,
        status: shopData.status,
      },
    });
  }
};

runIm();
