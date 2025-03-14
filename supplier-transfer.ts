// transfer scm_supplier_person and scm_supplier_account to supplier

import { PrismaClient } from '@prisma/client';

const run = async () => {
  const prisma = new PrismaClient();
  // scm_supplier_person scm_seller_account scm_storehouse => users
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

  // init role_types 
  //INSERT INTO role_types (id, type_name) VALUES (1, 'CLIENT');
  //INSERT INTO role_types (id, type_name) VALUES (2, 'STAFF');
  //INSERT INTO role_types (id, type_name) VALUES (3, 'ZPSUPPLIER');
  //INSERT INTO role_types (id, type_name) VALUES (4, 'TPSUPPLIER');

  await prisma.role_types.createMany({
    data: [
      { id: 1, type_name: 'CLIENT' },
      { id: 2, type_name: 'STAFF' },
      { id: 3, type_name: 'ZPSUPPLIER' },
      { id: 4, type_name: 'TPSUPPLIER' },
    ],
  });

  // init roles
  //INSERT INTO roles (id, role_name, role_type_id) VALUES (1, '客户', 1);
  //INSERT INTO roles (id, role_name, role_type_id) VALUES (2, '员工', 2);
  //INSERT INTO roles (id, role_name, role_type_id) VALUES (3, '直配供应商', 3);
  //INSERT INTO roles (id, role_name, role_type_id) VALUES (4, '统配供应商', 4);

  await prisma.roles.createMany({
    data: [
      { id: 1, role_name: '客户', role_type_id: 1 },
      { id: 2, role_name: '员工', role_type_id: 2 },
      { id: 3, role_name: '直配供应商', role_type_id: 3 },
      { id: 4, role_name: '统配供应商', role_type_id: 4 },
    ],
  });

  // 导入员工权限 
  // INSERT INTO  user_role_types (user_id,role_type_id)
  // SELECT u.id, 2 FROM 
  // scm_storehouse ss
  // LEFT JOIN users u ON u.mobile = ss.mobile ORDER BY u.id;
  const staffWithRole = await prisma.users.findMany({
    where: {
      mobile: {
        in: (await prisma.scm_storehouse.findMany({
          select: { mobile: true },
        })).map(storehouse => storehouse.mobile)
      }
    },
    select: { id: true }
  });

  // 插入 user_role_types
  await prisma.user_role_types.createMany({
    data: staffWithRole.map(user => ({
      user_id: user.id,
      role_type_id: 2
    }))
  });
  

  // 导入直配供应商权限
  // INSERT INTO  user_role_types (user_id,role_type_id)
  // SELECT u.id, 3 FROM 
  // scm_seller_account sa
  // LEFT JOIN users u ON u.mobile = sa.mobile ORDER BY u.id;
  const zpSUPPLIERRole = await prisma.users.findMany({
    where: {
      mobile: {
        in: (await prisma.scm_seller_account.findMany({
          select: { mobile: true },
        })).map(seller => seller.mobile).filter((mobile): mobile is string => mobile !== null)
      }
    },
    select: { id: true }
  });

  // 插入 user_role_types 
  await prisma.user_role_types.createMany({
    data: zpSUPPLIERRole.map(user => ({
      user_id: user.id,
      role_type_id: 3
    }))
  });
            
  // 导入统配供应商权限
  // INSERT INTO  user_role_types (user_id,role_type_id)
  // SELECT u.id, 4 FROM 
  // scm_supplier_person sa
  // LEFT JOIN users u ON u.mobile = sa.phone_number ORDER BY u.id;
  const tpSUPPLIERRole = await prisma.users.findMany({    
    where: {
      mobile: {
        in: (await prisma.scm_supplier_person.findMany({
          select: { phone_number: true },
        })).map(supplier => supplier.phone_number).filter((mobile): mobile is string => mobile !== null)
      }
    },
    select: { id: true }
  });

  // 插入 user_role_types 
  await prisma.user_role_types.createMany({
    data: tpSUPPLIERRole.map(user => ({
      user_id: user.id,
      role_type_id: 4
    }))
  }); 

// 导入统配供应商
//   INSERT INTO supplier_details (
//     user_id,
//     serial_num,
//     settlement,
//     push_order,
//     is_first,
//     mail
// )
// SELECT
//     u.id AS user_id,          -- 从 users 表获取用户 ID
//     ss.serial_num,            -- 从 scm_supplier 表获取序列号
//     ss.settlement,            -- 从 scm_supplier 表获取结算信息
//     ss.push_order,            -- 从 scm_supplier 表获取推送订单信息
//     ss.is_first,              -- 从 scm_supplier 表获取是否首次标记
//     ss.mail                   -- 从 scm_supplier 表获取邮箱
// FROM
//     scm_supplier_person ssp   -- 主表：scm_supplier_person
// LEFT JOIN
//     scm_supplier ss           -- 关联 scm_supplier 表
//     ON ss.id = ssp.supplier_id
// LEFT JOIN
//     users u                   -- 关联 users 表
//     ON u.mobile = ssp.phone_number
  // 第一步：查询 scm_supplier_person 和相关数据
  const supplierPersonData = await prisma.scm_supplier_person.findMany({
    select: {
      phone_number: true,
      supplier_id: true,
      scm_supplier: {
        select: {
          serial_num: true,
          settlement: true,
          push_order: true,
          is_first: true,
          mail: true,
        },
      },
    },
  });

  // 第二步：查询所有用户信息（匹配手机号）
  const usersMap = await prisma.users.findMany({
    select: {
      id: true,
      mobile: true,
    },
  });

  // 第三步：格式化数据并映射手机号到 user_id
  const dataToInsert = supplierPersonData.map((ssp) => {
    const userMap = usersMap.find((u) => u.mobile === ssp.phone_number); // 匹配手机号
    if (userMap) {
      return {
        user_id: userMap.id,
        serial_num: ssp.scm_supplier?.serial_num,
        settlement: ssp.scm_supplier?.settlement,
        push_order: ssp.scm_supplier?.push_order,
        is_first: ssp.scm_supplier?.is_first,
        mail: ssp.scm_supplier?.mail,
      };
    }
    return null; // 如果找不到匹配的用户，返回 null
  }).filter(item => item !== null); // 过滤掉没有匹配到用户的记录

  // 第四步：批量插入数据到 supplier_details 表
  if (dataToInsert.length > 0) {
    await prisma.supplier_details.createMany({
      data: dataToInsert,
    });
    console.log('scm_supplier_person->supplier_details数据插入成功');
  } else {
    console.log('scm_supplier_person->supplier_details没有需要插入的数据');
  }

// -- 插入数据到 supplier_details 表
// INSERT INTO supplier_details (
//     user_id,
//     mail
// )
// SELECT
//     u.id AS user_id,          -- 从 users 表获取用户 ID
//     ss.mail                   -- 从 scm_seller 表获取邮箱
// FROM
//     scm_seller_account ssa  -- 主表：scm_seller_account
// LEFT JOIN
//     scm_seller ss           -- 关联 scm_seller 表
//     ON ss.id = ssa.seller_id
// LEFT JOIN
//     users u                   -- 关联 users 表
//     ON u.mobile = ssa.mobile
  // 第一步：查询 scm_seller_account 和相关数据
  const sellerAccountData = await prisma.scm_seller_account.findMany({
    select: {
      mobile: true,
      seller_id: true,
    },
  });

  // 第二步：查询所有用户信息（匹配手机号）
  const sellerUsersMap = await prisma.users.findMany({
    select: {
      id: true,
      mobile: true,
    },
  });

  // Fetch scm_seller data separately
  const sellerData = await prisma.scm_seller.findMany({
    where: {
      id: { in: sellerAccountData.map(ssa => ssa.seller_id) },
    },
    select: {
      id: true,
      mail: true,
    },
  });

  // Create a map of seller_id to mail
  const sellerMailMap = new Map(sellerData.map(seller => [seller.id, seller.mail]));

  // Format data and map phone number to user_id
  const sellerDataToInsert = sellerAccountData.map((ssa) => {
    const userMap = sellerUsersMap.find((u) => u.mobile === ssa.mobile); // Match phone number
    const mail = sellerMailMap.get(ssa.seller_id); // Get mail from seller data
    if (userMap && mail) {
      return {
        user_id: userMap.id,
        mail: mail,
      };
    }
    return null; // Return null if no matching user or mail
  }).filter(item => item !== null); // Filter out records without matches

  // Insert data into supplier_details table
  if (sellerDataToInsert.length > 0) {
    await prisma.supplier_details.createMany({
      data: sellerDataToInsert,
      skipDuplicates: true,  // 跳过重复的 user_id
    });
    console.log('scm_seller_account->supplier_details data inserted successfully');
  } else {
    console.log('No data to insert from scm_seller_account->supplier_details');
  }

};

run();
