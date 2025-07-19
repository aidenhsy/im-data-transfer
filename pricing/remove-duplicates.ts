import { PrismaClient as ScmPricing } from '../prisma/clients/scm-pricing-prod';

// Define the interface for the query result
interface DuplicateGoodPricing {
  client_tier_id: number;
  city_id: number;
  goods_id: number;
  version: string;
  count: bigint; // COUNT(*) returns bigint in raw queries
}

const run = async () => {
  const scmPricing = new ScmPricing();

  const data = await scmPricing.$queryRaw<DuplicateGoodPricing[]>`
  SELECT client_tier_id, city_id, goods_id, version, COUNT(*) as count
FROM scm_good_pricing
GROUP BY client_tier_id, city_id, goods_id, version
HAVING COUNT(*) > 1 and version='20250719';`;

  for (const item of data) {
    const record = await scmPricing.scm_good_pricing.findFirst({
      where: {
        client_tier_id: item.client_tier_id,
        city_id: item.city_id,
        goods_id: item.goods_id,
        version: item.version,
      },
    });
    if (!record) {
      console.log(
        `Record not found: ${item.client_tier_id} ${item.city_id} ${item.goods_id} ${item.version}`
      );
      continue;
    }
    await scmPricing.scm_good_pricing.delete({
      where: {
        id: record.id,
      },
    });
  }
};

run();
