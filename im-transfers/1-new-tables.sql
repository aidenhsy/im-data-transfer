CREATE TABLE roles
(
    id        SERIAL PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP   DEFAULT now()
);

INSERT INTO roles (id, role_name)
values (1, '系统管理员'),
       (2, '集团管理员'),
       (3, '品牌负责人'),
       (4, '店长'),
       (5, '厨师长'),
       (6, '订货员');


select tc_shop_id from scm_shop where id=30;
-- 角色表
COMMENT ON TABLE roles IS '角色标- 店长，品牌负责人。。。';
COMMENT ON COLUMN roles.id IS '角色表的主键。';
COMMENT ON COLUMN roles.role_name IS '具体角色的唯一名称（例如管理员、普通用户等）。';

CREATE TABLE user_roles
(
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    INT NOT NULL REFERENCES scm_shop_account (id),
    role_id    INT NOT NULL REFERENCES roles (id),
    UNIQUE (user_id, role_id),
    created_at TIMESTAMP        DEFAULT now()
);


-- 用户角色关联表
COMMENT ON TABLE user_roles IS '用于给用户分配具体角色的关联表。';
COMMENT ON COLUMN user_roles.id IS 'UUID主键，用于唯一标识用户与角色的关联。';
COMMENT ON COLUMN user_roles.user_id IS '分配角色的用户外键。';
COMMENT ON COLUMN user_roles.role_id IS '分配给用户的角色外键。';
COMMENT ON COLUMN user_roles.created_at IS '角色分配给用户时的时间戳。';


UPDATE scm_supply_plan_scm_goods SET is_enabled=false where status=0;
UPDATE scm_supply_plan_scm_goods set is_enabled=true where status=1;
ALTER TABLE scm_supply_plan_scm_goods DROP COLUMN IF EXISTS status;
ALTER TABLE scm_supply_plan_scm_goods ADD COLUMN IF NOT EXISTS order_unit varchar(20);
ALTER TABLE scm_supply_plan_scm_goods ADD COLUMN IF NOT EXISTS order_unit_id varchar;
ALTER TABLE scm_supply_plan_scm_goods ADD COLUMN IF NOT EXISTS base_unit varchar(20);
ALTER TABLE scm_supply_plan_scm_goods ADD COLUMN IF NOT EXISTS base_unit_id varchar;
ALTER TABLE scm_supply_plan_scm_goods ADD COLUMN IF NOT EXISTS order_to_base_ratio numeric(12,2);
ALTER TABLE scm_supply_plan_scm_goods ADD COLUMN IF NOT EXISTS goods_name varchar(100);

UPDATE scm_supply_plan_scm_goods sg
SET goods_name = g.name
FROM scm_goods g
WHERE sg.good_id = g.id;

ALTER TABLE st_ingredient ADD COLUMN good_unit_id varchar references scm_good_units(id);

UPDATE st_ingredient i
SET good_unit_id = g.base_good_unit_id
FROM scm_goods g
WHERE i.goods_id = g.id;

UPDATE scm_supply_plan_scm_goods sg
SET order_to_base_ratio = u.ratio_to_base
FROM scm_goods g
JOIN scm_good_units u on g.order_good_unit_id = u.id
WHERE sg.good_id = g.id;

ALTER TABLE scm_good_units ADD COLUMN supply_plan_goods_id varchar references scm_supply_plan_scm_goods(id);

ALTER TABLE scm_supply_plan_scm_goods DROP CONSTRAINT IF EXISTS scm_supply_plan_scm_goods_good_id_fkey12;
ALTER TABLE scm_supply_plan_scm_goods DROP CONSTRAINT IF EXISTS scm_supply_plan_scm_goods_good_unit_id_fkey92;

ALTER TABLE st_sales_plan ADD COLUMN supply_plan_id INT references scm_supply_plan(id);
ALTER TABLE scm_shop_account ADD COLUMN created_at timestamp default now();
ALTER TABLE scm_good_units ALTER COLUMN goods_id DROP NOT NULL;