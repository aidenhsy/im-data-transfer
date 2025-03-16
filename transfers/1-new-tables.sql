CREATE TABLE users
(
    id         SERIAL PRIMARY KEY,
    user_name  varchar(50)  NOT NULL,
    mobile     varchar(50)  NOT NULL UNIQUE,
    password   varchar(255) NOT NULL,
    created_at timestamp default now()
);
-- 用户表
COMMENT ON TABLE users IS '包含用户基本账户信息的表。';
COMMENT ON COLUMN users.id IS '用户表的主键。';
COMMENT ON COLUMN users.user_name IS '用户的名称。';
COMMENT ON COLUMN users.mobile IS '用户的手机号码。';
COMMENT ON COLUMN users.password IS '用于用户认证的加密密码。';
COMMENT ON COLUMN users.created_at IS '用户记录创建时的时间戳。';

CREATE TABLE role_types
(
    id        SERIAL PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL UNIQUE -- e.g. "CLIENT", "SUPPLIER", "STAFF", etc.
);
-- 角色类型表
COMMENT ON TABLE role_types IS '对角色进行分类的表，例如客户、供应商、员工等。';
COMMENT ON COLUMN role_types.id IS '角色类型表的主键。';
COMMENT ON COLUMN role_types.type_name IS '唯一标识角色类型的名称，例如客户、供应商、员工等。';

CREATE TABLE user_role_types
(
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      INT NOT NULL REFERENCES users (id),
    role_type_id INT NOT NULL REFERENCES role_types (id),
    UNIQUE (user_id, role_type_id)
);
-- 用户角色类型关联表
COMMENT ON TABLE user_role_types IS '关联用户与角色类型的表。';
COMMENT ON COLUMN user_role_types.id IS 'UUID主键，唯一标识关联记录。';
COMMENT ON COLUMN user_role_types.user_id IS '关联的用户的外键。';
COMMENT ON COLUMN user_role_types.role_type_id IS '关联的角色类型的外键。';

CREATE TABLE roles
(
    id           SERIAL PRIMARY KEY,
    role_name    VARCHAR(100) NOT NULL UNIQUE,
    role_type_id INT          NOT NULL REFERENCES role_types (id)
);
-- 角色表
COMMENT ON TABLE roles IS '定义每个角色类型下具体的角色';
COMMENT ON COLUMN roles.id IS '角色表的主键。';
COMMENT ON COLUMN roles.role_name IS '具体角色的唯一名称（例如管理员、普通用户等）。';
COMMENT ON COLUMN roles.role_type_id IS '链接角色到所属角色类型的外键。';

CREATE TABLE user_roles
(
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    INT NOT NULL REFERENCES users (id),
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

create table permissions
(
    id           serial primary key,
    name         varchar(100) not null unique,
    display_name varchar(255),
    created_at   timestamp default now()
);
-- 权限表
COMMENT ON TABLE permissions IS '定义基于角色的访问控制的具体权限。';
COMMENT ON COLUMN permissions.id IS '权限表的主键。';
COMMENT ON COLUMN permissions.name IS '权限的唯一内部标识符。';
COMMENT ON COLUMN permissions.display_name IS '权限的可读名称或描述，用于UI显示。';
COMMENT ON COLUMN permissions.created_at IS '权限创建时的时间戳。';

create table role_permissions
(
    id            uuid      default uuid_generate_v4() primary key,
    role_id       integer not null references roles,
    permission_id integer not null references permissions,
    created_at    timestamp default now(),
    unique (role_id, permission_id)
);
-- 角色权限关联表
COMMENT ON TABLE role_permissions IS '将具体权限与角色关联，实现基于角色的访问控制。';
COMMENT ON COLUMN role_permissions.id IS 'UUID主键，唯一标识角色权限的关联记录。';
COMMENT ON COLUMN role_permissions.role_id IS '被分配权限的角色外键。';
COMMENT ON COLUMN role_permissions.permission_id IS '与角色关联的权限外键。';
COMMENT ON COLUMN role_permissions.created_at IS '权限被分配给角色时的时间戳。';

CREATE TABLE supplier
(
    id         SERIAL PRIMARY KEY,
    supplier_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    serial_num VARCHAR(100),
    supplier_type INT,
    settlement INT,
    push_order INT,
    is_first   INT,
    mail       VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 供应商详情表
COMMENT ON TABLE supplier IS '包含供应商用户额外具体详情的表。和用户一对一关系';
COMMENT ON COLUMN supplier.id IS '供应商详情表的主键。';
COMMENT ON COLUMN supplier.serial_num IS '唯一标识供应商的序列号。';
COMMENT ON COLUMN supplier.supplier_type IS '供应商类别（1=统配，2=直配）';
COMMENT ON COLUMN supplier.settlement IS '供应商的结算条款或相关数值配置。';
COMMENT ON COLUMN supplier.push_order IS '自动推送订单标志，通常为布尔值（0或1）。';
COMMENT ON COLUMN supplier.is_first IS '标识供应商是否为首次合作的标志（布尔值，以0或1表示）。';
COMMENT ON COLUMN supplier.mail IS '供应商联系用的电子邮件地址。';
COMMENT ON COLUMN supplier.created_at IS '供应商详情最初创建时的时间戳。';

CREATE TABLE user_supplier (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INT NOT NULL REFERENCES users(id),
    supplier_id INT NOT NULL REFERENCES supplier(id),
    unique (user_id, supplier_id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 表注释: 该表建立用户与供应商之间的关联关系。
COMMENT ON TABLE user_supplier IS '用于关联用户和供应商，定义用户与供应商的对应关系。';

-- 字段注释
COMMENT ON COLUMN user_supplier.id IS '每条用户-供应商关系的唯一标识符。';
COMMENT ON COLUMN user_supplier.user_id IS '关联的用户ID，表示该用户属于某个供应商。';
COMMENT ON COLUMN user_supplier.supplier_id IS '关联的供应商ID，表示用户所属的供应商。';
COMMENT ON COLUMN user_supplier.created_at IS '记录用户与供应商关系创建的时间戳。';

-- 创建客户等级表
CREATE TABLE client_tier
(
    id         SERIAL PRIMARY KEY,                 -- 主键，自动递增的唯一标识符
    tier_name  VARCHAR(50),                        -- 会员等级名称，例如：普通、黄金、白金等
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 记录创建时间，默认为当前时间
);

-- 添加表的注释
COMMENT ON TABLE client_tier IS '客户会员等级表，存储不同的会员等级信息';
COMMENT ON COLUMN client_tier.id IS '主键，自增ID，唯一标识每个会员等级';
COMMENT ON COLUMN client_tier.tier_name IS '会员等级名称，例如：普通、黄金、白金等';
COMMENT ON COLUMN client_tier.created_at IS '记录该等级创建的时间，默认为当前时间';

INSERT INTO client_tier (id, tier_name)
VALUES (1, '普通'),
       (2, '黑卡');

create table client_shops
(
    id                SERIAL PRIMARY KEY,
    shop_name         varchar(50),
    phone_number      varchar(20),
    tier_id           int references client_tier (id) not null default 1,
    city              varchar references cities (id),
    address           varchar(255),
    latitude          varchar(50),
    longitude         varchar(50),
    status            int,
    automatic_receive bool,
    created_at        TIMESTAMP                                DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE client_shops IS '客人门店信息';
COMMENT ON COLUMN client_shops.id IS '主键，唯一标识店铺';
COMMENT ON COLUMN client_shops.shop_name IS '店铺名称';
COMMENT ON COLUMN client_shops.phone_number IS '店铺电话';
COMMENT ON COLUMN client_shops.tier_id IS '会员等级 ID，关联 client_tier 表，默认为 1（普通会员）';
COMMENT ON COLUMN client_shops.city IS '店铺所在城市，关联 cities 表的 ID';
COMMENT ON COLUMN client_shops.address IS '店铺详细地址';
COMMENT ON COLUMN client_shops.latitude IS '店铺的纬度';
COMMENT ON COLUMN client_shops.longitude IS '店铺的经度';
COMMENT ON COLUMN client_shops.status IS '店铺状态（例如 0：关闭，1：营业中，2：暂停营业）';
COMMENT ON COLUMN client_shops.automatic_receive IS '是否自动接单（true：自动接单，false：手动接单）';
COMMENT ON COLUMN client_shops.created_at IS '记录创建时间，默认为当前时间';

ALTER TABLE scm_order ADD COLUMN client_shop_id INT references client_shops(id);

CREATE TABLE user_client_shop (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- 主键，唯一标识
    user_id    INT NOT NULL REFERENCES users(id),  -- 用户 ID，关联 users 表
    shop_id    INT NOT NULL REFERENCES client_shops(id),  -- 店铺 ID，关联 client_shops 表
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 记录创建时间，默认为当前时间
    unique (user_id, shop_id)
);

-- 添加表注释
COMMENT ON TABLE user_client_shop IS '用户与店铺的关联表，用于存储用户在不同店铺的角色和权限';
-- 添加列注释
COMMENT ON COLUMN user_client_shop.id IS '主键，唯一标识';
COMMENT ON COLUMN user_client_shop.user_id IS '用户 ID，关联 users 表';
COMMENT ON COLUMN user_client_shop.shop_id IS '店铺 ID，关联 client_shops 表';
COMMENT ON COLUMN user_client_shop.created_at IS '记录创建时间，默认为当前时间';

ALTER TABLE scm_order_stock ADD column supplier_id INT references supplier(id);
ALTER TABLE scm_suppliers_goods_daily ADD column supplier_id INT references supplier(id);