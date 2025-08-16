import { UserRoleEnum, UserStatusEnum } from "@prisma/client";
import * as bcrypt from "bcrypt";
import config from "../config";
import prisma from "../config/prisma";

const superAdminData = {
  name: "Super Admin",
  email: "admin@gmail.com",
  role: UserRoleEnum.SUPERADMIN,
  isVerified: true,
  status: UserStatusEnum.ACTIVE,
};

const seedSuperAdmin = async () => {
  try {
    const isSuperAdminExists = await prisma.user.findFirst({
      where: {
        role: UserRoleEnum.SUPERADMIN,
      },
    });

    if (isSuperAdminExists) {
      console.log("⚠️ Super Admin already exists.");
      return;
    }

    const hashedPassword = await bcrypt.hash(
      config.super_admin_password as string,
      Number(config.bcrypt_salt_rounds) || 12
    );

    // ✅ Transaction block
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: superAdminData.name,
          email: superAdminData.email,
          password: hashedPassword,
          role: superAdminData.role,
          isVerified: superAdminData.isVerified,
          status: superAdminData.status,
        },
      });

      await tx.supperAdmin.create({
        data: {
          name: superAdminData.name,
          email: superAdminData.email,
          userId: user.id,
        },
      });
    });

    console.log("✅ Super Admin created successfully.");
  } catch (error) {
    console.error("❌ Error seeding Super Admin:", error);
  }
};

export default seedSuperAdmin;
