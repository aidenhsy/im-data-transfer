// transfer scm_supplier_person and scm_supplier_account to supplier

import { PrismaClient } from '@prisma/client';

const run = async () => {
  const prisma = new PrismaClient();

  const supplierPerson = await prisma.scm_supplier_person.findMany();
  const sellerAccount = await prisma.scm_seller_account.findMany();
  const storehouse  = await prisma.scm_storehouse.findMany();

  const supplierMap = supplierPerson.map((person) => ({
    user_name: person.name!,
    mobile: person.phone_number!,
    password: person.password!,
  }));

  const sellerAccountMap = sellerAccount.map((seller) => ({
    user_name: seller.moniker!,
    mobile: seller.mobile!,
    password: seller.password!,
  }));
  
  const storehouseMap = storehouse.map((store) => ({ 
    user_name: store.nickname!,
    mobile: store.mobile!,
    password: store.password!,
  }));
  
  const users = [ ...supplierMap, ...sellerAccountMap,...storehouseMap];
  
  await prisma.users.createMany({
    data: users,
  });


};

run();
