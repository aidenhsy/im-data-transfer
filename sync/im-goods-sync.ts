import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const scmReturnDetails = await database.scmOrderProd.procurement_order_return_details.findMany({
    where:{
      created_at: {
        gt: new Date('2026-02-01T00:00:00.000Z'),
      }
    },
    select:{
      status: true,
      procurement_order_details:{
        select:{
          reference_id:true
        }
      }
    }
  })

  for(const detail of scmReturnDetails){
    const imReturn = await database.imProcurementProd.supplier_order_return_details.findFirst({
      where:{
        supplier_order_details:{
          supplier_reference_id: detail.procurement_order_details.reference_id!,
        }
      }
    })

    if(detail.status !== imReturn?.status){
      console.log(`update return detail ${imReturn?.id} status to ${detail.status}`);
      await database.imProcurementProd.supplier_order_return_details.update({
        where:{
          id: imReturn?.id,
        },
        data:{
          status: detail.status,
        }
      })
    }
  }


};

run();