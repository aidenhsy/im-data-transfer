import { PrismaClient as ProcuremnetClient } from './prisma/clients/im-procurement';

interface UnassignedItem {
  brand_id: number;
  brand_name: string;
  item_id: number;
  item_name: string;
  city_id: number;
  city_name: string;
  supply_plan_item_id: number;
  supply_plan_id: number;
  supplier_item_id: number | null;
  supplier_item_status: number | null;
  assignment_status: string;
}

const run = async () => {
  const pClient = new ProcuremnetClient();
  const results = await pClient.$queryRaw<UnassignedItem[]>`
      WITH brand_supply_plans AS (
          -- Get supply plan assignments for brands, including name-based matching
          SELECT
              ssb.id as brand_id,
              ssb.brand_name,
              -- Use explicit supply_plan_id if available, otherwise match by name
              COALESCE(ssb.supply_plan_id, ssp_name.id) as supply_plan_id
          FROM scm_shop_brand ssb
          LEFT JOIN scm_supply_plan ssp_name
              ON ssb.supply_plan_id IS NULL
              AND ssp_name.name LIKE '%' || ssb.brand_name || '%'
              AND NOT ssp_name.name LIKE '%(%'  -- Exclude location-specific plans like "杭小点（沈阳）"
          WHERE ssb.is_enabled = true
            AND (ssb.supply_plan_id IS NOT NULL OR ssp_name.id IS NOT NULL)
      ),
      brand_city_list AS (
          -- Get all cities for brands that have supply plans
          SELECT DISTINCT
              bc.brand_id,
              bc.city_id,
              c.name as city_name,
              bsp.brand_name,
              bsp.supply_plan_id
          FROM brand_cities bc
          JOIN cities c ON bc.city_id = c.id
          JOIN brand_supply_plans bsp ON bc.brand_id = bsp.brand_id
      )
      SELECT
          bcl.brand_id,
          bcl.brand_name,
          i.id as item_id,
          i.name as item_name,
          bcl.city_id,
          bcl.city_name,
          spi.id as supply_plan_item_id,
          spi.supply_plan_id,
          pisg.supplier_item_id,
          si.status as supplier_item_status,
          CASE
              WHEN pisg.plan_item_id IS NULL THEN '未分配'
              WHEN si.status = 0 THEN '已分配但供应商已禁用'
              ELSE '其他'
          END as assignment_status
      FROM brand_city_list bcl
      JOIN supply_plan_items spi ON bcl.supply_plan_id = spi.supply_plan_id
      JOIN generic_items i ON spi.item_id = i.id
      LEFT JOIN plan_item_supplier_good pisg
          ON spi.id = pisg.plan_item_id
          AND pisg.city_id = bcl.city_id
      LEFT JOIN supplier_items si
          ON pisg.supplier_item_id = si.id
      WHERE pisg.plan_item_id IS NULL  -- Not assigned
         OR si.status = 0              -- Or assigned but supplier item is disabled
      ORDER BY bcl.brand_id, i.name, bcl.city_name
    `;
  console.log(results);
};

run();
