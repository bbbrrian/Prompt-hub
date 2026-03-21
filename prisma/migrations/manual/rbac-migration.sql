-- 1. 创建 Department 表
CREATE TABLE IF NOT EXISTS "Department" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "parentId" INTEGER REFERENCES "Department"("id"),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. 创建 Role 枚举
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'DEPT_ADMIN', 'USER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. user 表变更
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "departmentId" INTEGER REFERENCES "Department"("id");
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "disabled" BOOLEAN NOT NULL DEFAULT false;

-- 迁移 role 字段：先添加新列，迁移数据，再删旧列
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "roleEnum" "Role" NOT NULL DEFAULT 'USER';
UPDATE "user" SET "roleEnum" = 'SUPER_ADMIN' WHERE "role" = 'admin';
UPDATE "user" SET "roleEnum" = 'USER' WHERE "role" = 'user' OR "role" IS NULL;

-- 如果 role 列是 TEXT 类型，需要替换
ALTER TABLE "user" DROP COLUMN IF EXISTS "role";
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user' AND column_name='roleEnum') THEN
        ALTER TABLE "user" RENAME COLUMN "roleEnum" TO "role";
    END IF;
END $$;

-- 4. 创建 AuditLog 表
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "user"("id"),
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" INTEGER NOT NULL,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. 预置部门
INSERT INTO "Department" ("name") VALUES
    ('创新中心'), ('研发中心'), ('测评中心'), ('质量部'),
    ('运营中心'), ('市场部'), ('财务部'), ('综合管理部')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "Department" ("name", "parentId")
SELECT '保密办', "id" FROM "Department" WHERE "name" = '综合管理部'
ON CONFLICT ("name") DO NOTHING;
