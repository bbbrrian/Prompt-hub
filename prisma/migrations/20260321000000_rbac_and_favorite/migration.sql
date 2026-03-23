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

-- 3. user 表: 添加新列
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "departmentId" INTEGER REFERENCES "Department"("id");
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "disabled" BOOLEAN NOT NULL DEFAULT false;

-- 4. user 表: role 从 VARCHAR 迁移为 Role 枚举
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user' AND column_name = 'role' AND data_type = 'character varying'
    ) THEN
        ALTER TABLE "user" ADD COLUMN "roleEnum" "Role" NOT NULL DEFAULT 'USER';
        UPDATE "user" SET "roleEnum" = 'SUPER_ADMIN' WHERE "role" = 'admin';
        UPDATE "user" SET "roleEnum" = 'USER' WHERE "role" = 'user' OR "role" IS NULL;
        ALTER TABLE "user" DROP COLUMN "role";
        ALTER TABLE "user" RENAME COLUMN "roleEnum" TO "role";
    END IF;
END $$;

-- 5. 创建 AuditLog 表
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "user"("id"),
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" INTEGER NOT NULL,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. favorite 表: prompt_id 改为可空
ALTER TABLE "favorite" ALTER COLUMN "prompt_id" DROP NOT NULL;

-- 7. favorite 表: 添加新列
ALTER TABLE "favorite" ADD COLUMN IF NOT EXISTS "skill_id" INTEGER REFERENCES "skill"("id") ON DELETE CASCADE;
ALTER TABLE "favorite" ADD COLUMN IF NOT EXISTS "agent_id" INTEGER REFERENCES "agent"("id") ON DELETE CASCADE;
ALTER TABLE "favorite" ADD COLUMN IF NOT EXISTS "target_type" VARCHAR(20) NOT NULL DEFAULT 'prompt';

-- 8. favorite 表: 添加 unique 约束
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'favorite_user_id_skill_id_key') THEN
        CREATE UNIQUE INDEX "favorite_user_id_skill_id_key" ON "favorite"("user_id", "skill_id");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'favorite_user_id_agent_id_key') THEN
        CREATE UNIQUE INDEX "favorite_user_id_agent_id_key" ON "favorite"("user_id", "agent_id");
    END IF;
END $$;

-- 9. 预置部门
INSERT INTO "Department" ("name") VALUES
    ('创新中心'), ('研发中心'), ('测评中心'), ('质量部'),
    ('运营中心'), ('市场部'), ('财务部'), ('综合管理部')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "Department" ("name", "parentId")
SELECT '保密办', "id" FROM "Department" WHERE "name" = '综合管理部'
ON CONFLICT ("name") DO NOTHING;
