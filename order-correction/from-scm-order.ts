import { PrismaClient as ImProcurement } from '../prisma/clients/im-procurement-prod';
import { PrismaClient as SCMOrder } from '../prisma/clients/scm-order-prod';
import { PrismaClient as SCMProd } from '../prisma/clients/scm-prod';

const run = async () => {
  const imProcurementDB = new ImProcurement();
  const scmOrderDB = new SCMOrder();
  const scmProdDB = new SCMProd();

  const scmOrders = await scmOrderDB.procurement_order_details.findMany({
    where: {
      order_id: {
        in: [
          '73732631-2acf-4725-abd5-797cb267af5f',
          'ff55c403-c958-4553-acf2-0ddb0ec72edc',
          '47a4f3bc-7601-43c2-8292-aa8193cabe58',
          '2d88cd7e-dc23-4afd-a895-cfc540a22b0b',
          '931d3130-95e2-40ce-94f4-460ec4a161f5',
          'e9f7f473-300a-492f-9f2e-eb348d0c4963',
          '2746a037-995c-401e-9ef1-55fb7b64daa8',
          '1dfd44ad-97ff-41ee-ab86-21d49ee12ab5',
          '533018c2-bc10-49cf-8def-5c2c4680de05',
          'e553ea8b-b907-450d-a020-cf7606d40867',
          '08a88704-bcce-4f85-85a5-fa6004c90004',
        ],
      },
    },
    include: {
      procurement_orders: true,
    },
  });

  for (const scmOrder of scmOrders) {
    if (
      scmOrder.name?.includes('多宝鱼') ||
      scmOrder.name?.includes('松叶蟹') ||
      scmOrder.name?.includes('鸦片鱼')
    ) {
      console.log(scmOrder.customer_receive_qty, scmOrder.final_qty);
      const imProcurementOrder =
        await imProcurementDB.supplier_order_details.findFirst({
          where: {
            supplier_reference_id: scmOrder.reference_id!,
            order_id: scmOrder.procurement_orders.client_order_id,
          },
        });
      if (!imProcurementOrder) {
        console.log(scmOrder.reference_id);
        continue;
      }
      const scmProdOrder = await scmProdDB.scm_order_details.findFirst({
        where: {
          reference_order_id: imProcurementOrder.order_id,
          reference_id: scmOrder.reference_id!,
        },
      });
      if (!scmProdOrder) {
        console.log(scmOrder.reference_id);
        continue;
      }
      await imProcurementDB.supplier_order_details.update({
        where: {
          id: imProcurementOrder.id,
        },
        data: {
          actual_delivery_qty: scmOrder.final_qty,
          confirm_delivery_qty: scmOrder.final_qty,
        },
      });
      await scmProdDB.scm_order_details.update({
        where: {
          id: scmProdOrder.id,
        },
        data: {
          delivery_qty: scmOrder.final_qty!,
        },
      });
      await scmOrderDB.procurement_order_details.update({
        where: {
          id: scmOrder.id,
        },
        data: {
          customer_receive_qty: scmOrder.final_qty!,
          deliver_qty: scmOrder.final_qty!,
        },
      });
    }
  }

  console.log('done');
};

run();
