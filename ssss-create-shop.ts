import { axiosInstance } from './lib/axiosInstance';
import { DatabaseService } from './database';

const run = async () => {
  let id = 267703;
  const database = new DatabaseService();

  const centerId = 20031;
  let hasMore = true;
  let pageNo = 1;
  const pageSize = 50;
  while (hasMore) {
    console.log(`pageNo: ${pageNo}`);
    const { data } = await axiosInstance.post(
      `https://cysms.wuuxiang.com/api/datatransfer/getshops?centerId=${centerId}&pageNo=${pageNo}&pageSize=${pageSize}`,
      {},
      {
        headers: {
          access_token: 'b7627c55c014291c6caa9e062cdae4af',
          accessid: 'a07ab84b286f482d982877e8c7a9e0cf',
          granttype: 'client',
        },
      }
    );
    if (data.length === 0) {
      break;
    }
    for (const item of data.data.shopList) {
      if (item.shop_id === id) {
        hasMore = false;
        const city = await database.scmProd.cities.findFirst({
          where: {
            name: item.city_name,
          },
        });
        if (!city) {
          console.log(`city not found: ${item.city_name}`);
          continue;
        }
        const brand = await database.scmProd.scm_shop_brand.findFirst({
          where: {
            tcsl_id: `${item.brand_id}`,
          },
        });
        if (!brand) {
          console.log(`brand not found: ${item.brand_id}`);
          continue;
        }
        const newShop = await database.scmProd.scm_shop.upsert({
          where: {
            id: item.shop_id,
          },
          update: {},
          create: {
            shop_name: item.shop_name,
            address: item.address,
            brand_id: brand.id,
            status: 1,
            id: item.shop_id,
            is_join: 0,
            tc_shop_id: item.shop_id,
            city_id: city.id,
            automatic_receiving: 1,
            is_enabled: true,
            client_tier_id: 2,
            organization_id: 1,
          },
        });
        console.log(`newShop.shop_name: ${newShop.shop_name}`);

        // Filter out null/undefined fields from newShop
        const shopData = Object.fromEntries(
          Object.entries(newShop).filter(([_, v]) => v != null)
        ) as typeof newShop;

        await database.scmOrderProd.scm_shop.upsert({
          create: shopData,
          update: {},
          where: {
            id: newShop.id,
          },
        });

        const { organization_id, ...rest } = shopData;

        await database.imAccountingProd.scm_shop.upsert({
          create: {
            ...rest,
            big_org_id: organization_id,
            open_hours: [],
          },
          update: {},
          where: {
            id: newShop.id,
          },
        });
        await database.imBasicProd.scm_shop.upsert({
          create: {
            ...rest,
            big_org_id: organization_id,
            open_hours: [],
          },
          update: {},
          where: {
            id: newShop.id,
          },
        });
        await database.imInventoryProd.scm_shop.upsert({
          create: {
            ...rest,
            big_org_id: organization_id,
            open_hours: [],
          },
          update: {},
          where: {
            id: newShop.id,
          },
        });
        // await database.imPredictProd.scm_shop.upsert({
        //   create: {
        //     ...rest,
        //   },
        //   update: {},
        //   where: {
        //     id: newShop.id,
        //   },
        // });
        await database.imOrderProd.scm_shop.upsert({
          create: {
            ...rest,
          },
          update: {},
          where: {
            id: newShop.id,
          },
        });
        await database.imProcurementProd.scm_shop.upsert({
          create: {
            ...rest,
            big_org_id: organization_id,
            open_hours: [],
          },
          update: {},
          where: {
            id: newShop.id,
          },
        });
        console.log(`all created for shop: ${newShop.id}`);
        break;
      }
    }
    if (data.data.shopList.length < pageSize) {
      hasMore = false;
    }
    pageNo++;
  }
};

run();
