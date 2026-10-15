
import { Request, Response } from "express";
import { registerService, loginService, getCurrentUserService, refreshTokenService, logoutService, updateUserService } from "./auth.service.js";
import {
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
} from "./auth.cookie.js";


export const registerUser = async (req: Request, res: Response) => {
    try{
        const user = await registerService(req.body);

        res.status(201).json({
            message: "User registered successfully",
            user,
        });
    }catch (error) {
        res.status(400).json({
            message: "User registration failed",
            error: (error as Error).message,
        });
    }
  
};

export const updateUser = async (req: Request, res: Response) => {
    try{
        const userId = req.user!.sub;
        const data = await updateUserService(Number(userId), req.body);
        res.status(200).json({
            message: "User updated successfully",
            user: data,
        });
    }catch (error) {
        res.status(400).json({
            message: "User update failed",
            error: (error as Error).message,
        });
    }
}

export const loginUser = async (req: Request, res: Response) => {
  try {
    const user = await loginService(req.body);
    res.cookie(
      REFRESH_COOKIE_NAME,
      user.refreshToken,
      refreshCookieOptions,
    );
    res.status(200).json({
        message: "Login successful",
        user: user.user,
        token: user.token,
    });
  } catch (error) {
    res.status(401).json({
      message: "Login failed",
      error: (error as Error).message,
    });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
    try {
        const user = req.user!.sub;
    
        const data = await getCurrentUserService(Number(user));

        res.status(200).json({
            message: "User retrieved successfully",
            user: data,
        });
    }catch (error) {
        res.status(401).json({
            message: "Failed to retrieve user",
            error: (error as Error).message,
        });
    }
};

export const refreshToken = async (req: Request, res: Response) => {
    try{

        const refreshTokenValue = req.cookies?.[REFRESH_COOKIE_NAME];
        const data = await refreshTokenService(refreshTokenValue);

        res.cookie(
            REFRESH_COOKIE_NAME,
            data.refreshToken,
            refreshCookieOptions,
        );
        res.status(200).json({
            message: "Token refreshed successfully",
            token: data.token,
        });
    } catch (error) {
        res.status(401).json({
            message: "Failed to refresh token",
            error: (error as Error).message,
        });
    }
}

export const logoutUser = async (req: Request, res: Response) => {
    try{
        
        const refreshTokenValue = req.cookies?.[REFRESH_COOKIE_NAME];
         await logoutService(refreshTokenValue);

        res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: refreshCookieOptions.httpOnly,
        secure: refreshCookieOptions.secure,
        sameSite: refreshCookieOptions.sameSite,
        path: refreshCookieOptions.path,
        });

        res.status(200).json({
        message: "Logout successful",
        });
    } catch (error) {
        res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: refreshCookieOptions.httpOnly,
        secure: refreshCookieOptions.secure,
        sameSite: refreshCookieOptions.sameSite,
        path: refreshCookieOptions.path,
        });

        res.status(500).json({
        message: "Failed to logout",
        error: (error as Error).message,
        });
    }
}