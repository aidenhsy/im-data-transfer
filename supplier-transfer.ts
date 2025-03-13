// transfer scm_supplier_person and scm_supplier_account to supplier

import { PrismaClient } from '@prisma/client';

const run = async () => {
  const prisma = new PrismaClient();

  // const supplierPerson = await prisma.scm_supplier_person.findMany();
  // const sellerAccount = await prisma.scm_seller_account.findMany();
  // const storehouse  = await prisma.scm_storehouse.findMany();

  // const supplierMap = supplierPerson.map((person) => ({
  //   user_name: person.name!,
  //   mobile: person.phone_number!,
  //   password: person.password!,
  // }));

  // const sellerAccountMap = sellerAccount.map((seller) => ({
  //   user_name: seller.moniker!,
  //   mobile: seller.mobile!,
  //   password: seller.password!,
  // }));
  
  // const storehouseMap = storehouse.map((store) => ({ 
  //   user_name: store.nickname!,
  //   mobile: store.mobile!,
  //   password: store.password!,
  // }));
  
  // const users = [ ...supplierMap, ...sellerAccountMap,...storehouseMap];
  
  // await prisma.users.createMany({
  //   data: users,
  // });


  // 查询 scm_supplier 数据
  // const scmSupplier = await prisma.scm_supplier.findMany();

  //   // 映射 scmSupplier 数据
  // const scmSupplierMap = scmSupplier.map((sup) => ({
  //   user_id: sup.id!,
  //   serial_num: sup.serial_num!,
  //   settlement: sup.settlement!,
  //   is_first: sup.is_first,
  //   push_order: sup.push_order!,
  // }));

   // Fetch all phone numbers from scm_supplier
   const scmSupplier = await prisma.scm_supplier.findMany({
    select: {
      id: true,
      phone_number: true,
      serial_num: true,
      settlement: true,
      is_first: true,
      push_order: true,
    },
  });

  // Extract phone numbers and filter out nulls
  const phoneNumbers = scmSupplier.map((sup) => sup.phone_number).filter((num): num is string => num !== null);

  // Query users table to get user IDs for these phone numbers
  const users = await prisma.users.findMany({
    where: {
      mobile: { in: phoneNumbers },
    },
    select: {
      id: true,
      mobile: true,
    },
  });

  // Create a map of phone_number to user_id
  const usersMap = new Map(users.map((user) => [user.mobile, user.id]));

  // Map scmSupplier data to include user_id
  const scmSupplierMap = scmSupplier.map((sup) => {
    if (!sup.phone_number) {
      console.warn(`No phone_number for supplier ID: ${sup.id}`);
      return null; // Skip if phone_number is null
    }
    const userId = usersMap.get(sup.phone_number);
    if (!userId) {
      console.warn(`No user_id found for phone_number: ${sup.phone_number}`);
      return null; // Skip if no user_id found
    }
    return {
      user_id: userId, // Set the user_id
      serial_num: sup.serial_num!,
      settlement: sup.settlement!,
      is_first: sup.is_first ?? 0, // Ensure is_first is not null
      push_order: sup.push_order!,
    };
  }).filter(Boolean); // Filter out null values


};

run();
