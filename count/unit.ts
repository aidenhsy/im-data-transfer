import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const startDate = new Date('2026-01-06');
  const endDate = new Date('2026-12-31');

  for (
    let currentDate = new Date(startDate);
    currentDate <= endDate;
    currentDate.setDate(currentDate.getDate() + 1)
  ) {
    const dateStr = currentDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay(); // Convert Sunday from 0 to 7
    const isWeekend = dayOfWeek === 6 || dayOfWeek === 7; // Saturday or Sunday
    const isWorking = isWeekend ? 0 : 1; // Working days are Monday-Friday

    await database.scmProd.day_info.upsert({
      where: {
        id: dateStr,
      },
      update: {},
      create: {
        id: dateStr,
        is_working: isWorking,
        is_holiday: 0,
        day_of_week: dayOfWeek,
        date: new Date(dateStr),
      },
    });

    console.log(`Created day_info for ${dateStr} (Day ${dayOfWeek})`);
  }

  console.log('All dates for 2026 created successfully!');
};

run();
