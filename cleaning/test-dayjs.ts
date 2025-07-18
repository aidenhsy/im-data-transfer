import 'reflect-metadata';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { PrismaClient as imProDev } from '../prisma/clients/im-procurement-dev';
import { getCurrentChinaTime } from '@saihu/common';

dayjs.extend(utc);
dayjs.extend(timezone);

const prisma = new imProDev();

const run = async () => {
  const chinaTime = dayjs().tz('Asia/Shanghai');

  // Option 2: Format China time and treat as UTC
  const chinaDateString = chinaTime.format('YYYY-MM-DD HH:mm:ss.SSS');
  const chinaDate = new Date(chinaDateString + 'Z'); // Add Z to treat as UTC

  console.log('China time:', chinaTime.format('YYYY-MM-DD HH:mm:ss.SSS'));
  console.log('Formatted string:', chinaDateString);
  console.log('Storing as:', chinaDate.toISOString());

  await prisma.test_time.create({
    data: {
      id: 4,
      test_time: getCurrentChinaTime(),
    },
  });
};

run().catch((e) => {
  console.error('❌ Error:', e);
});
