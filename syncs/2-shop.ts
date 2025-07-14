import { PrismaClient as IMProcurement } from '../prisma/clients/im-procurement-prod';
import { PrismaClient as IMBasicData } from '../prisma/clients/im-basic-data-prod';

const run = async () => {
  const imProcurement = new IMProcurement();
  const imBasicData = new IMBasicData();

  const shops = await imProcurement.scm_shop.findMany();

  for (const shop of shops) {
    const { client_tier_id, ...rest } = shop;
    await imBasicData.scm_shop.upsert({
      where: { id: shop.id },
      update: {
        ...rest,
      },
      create: {
        ...rest,
        open_hours: [
          {
            weekday: '星期一',
            open_hour: '09:00',
            close_hour: '21:00',
            day_of_week: 1,
          },
          {
            weekday: '星期二',
            open_hour: '09:00',
            close_hour: '21:00',
            day_of_week: 2,
          },
          {
            weekday: '星期三',
            open_hour: '09:00',
            close_hour: '21:00',
            day_of_week: 3,
          },
          {
            weekday: '星期四',
            open_hour: '09:00',
            close_hour: '21:00',
            day_of_week: 4,
          },
          {
            weekday: '星期五',
            open_hour: '09:00',
            close_hour: '21:00',
            day_of_week: 5,
          },
          {
            weekday: '星期六',
            open_hour: '09:00',
            close_hour: '21:00',
            day_of_week: 6,
          },
          {
            weekday: '星期日',
            open_hour: '09:00',
            close_hour: '21:00',
            day_of_week: 7,
          },
        ],
      },
    });
  }
};

run();
