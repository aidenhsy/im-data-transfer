import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const cities = [3, 21, 23, 26, 22];

  const goodNames = [
    '美临野山椒700g（外部）',
    '调-I+G500g（外部）',
    '调-803油豆皮 （50袋）（外部）',
    '8厘米封膜',
    '98-16oz饮品杯',
    '98-16oz饮品杯盖',
    '川鼎鲜五仁酱',
    '番茄汤底',
    '黄金豆2.5kg',
    '金葵麻辣油',
    '金龙鱼花椒油',
    '金龙鱼精酿陈醋',
    '津茗客糖浆风味饮料',
    '妈妈抱鹌鹑蛋',
    '沁域茶蜂荔枝酸角汁',
    '沁域茶蜂山茶花乌龙浓缩液',
    '山椒味老坛酸菜调料',
    '速品奶基地',
    '挑线肉夹馍纸袋',
    '挑线一次性围裙',
    '通用保鲜膜',
    '心鸿亿水晶蒜',
    '宜可净清洁剂',
    '艺康重污清洁剂',
    '成都冒菜味酱风味',
    '老坛酸辣金汤',
    '挑线无糖薄荷糖',
    '热敏纸8060',
    '挑线无纺布袋',
    '圆碗餐盒350ml',
    '流心蛋',
    '干米线',
    '付餐区灰色毛巾',
    '卫生区紫色毛巾',
    '白色通版毛巾',
    '绿色通版毛巾',
    '蓝色通版毛巾',
    '棕色通版毛巾',
    '前厅热敏纸57*35',
    '白桃乌龙茶茶包',
    '外卖安全扣',
    '油泼拌粉酱汁粘贴',
    '圆形防漏纸',
    '挑线胶带',
    '大口瓶50CC(外部）',
    '单杯打包袋',
    '可伸缩一次性吸管',
    '挑线餐巾纸',
    '挑线库杯',
    '挑线塑料袋',
    '挑线标签纸',
    '一次性筷子',
    '挑线餐盒1150',
    '挑线餐盒750ml',
    '挑线套装筷子',
    '一次性勺子',
    '精酿辣椒油',
    '泰椒酱',
    '挑线潮州酸菜',
    '鲜脆黄瓜条',
    '中式鲜萝卜条',
    '北方火腿片',
    '皇家小虎小胖子油条',
    '火锅味土豆泥',
    '冷冻裙带菜叶',
    '熟制藤椒鸡肉',
    '挑线牛肋条',
    '五牛荟枣牛肉丸',
    '油泼汁',
    '鱼籽豆腐',
    '原味木耳',
    '中雪油炸糕',
    '蹦蹦鱼免浆巴沙鱼片',
    '调味木耳',
    '老潼关千层饼',
    '融厨拉丝胖糍粑',
    '寺岛拉面',
    '挑线黄酱',
    '前槽叉烧肉',
    '五花叉烧肉',
    '挑线辣肉酱',
    '挑线五香肉丁',
    '酸豆角肉酱',
    '挑线肉酱',
  ];

  const pricings = await database.scmPricingProd.scm_good_pricing.findMany({
    where: {
      version: '20250916',
      city_id: 14,
      client_tier_id: 3,
    },
    include: {
      scm_goods: true,
    },
  });

  const goodPricings = pricings.filter((pricing) =>
    goodNames.includes(pricing.scm_goods.name)
  );
  console.log(goodPricings.length);

  for (const city of cities) {
    for (const item of goodPricings) {
      const existPricing =
        await database.scmPricingProd.scm_good_pricing.findFirst({
          where: {
            goods_id: item.goods_id,
            client_tier_id: item.client_tier_id,
            city_id: city,
          },
        });
      if (existPricing) {
        continue;
      }
      console.log(
        `Creating pricing for city ${city} and goods ${item.goods_id}`
      );

      await database.scmPricingProd.scm_good_pricing.create({
        data: {
          goods_id: item.goods_id,
          good_unit_id: item.good_unit_id,
          client_tier_id: item.client_tier_id,
          pricing_strategy: item.pricing_strategy,
          profit_margin: item.profit_margin,
          sale_price: item.sale_price,
          is_active: item.is_active,
          locked_after: item.locked_after,
          version: item.version,
          city_id: city,
          cut_off_time: item.cut_off_time,
          weighted_average_cost: item.weighted_average_cost,
        },
      });
    }
  }

  process.exit(0);
};

run();
