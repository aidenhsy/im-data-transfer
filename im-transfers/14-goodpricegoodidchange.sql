alter table scm_supply_plan_scm_goods
    rename column good_id to good_price_id;

select count(*) from scm_supply_plan_scm_goods where reference_id is null;


alter table scm_supply_plan_scm_goods drop constraint if exists scm_supply_plan_scm_goods_good_id_fkey12;
alter table scm_supply_plan_scm_goods drop  constraint  if exists unique_supply_plan_goods;
alter table scm_supply_plan_scm_goods drop  constraint  if exists constraint_name;


select * from scm_supply_plan_scm_goods where good_unit_id is null;
select * from scm_good_units;

-- First, drop the existing foreign key constraint from scm_good_units to scm_supply_plan_scm_goods
ALTER TABLE scm_good_units
DROP CONSTRAINT IF EXISTS scm_good_units_supply_plan_goods_id_fkey;

-- Then add the new constraint with CASCADE delete
ALTER TABLE scm_good_units
ADD CONSTRAINT scm_good_units_supply_plan_goods_id_fkey
FOREIGN KEY (supply_plan_goods_id)
REFERENCES scm_supply_plan_scm_goods(id)
ON DELETE CASCADE;

-- Make sure the constraint in the opposite direction (if it exists) has RESTRICT or NO ACTION
-- First, find the name of the constraint
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'scm_supply_plan_scm_goods'
AND constraint_type = 'FOREIGN KEY';

-- Then modify it (replace 'constraint_name_here' with the actual constraint name)
-- If the constraint references scm_good_units.id:
ALTER TABLE scm_supply_plan_scm_goods
DROP CONSTRAINT IF EXISTS scm_supply_plan_scm_goods_base_unit_id_fkey;

ALTER TABLE scm_supply_plan_scm_goods
ADD CONSTRAINT scm_supply_plan_scm_goods_base_unit_id_fkey
FOREIGN KEY (base_unit_id)
REFERENCES scm_good_units(id)
ON DELETE RESTRICT;

-- Drop the existing constraint
ALTER TABLE st_ingredient
DROP CONSTRAINT IF EXISTS st_ingredient_supply_plan_good_id_fkey93;

-- Add the new constraint with CASCADE delete
ALTER TABLE st_ingredient
ADD CONSTRAINT st_ingredient_supply_plan_good_id_fkey93
FOREIGN KEY (supply_plan_good_id)
REFERENCES scm_supply_plan_scm_goods(id)
ON DELETE CASCADE;