import { DatabaseService } from '../database';

const runCountDetails = async () => {
  const databaseService = new DatabaseService();

  const countDetails =
    await databaseService.imInventoryDev.inventory_count_details.findMany({
      select: {
        id: true,
        supplier_item_id: true,
        shop_id: true,
        supplier_items: {
          select: {
            supplier_reference_id: true,
          },
        },
      },
      where: {
        generic_item_id: null,
      },
    });

  console.log(countDetails.length);

  for (const countDetail of countDetails) {
    const planItemSupplierGood =
      await databaseService.imProcurementProd.supplier_order_details.findFirst({
        where: {
          supplier_item_id: countDetail.supplier_item_id,
          supplier_orders: {
            shop_id: countDetail.shop_id!,
          },
        },
        select: {
          item_id: true,
        },
      });

    if (!planItemSupplierGood) {
      const genericId =
        countDetail.supplier_items?.supplier_reference_id?.split('-')[2];
      await databaseService.imInventoryDev.inventory_count_details.update({
        where: {
          id: countDetail.id,
        },
        data: {
          generic_item_id: Number(genericId),
        },
      });
      continue;
    }

    await databaseService.imInventoryDev.inventory_count_details.update({
      where: {
        id: countDetail.id,
      },
      data: {
        generic_item_id: planItemSupplierGood.item_id,
      },
    });
  }
};

// runCountDetails();

const runShopItemWeightedPrice = async () => {
  const databaseService = new DatabaseService();

  const shopItemWeightedPrices =
    await databaseService.imInventoryDev.shop_item_weighted_price.findMany({
      select: {
        id: true,
        supplier_item_id: true,
        shop_id: true,
        supplier_items: {
          select: {
            supplier_reference_id: true,
          },
        },
      },
      where: {
        generic_item_id: null,
      },
    });

  console.log(shopItemWeightedPrices.length);

  for (const shopItemWeightedPrice of shopItemWeightedPrices) {
    const planItemSupplierGood =
      await databaseService.imProcurementProd.supplier_order_details.findFirst({
        where: {
          supplier_item_id: shopItemWeightedPrice.supplier_item_id,
          supplier_orders: {
            shop_id: shopItemWeightedPrice.shop_id!,
          },
        },
        select: {
          item_id: true,
        },
      });

    if (!planItemSupplierGood) {
      const genericId =
        shopItemWeightedPrice.supplier_items?.supplier_reference_id?.split(
          '-'
        )[2];
      await databaseService.imInventoryDev.shop_item_weighted_price.update({
        where: {
          id: shopItemWeightedPrice.id,
        },
        data: {
          generic_item_id: Number(genericId),
        },
      });
      continue;
    }

    await databaseService.imInventoryDev.shop_item_weighted_price.update({
      where: {
        id: shopItemWeightedPrice.id,
      },
      data: {
        generic_item_id: planItemSupplierGood.item_id,
      },
    });
  }
};

runShopItemWeightedPrice();
