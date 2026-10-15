let accessToken: string | null = null;

const refreshTokenKey = "refreshToken";

export const tokenStorage = {
    getAccessToken: () => accessToken,
    setAccessToken: (token: string | null) => {
        accessToken = token;
    },

    clearTokens: () => {
        accessToken = null;
        localStorage.removeItem(refreshTokenKey);
    }

}