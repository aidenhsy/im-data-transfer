import { PrismaClient as Procurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Basic } from './prisma/clients/scm-prod';
import { PrismaClient as Order } from './prisma/clients/scm-order-prod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const run = async () => {
  const procurement = new Procurement();
  const basic = new Basic();
  const order = new Order();

  const basicOrderDetails = await basic.scm_order_details.findMany({
    where: {
      reference_id: {
        not: null,
      },
    },
    include: {
      scm_order: true,
    },
  });

  for (const basicDetail of basicOrderDetails) {
    const dateTime = dayjs(basicDetail.scm_order?.create_time).utcOffset(0);

    // If time is before 11:30, use the previous day
    const createDate =
      dateTime.hour() < 11 || (dateTime.hour() === 11 && dateTime.minute() < 30)
        ? dateTime.subtract(1, 'day').format('YYYYMMDD')
        : dateTime.format('YYYYMMDD');

    const referenceDate = basicDetail.reference_id
      ?.split('-')
      .slice(1)
      .join('-');

    if (createDate !== referenceDate) {
      console.log(
        `reference_id: ${
          basicDetail.reference_id
        } \n create_date: ${createDate} \n id: ${
          basicDetail.id
        } \n create_time: ${basicDetail.scm_order?.create_time?.toUTCString()}`
      );
      console.log('--------------------------------');
    }
  }
};

run();
