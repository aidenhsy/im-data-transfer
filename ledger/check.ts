import { getCurrentChinaTime } from '@saihu/common';

const run = async () => {
  const currentTime = getCurrentChinaTime();
  console.log(currentTime);
};

run();
