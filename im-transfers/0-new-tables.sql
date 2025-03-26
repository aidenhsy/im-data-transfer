CREATE TABLE roles
(
    id         SERIAL PRIMARY KEY,
    role_name  VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT now()
);

INSERT INTO roles (id, role_name)
values (1, '系统管理员'),
       (2, '集团管理员'),
       (3, '品牌负责人'),
       (4, '店长'),
       (5, '厨师长'),
       (6, '订货员');


-- 角色表
COMMENT
    ON TABLE roles IS '角色标- 店长，品牌负责人。。。';
COMMENT
    ON COLUMN roles.id IS '角色表的主键。';
COMMENT
    ON COLUMN roles.role_name IS '具体角色的唯一名称（例如管理员、普通用户等）。';

CREATE TABLE user_roles
(
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    INT NOT NULL REFERENCES scm_shop_account (id),
    role_id    INT NOT NULL REFERENCES roles (id),
    UNIQUE (user_id, role_id),
    created_at TIMESTAMP        DEFAULT now()
);


-- 用户角色关联表
COMMENT
    ON TABLE user_roles IS '用于给用户分配具体角色的关联表。';
COMMENT
    ON COLUMN user_roles.id IS 'UUID主键，用于唯一标识用户与角色的关联。';
COMMENT
    ON COLUMN user_roles.user_id IS '分配角色的用户外键。';
COMMENT
    ON COLUMN user_roles.role_id IS '分配给用户的角色外键。';
COMMENT
    ON COLUMN user_roles.created_at IS '角色分配给用户时的时间戳。';

CREATE TABLE stock_category
(
    id   serial primary key,
    name varchar(50)
);

-- 入库分类表
COMMENT
    ON TABLE stock_category IS '餐厅入库物品分类表';
COMMENT
    ON COLUMN stock_category.id IS '分类ID，自增主键。';
COMMENT
    ON COLUMN stock_category.name IS '分类名称，如"食品原材料"、"员工餐"、"易耗品"等。';

INSERT INTO stock_category (id, name)
VALUES (1, '食材原材料'),
       (2, '员工餐'),
       (3, '易耗品'),
       (4, '酒水类'),
       (5, '打包和包装'),
       (7, '餐具类'),
       (8, '厨房设备与器具'),
       (9, '员工及办公用品 ');

ALTER TABLE scm_supply_plan_scm_goods
    ADD COLUMN stock_category_id INT references stock_category (id);

CREATE INDEX idx_scm_goods_category_id ON scm_goods (category_id);

UPDATE scm_supply_plan_scm_goods sg
SET stock_category_id = 1
FROM scm_goods g
WHERE sg.good_id = g.id
  AND g.category_id in
      (1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 26, 29, 30, 31, 33, 34, 37, 38, 42);

UPDATE scm_supply_plan_scm_goods sg
SET stock_category_id = 2
FROM scm_goods g
WHERE sg.good_id = g.id
  AND g.name like '%员工%';

UPDATE scm_supply_plan_scm_goods sg
SET stock_category_id = 3
FROM scm_goods g
WHERE sg.good_id = g.id
  AND g.category_id = 5;

UPDATE scm_supply_plan_scm_goods sg
SET stock_category_id = 4
FROM scm_goods g
WHERE sg.good_id = g.id
  AND g.category_id = 12;

UPDATE scm_supply_plan_scm_goods sg
SET stock_category_id = 5
FROM scm_goods g
WHERE sg.good_id = g.id
  AND g.name like '%打包%';

UPDATE scm_supply_plan_scm_goods sg
SET stock_category_id = 7
FROM scm_goods g
WHERE sg.good_id = g.id
  AND g.category_id in (36, 27);

UPDATE scm_supply_plan_scm_goods sg
SET stock_category_id = 8
FROM scm_goods g
WHERE sg.good_id = g.id
  AND g.category_id in (24, 35);

UPDATE scm_supply_plan_scm_goods sg
SET stock_category_id = 9
FROM scm_goods g
WHERE sg.good_id = g.id
  AND g.name LIKE '%服%';

UPDATE scm_supply_plan_scm_goods
SET is_enabled= false
where status = 0;

UPDATE scm_supply_plan_scm_goods
set is_enabled= true
where status = 1;

ALTER TABLE scm_supply_plan_scm_goods
    ADD COLUMN IF NOT EXISTS photo_url varchar;
ALTER TABLE scm_supply_plan_scm_goods
    ADD COLUMN IF NOT EXISTS order_unit_id varchar references scm_good_units (id);
ALTER TABLE scm_supply_plan_scm_goods
    ADD COLUMN IF NOT EXISTS base_unit_id varchar references scm_good_units (id);
ALTER TABLE scm_supply_plan_scm_goods
    ADD COLUMN IF NOT EXISTS count_unit_id varchar references scm_good_units (id);
ALTER TABLE scm_supply_plan_scm_goods
    ADD COLUMN IF NOT EXISTS goods_name varchar(100);
ALTER TABLE scm_supply_plan_scm_goods
    ADD COLUMN IF NOT EXISTS letter_name varchar;
ALTER TABLE scm_supply_plan_scm_goods
    ADD COLUMN IF NOT EXISTS category_id int;
ALTER TABLE scm_supply_plan_scm_goods
    ADD COLUMN IF NOT EXISTS category_name varchar;
ALTER TABLE scm_supply_plan_scm_goods
    ADD COLUMN IF NOT EXISTS sold_time varchar(50);

ALTER TABLE scm_good_units
    ADD COLUMN supply_plan_goods_id varchar REFERENCES scm_supply_plan_scm_goods (id) ON DELETE CASCADE;

ALTER TABLE scm_good_units
    ADD CONSTRAINT scm_good_ratio UNIQUE (supply_plan_goods_id, ratio_to_base);

ALTER TABLE st_daily_count_items
    ADD COLUMN unit_id varchar references scm_good_units (id);

UPDATE scm_supply_plan_scm_goods sg
SET goods_name = g.name
FROM scm_goods g
WHERE sg.good_id = g.id;

ALTER TABLE st_ingredient
    ADD COLUMN IF NOT EXISTS good_unit_id varchar references scm_good_units (id);

ALTER TABLE st_sales_plan
    ADD COLUMN supply_plan_id INT references scm_supply_plan (id);
ALTER TABLE scm_shop_account
    ADD COLUMN created_at timestamp default now();
ALTER TABLE scm_shop_account
    ADD COLUMN big_org_id int references big_org (id);
ALTER TABLE scm_shop
    ADD COLUMN big_org_id int references big_org (id);
ALTER TABLE scm_good_units
    ALTER COLUMN goods_id DROP NOT NULL;

INSERT INTO user_roles (user_id, role_id)
VALUES (767, 2);

update scm_shop_account
set big_org_id=1;

UPDATE scm_shop AS s
SET big_org_id = 1
FROM scm_shop_brand AS b
WHERE s.brand_id = b.id
  AND b.big_org_id = 1;

ALTER TABLE big_org
    ADD COLUMN access_id varchar;
ALTER TABLE big_org
    ADD COLUMN access_secret varchar;

UPDATE big_org
set access_id='org_6xF4g8V2T9s1N2hP',
    access_secret='s9Gk3#tB@5fV!2Lr9PqY7cWxR1z0aDjE'
where id = 1;

INSERT INTO big_org (id, name, access_id, access_secret)
values (4, 'SCM', 'org_p3H9kL6wZ8vY5qR2', 'm8Yv$T6g%4Kj#dL9fHs3@pN1bZx0wVqA');

alter table scm_order_details
    add column spg_id varchar references scm_supply_plan_scm_goods (id);
alter table scm_order_details
    add column pg_id int;
alter table scm_order_details add column reference_id varchar;

drop table if exists scm_store_picking_supplyitems;
drop table if exists st_inventory_allocation;
drop table if exists scm_ent_fifo_allocation;
drop table if exists scm_goods_outbound;

DELETE FROM scm_order_details d
USING scm_order o
WHERE d.order_id = o.id
  AND o.delivery_time < '2025-03-01';

DELETE FROM scm_order where delivery_time < '2025-03-01';

update scm_order_details set reference_id = id;

alter table scm_order_details drop column if exists stock_order_no;
alter table  scm_order_details drop column if exists small_unit;
alter table scm_order_details drop column if exists hide_price;
alter table scm_order_details drop column if exists yu_price;
alter table scm_order_details drop column if exists item_total;
alter table scm_order_details drop column if exists remaining_quantity;

alter table scm_order add column reference_id varchar;
update scm_order set reference_id=id;
alter table scm_order drop column if exists order_no;
alter table scm_order drop column if exists admin_id;
alter table scm_order drop column if exists locking;
alter table scm_order drop column if exists automatic;

alter table scm_order add supplier_org_id int references big_org(id);
alter table scm_order_details add supplier_org_id int references big_org(id);

update scm_order set supplier_org_id=4;
update scm_order_details set supplier_org_id=4;

alter table st_inventory_detail add column spg_id varchar references scm_supply_plan_scm_goods(id);

alter table st_kitchen_department_goods add column spg_id varchar references scm_supply_plan_scm_goods(id);

select count(*) from st_kitchen_department_goods where spg_id is null;

alter table scm_supply_plan_scm_goods add column reference_id varchar;

