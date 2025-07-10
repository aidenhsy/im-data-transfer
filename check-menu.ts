import axios from 'axios';
import { PrismaClient as ImProcurementProdClient } from './prisma/clients/im-procurement-prod';

const run = async () => {
  const imProcurement = new ImProcurementProdClient();

  const shops = await imProcurement.scm_shop.findMany({
    where: {
      status: 1,
      is_enabled: true,
    },
  });

  for (const shop of shops) {
    const { data: imMenu } = await axios.get(
      `https://apiim.shaihukeji.com/goods/goodlist?shopId=${shop.id}`
    );

    const { data: procurementMenu } = await axios.get(
      `https://imms.shaihukeji.com/procurement/menu/shop-menu-flat/${shop.id}`
    );

    for (const category of imMenu) {
      for (const item of category.goods) {
        console.log(item);
      }
      break;
    }

    break;
  }
};

run();
