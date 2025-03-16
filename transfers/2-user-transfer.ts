import { PrismaClient } from '@prisma/client';

const run = async () => {
  const prisma = new PrismaClient();

  // supplier.type 1 = 直配 2 = 统配
  // 统配供应商公司
  const tpSupplierCompanies = await prisma.scm_supplier.findMany();
  // 统配供应商
  const tpSuppliers = await prisma.scm_supplier_person.findMany();
  // 直配供应商公司
  const zpSupplierCompanyIds = await prisma.scm_seller.findMany();
  // 直配供应商
  const zpSuppliers = await prisma.scm_seller_account.findMany();
  // 内部员工
  const staffs = await prisma.scm_storehouse.findMany();
  // 顾客
  const clients = await prisma.scm_shop_account.findMany();
  // 顾客门店
  const clientShops = await prisma.scm_shop.findMany();

  // await prisma.role_types.createMany({
  //   data: [
  //     { id: 1, type_name: 'STAFF' },
  //     { id: 2, type_name: 'CLIENT' },
  //     { id: 3, type_name: 'ZPSUPPLIER' },
  //     { id: 4, type_name: 'TPSUPPLIER' },
  //   ],
  // });

  console.log('开始添加统配供应商');
  await prisma.supplier.createMany({
    data: tpSupplierCompanies.map((company) => ({
      supplier_name: company.supplier_name,
      phone_number: company.phone_number!,
      serial_num: company.serial_num,
      supplier_type: 1,
      settlement: company.settlement,
      push_order: company.push_order,
      is_first: company.is_first,
      mail: company.mail,
    })),
  });

  console.log('开始添加直配供应商');
  await prisma.supplier.createMany({
    data: zpSupplierCompanyIds.map((company) => ({
      supplier_name: company.seller_name,
      phone_number: company.phone_number!,
      supplier_type: 2,
      settlement: 5,
      push_order: 5,
      is_first: 5,
      mail: company.mail,
    })),
  });

  console.log('开始转换TP供应商');
  for (const supplier of tpSuppliers) {
    const newTpSupplier = await prisma.users.upsert({
      where: {
        mobile: supplier.phone_number,
      },
      update: {
        user_name: supplier.name!,
      },
      create: {
        user_name: supplier.name!,
        mobile: supplier.phone_number!,
        password: supplier.password!,
      },
    });
    await prisma.user_role_types.upsert({
      where: {
        user_id_role_type_id: {
          user_id: newTpSupplier.id,
          role_type_id: 4,
        },
      },
      create: {
        user_id: newTpSupplier.id,
        role_type_id: 4,
      },
      update: {
        user_id: newTpSupplier.id,
      },
    });

    const supplierCompany = await prisma.supplier.findFirst({
      where: {
        phone_number: newTpSupplier.mobile,
      },
    });
    if (supplierCompany) {
      await prisma.user_supplier.upsert({
        where: {
          user_id_supplier_id: {
            user_id: newTpSupplier.id,
            supplier_id: supplierCompany.id,
          },
        },
        update: {
          supplier_id: supplierCompany.id,
        },
        create: {
          user_id: newTpSupplier.id,
          supplier_id: supplierCompany.id,
        },
      });
    }
  }

  console.log('开始转换直配供应商');
  for (const zpSupplier of zpSuppliers) {
    const newZpSupplier = await prisma.users.upsert({
      where: {
        mobile: zpSupplier.mobile!,
      },
      update: {
        user_name: zpSupplier.moniker!,
      },
      create: {
        user_name: zpSupplier.moniker!,
        mobile: zpSupplier.mobile!,
        password: zpSupplier.password!,
      },
    });

    await prisma.user_role_types.upsert({
      where: {
        user_id_role_type_id: {
          user_id: newZpSupplier.id,
          role_type_id: 3,
        },
      },
      create: {
        user_id: newZpSupplier.id,
        role_type_id: 3,
      },
      update: {
        user_id: newZpSupplier.id,
      },
    });

    const supplierCompany = await prisma.supplier.findFirst({
      where: {
        phone_number: newZpSupplier.mobile,
      },
    });
    if (supplierCompany) {
      await prisma.user_supplier.upsert({
        where: {
          user_id_supplier_id: {
            user_id: newZpSupplier.id,
            supplier_id: supplierCompany.id,
          },
        },
        create: {
          user_id: newZpSupplier.id,
          supplier_id: supplierCompany.id,
        },
        update: {
          user_id: newZpSupplier.id,
        },
      });
    }
  }

  console.log('开始转换内部员工');
  for (const staff of staffs) {
    const newStaff = await prisma.users.upsert({
      where: {
        mobile: staff.mobile!,
      },
      update: {
        user_name: staff.nickname!,
      },
      create: {
        user_name: staff.nickname,
        mobile: staff.mobile,
        password: staff.password,
      },
    });

    await prisma.user_role_types.upsert({
      where: {
        user_id_role_type_id: {
          user_id: newStaff.id,
          role_type_id: 1,
        },
      },
      create: {
        user_id: newStaff.id,
        role_type_id: 1,
      },
      update: {
        user_id: newStaff.id,
      },
    });
  }

  console.log('开始转换顾客');
  for (const client of clients) {
    const newClient = await prisma.users.upsert({
      where: {
        mobile: client.mobile!,
      },
      update: {
        user_name: client.moniker!,
      },
      create: {
        user_name: client.moniker!,
        mobile: client.mobile!,
        password: client.password!,
      },
    });

    const shops = await prisma.scm_shop_scm_shop_account.findMany({
      where: {
        scm_shop_account: {
          mobile: client.mobile!,
        },
      },
    });

    const clientShopIds = clientShops.map((shop) => shop.id);

    await prisma.user_client_shop.createMany({
      data: clientShopIds.map((id) => ({
        user_id: newClient.id,
        shop_id: id,
      })),
    });

    await prisma.user_role_types.upsert({
      where: {
        user_id_role_type_id: {
          user_id: newClient.id,
          role_type_id: 2,
        },
      },
      create: {
        user_id: newClient.id,
        role_type_id: 2,
      },
      update: {
        user_id: newClient.id,
      },
    });
  }
  process.exit(0);
};

run();
