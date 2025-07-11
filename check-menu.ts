import axios from 'axios';
import { PrismaClient as ImProcurementProdClient } from './prisma/clients/im-procurement-prod';

const run = async () => {
  const imProcurement = new ImProcurementProdClient();

  const shops = await imProcurement.scm_shop.findMany({
    where: {
      status: 1,
    },
  });

  for (const shop of shops) {
    const { data: imMenu } = await axios.get(
      `https://apiim.shaihukeji.com/goods/goodlist?shopId=${shop.id}`
    );

    const { data: procurementMenu } = await axios.get(
      `https://imms.shaihukeji.com/procurement/menu/shop-menu-flat/${shop.id}`
    );

    for (const category of imMenu.data) {
      for (const good of category.goods) {
        const procurementGood = procurementMenu.data.find(
          (item) => item.supplier_item_name === good.goodsName
        );
        if (!procurementGood) {
          console.log(`${shop.shop_name} ${good.goodsName} not found`);
          continue;
        }
        if (procurementGood.price !== good.price) {
          console.log(
            `${shop.shop_name} ${good.goodsName} price is not match ${procurementGood.price} !== ${good.price}`
          );
        }
      }
    }

    break;
  }
};

run();
