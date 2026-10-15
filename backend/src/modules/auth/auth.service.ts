import { prisma } from "../../lib/prisma.js";
import bcrypt from "bcrypt";
import { RegisterInput, LoginInput, UpdateUserInput } from "./auth.schema.js";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { createHash } from "node:crypto";
import { AppError } from "../../errors/appError.js";

export const registerService = async (data: RegisterInput) => {
    
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email.toLowerCase(),
            phone: data.phone ?? null,
            avatarUrl: data.avatarUrl ?? null,
            passwordHash,
            role: data.role ?? "CUSTOMER",
        }
    });

    const { passwordHash: _, ...safeUser } = user;

    return safeUser;
}

export const loginService = async (data: LoginInput) => {
    const user = await prisma.user.findUnique({
        where: {
            email: data.email.toLowerCase()
        }
    });
    if(!user){
        throw new AppError("Invalid credentials", 401);
    }
    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if(!isMatch){
        throw new AppError("Invalid credentials", 401);
    }
    const token = jwt.sign(
        {
            sub: user.id,
            role: user.role,
        },
        env.JWT_SECRET,
        {
            expiresIn: "15m",
        }
    );
    const refreshToken = jwt.sign(
        {
            sub: user.id,
        },
        env.REFRESH_SECRET,
        {
            expiresIn: "7d",
        }
    );
    const tokenHash = createHash("sha256")
        .update(refreshToken)
        .digest("hex");
    await prisma.refreshToken.create({
        data: {
            tokenHash: tokenHash,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        }
    });
    const { passwordHash: _, ...safeUser } = user;

    
    return { user: safeUser, token, refreshToken };
}

export const updateUserService = async (userId: number, data: UpdateUserInput) => {
    const user = await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            ...(data.name !== undefined ? { name: data.name } : {}),
            phone: data.phone ?? null,
        },
    });
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
}

export const logoutService = async (refreshToken: string) => {
    if(!refreshToken) {
        return { message: "Logout successful" };
    }
    const hashToken = createHash("sha256")
        .update(refreshToken)
        .digest("hex");

    await prisma.refreshToken.updateMany({
        where: {
            tokenHash: hashToken,
            revokedAt: null,
        },
            data: {
            revokedAt: new Date(),
        },
    });

    return { message: "Logout successful" };
}

export const getCurrentUserService = async (userId: number) => {
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            role: true,
            status: true,
        }
    });
    if (!user) {
        throw new AppError("User not found", 404);
    }
    return user;
}

export const refreshTokenService = async (refreshToken: string) => {
    if (!refreshToken) {
        throw new AppError("Refresh token is required", 400);
    }

    try {
        jwt.verify(refreshToken, env.REFRESH_SECRET);
    } catch {
        throw new AppError("Invalid or expired refresh token", 401);
    }

    const hashToken = createHash("sha256")
        .update(refreshToken)
        .digest("hex");

    const cek = await prisma.refreshToken.findFirst({
        where: {
            tokenHash: hashToken,
        },
    });

    if (!cek) {
        throw new AppError("Invalid refresh token", 400);
    }

    if (cek.revokedAt !== null) {
        throw new AppError("Refresh token revoked", 401);
    }

    if (cek.expiresAt < new Date()) {
        await prisma.refreshToken.delete({
            where: {
                id: cek.id,
            },
        });

        throw new AppError("Refresh token expired", 401);
    }

    const user = await prisma.user.findUnique({
        where: {
            id: cek.userId,
        },
    });

    if (!user) {
        throw new AppError("User not found", 404);
    }

    const token = jwt.sign(
        {
            sub: user.id,
            role: user.role,
        },
        env.JWT_SECRET,
        {
            expiresIn: "15m",
        }
    );
    const newRefreshToken = jwt.sign(
        {
            sub: user.id
        },
        env.REFRESH_SECRET,
        {
            expiresIn: "7d"
        }
    )
    const newTokenHash = createHash("sha256")
        .update(newRefreshToken)
        .digest("hex");
    await prisma.$transaction([
        prisma.refreshToken.update({
            where: {
                id: cek.id,
            },
            data: {
                revokedAt: new Date(),
            },
        }),

        prisma.refreshToken.create({
            data: {
                tokenHash: newTokenHash,
                userId: user.id,
                expiresAt: new Date(
                    Date.now() + 7 * 24 * 60 * 60 * 1000
                ),
            },
        }),
    ]);
    return { token, refreshToken: newRefreshToken };
};

