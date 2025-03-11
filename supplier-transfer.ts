// transfer scm_supplier_person and scm_supplier_account to supplier

import { PrismaClient, user_type_enum } from '@prisma/client';

const run = async () => {
  const prisma = new PrismaClient();

  const supplierPerson = await prisma.scm_supplier_person.findMany();
  const sellerAccount = await prisma.scm_seller_account.findMany();

  const supplierMap = supplierPerson.map((person) => ({
    name: person.name!,
    mobile: person.phone_number!,
    password: person.password!,
    user_type: user_type_enum.SUPPLIER_TONGPEI,
  }));

  const sellerAccountMap = sellerAccount.map((seller) => ({
    name: seller.moniker!,
    mobile: seller.mobile!,
    password: seller.password!,
    user_type: user_type_enum.SUPPLIER_ZHIPEI,
  }));

  await prisma.users.createMany({
    data: supplierMap,
  });

  await prisma.users.createMany({
    data: sellerAccountMap,
  });
};

run();
