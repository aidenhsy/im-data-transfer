alter table scm_good_units drop constraint scm_supply_plan_scm_goods_order_unit_id_fkey;
alter table scm_good_units drop column goods_id;
alter table scm_supply_plan_scm_goods drop constraint scm_supply_plan_scm_goods_good_unit_id_fkey92;

alter table scm_goods drop column count_good_unit_id;
alter table scm_goods drop column base_unit_id;
alter table scm_goods drop column purchase_good_unit_id;
alter table scm_goods drop column order_good_unit_id;

drop table scm_good_pricing;

delete from scm_good_units where scm_good_units.supply_plan_goods_id is null;