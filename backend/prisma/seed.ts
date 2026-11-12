import { PrismaClient, RoleName } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // 1. Buat Roles
    const roles = await Promise.all([
        prisma.role.upsert({
            where: { name: RoleName.SUPER_ADMIN },
            update: {},
            create: {
                name: RoleName.SUPER_ADMIN,
                description: 'Akses penuh ke seluruh sistem',
                isSystem: true,
            },
        }),
        prisma.role.upsert({
            where: { name: RoleName.VILLAGE_ADMIN },
            update: {},
            create: {
                name: RoleName.VILLAGE_ADMIN,
                description: 'Mengelola satu desa/kelurahan',
                isSystem: true,
            },
        }),
        prisma.role.upsert({
            where: { name: RoleName.CITIZEN },
            update: {},
            create: {
                name: RoleName.CITIZEN,
                description: 'Melihat informasi publik',
                isSystem: true,
            },
        }),
    ]);

    console.log('✅ Roles created');

    // 2. Buat Super Admin
    const passwordHash = await bcrypt.hash('password123', 10);

    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@system.com' },
        update: {},
        create: {
            email: 'admin@system.com',
            passwordHash,
            name: 'Super Admin',
            isActive: true,
            isVerified: true,
        },
    });

    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: superAdmin.id,
                roleId: roles[0].id,
            },
        },
        update: {},
        create: {
            userId: superAdmin.id,
            roleId: roles[0].id,
        },
    });

    console.log('✅ Super Admin created');

    // 3. Buat Contoh Wilayah
    const province = await prisma.province.upsert({
        where: { code: '32' },
        update: {},
        create: {
            code: '32',
            name: 'Jawa Barat',
            capital: 'Bandung',
            isActive: true,
        },
    });

    const regency = await prisma.regency.upsert({
        where: { code: '3216' },
        update: {},
        create: {
            code: '3216',
            name: 'Kabupaten Bekasi',
            capital: 'Cikarang',
            provinceId: province.id,
            isActive: true,
        },
    });

    const district = await prisma.district.upsert({
        where: { code: '321610' },
        update: {},
        create: {
            code: '321610',
            name: 'Kecamatan Cikarang Utara',
            regencyId: regency.id,
            isActive: true,
        },
    });

    const village = await prisma.village.upsert({
        where: { code: '3216102001' },
        update: {},
        create: {
            code: '3216102001',
            name: 'Desa Sukamaju',
            districtId: district.id,
            isActive: true,
        },
    });

    console.log('✅ Example region data created');

    // 4. Buat Village Admin
    const villageAdmin = await prisma.user.upsert({
        where: { email: 'desa@example.com' },
        update: {},
        create: {
            email: 'desa@example.com',
            passwordHash,
            name: 'Admin Desa Sukamaju',
            isActive: true,
            isVerified: true,
        },
    });

    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: villageAdmin.id,
                roleId: roles[1].id,
            },
        },
        update: {},
        create: {
            userId: villageAdmin.id,
            roleId: roles[1].id,
        },
    });

    await prisma.userVillage.upsert({
        where: {
            userId_villageId: {
                userId: villageAdmin.id,
                villageId: village.id,
            },
        },
        update: {},
        create: {
            userId: villageAdmin.id,
            villageId: village.id,
            isPrimary: true,
        },
    });

    console.log('✅ Village Admin created');

    // 5. Buat Citizen
    const citizen = await prisma.user.upsert({
        where: { email: 'warga@example.com' },
        update: {},
        create: {
            email: 'warga@example.com',
            passwordHash,
            name: 'Warga Desa Sukamaju',
            isActive: true,
            isVerified: true,
        },
    });

    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: citizen.id,
                roleId: roles[2].id,
            },
        },
        update: {},
        create: {
            userId: citizen.id,
            roleId: roles[2].id,
        },
    });

    await prisma.userVillage.upsert({
        where: {
            userId_villageId: {
                userId: citizen.id,
                villageId: village.id,
            },
        },
        update: {},
        create: {
            userId: citizen.id,
            villageId: village.id,
            isPrimary: true,
        },
    });

    console.log('✅ Citizen created');

    console.log('\n🎉 Seeding completed!');
    console.log('\n📝 Login credentials:');
    console.log('  👑 Super Admin: admin@system.com / password123');
    console.log('  🏘️ Village Admin: desa@example.com / password123');
    console.log('  👤 Citizen: warga@example.com / password123');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });