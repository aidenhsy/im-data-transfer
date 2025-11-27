import { DatabaseService } from './database';
import axios from 'axios';

const run = async () => {
  const database = new DatabaseService();

  const response = await axios.post(
    'https://imms.shaihukeji.com/inventory/count/create',
    {
      shop_id: 44,
      type: 1,
    }
  );

  if (response.data.msg !== 'success') {
    console.log(response.data);
    return;
  }

  const count = await database.imInventoryProd.inventory_count.findUnique({
    where: {
      id: response.data.data.id,
    },
    include: {
      scm_shop: true,
    },
  });

  console.log(count?.id);

  const details =
    await database.imInventoryProd.inventory_count_details.findMany({
      where: {
        inventory_count_id: response.data.data.id,
      },
    });

  for (const detail of details) {
    const lastPurchase =
      await database.imProcurementProd.supplier_items.findFirst({
        where: {
          id: detail.supplier_item_id,
          city_id: count?.scm_shop?.city_id,
          tier_id: count?.scm_shop?.client_tier_id!,
        },
      });

    const lastPrice =
      Number(lastPurchase?.price) /
      Number(lastPurchase?.package_unit_to_base_ratio);

    console.log(
      `last price: ${lastPrice}, weighted price: ${detail.weighted_price}`
    );
  }

  const deleteResponse = await axios.post(
    'https://imms.shaihukeji.com/inventory/count/delete',
    {
      count_id: response.data.data.id,
    }
  );

  console.log(deleteResponse.data, 'deleted');
};

run();
