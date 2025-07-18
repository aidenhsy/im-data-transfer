import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const run = async () => {
  console.log(dayjs().format('YYYY-MM-DD HH:mm:ss'));
  console.log(dayjs().utc().format('YYYY-MM-DD HH:mm:ss'));
  console.log(dayjs().utcOffset(0).format('YYYY-MM-DD HH:mm:ss'));
};

run();
