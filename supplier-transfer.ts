// transfer scm_supplier_person and scm_supplier_account to supplier

import { PrismaClient } from '@prisma/client';

const run = async () => {
  const prisma = new PrismaClient();

  const supplierPerson = await prisma.scm_supplier_person.findMany();
  const sellerAccount = await prisma.scm_seller_account.findMany();
  const suppliers = await prisma.scm_supplier.findMany();
  // await prisma.staff

  for (const person of supplierPerson) {
  }

  for (const seller of sellerAccount) {
  }

  for (const supplier of suppliers) {
  }
};

run();
