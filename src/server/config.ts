import "server-only";

export const serverConfig = {
  appName: process.env.APP_NAME?.trim() || "Zaraff Collection Dashboard",
};
