// import { DatabaseService } from './database';

// const run = async () => {
//   const database = new DatabaseService();

//   const orders = await database.imInventoryProd;

//   for (const supplierItem of supplierItems) {
//     const pricing = await database.scmPricingProd.scm_good_pricing.findFirst({
//       where: {
//         external_reference_id: supplierItem.supplier_reference_id,
//       },
//     });

//     if (Number(pricing?.sale_price) !== Number(supplierItem.price)) {
//       console.log(supplierItem.supplier_reference_id, 'not equal');
//     }
//   }
// };

// run();
