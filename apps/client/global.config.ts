import { env } from "@mine-monopoly/env";

// 基础环境变量
export const __USERSERVERHOST__ = `http://localhost:${env<number>("SERVER_PORT")}`;

const prefix = env("API_BASE_PREFIX", "");
const domain = env("FATPAPER_DOMAIN");
const protocol = env("PROTOCOL");
const port = env<number>("SERVER_PORT");
const adminPort = env<number>("MONOPOLY_ADMIN_PORT");

// 根据前缀配置生成服务器地址
export const __MONOPOLYSERVERHOST__ = prefix
	? `${domain}${prefix}`
	: `${domain}:${port}`;
export const __APIPORT__ = env<number>("SERVER_PORT");
export const __ICE_SERVER_PORT__ = env<number>("ICE_SERVER_PORT");
export const __MONOPOLYSERVER__ = prefix
	? `${protocol}://${domain}${prefix}`
	: `${protocol}://${domain}:${port}`;

// ICE 服务路径：用于 PeerJS 的 path 参数
// 如果有前缀，path 为前缀；否则使用默认的 /peerjs
export const __ICE_SERVER_PATH__ = prefix || "/peerjs";

// Admin 服务地址
export const __MONOPOLY_ADMIN__ = prefix
	? `${protocol}://${domain}${prefix}`
	: `${protocol}://${domain}:${adminPort}`;

export const __FATPAPER_HOST__ = env("FATPAPER_DOMAIN");
export const __PROTOCOL__ = env("PROTOCOL");

// 腾讯云配置（可选）
export const __TC_ID__ = env("TC_ID", "");
export const __TC_KEY__ = env("TC_KEY", "");
export const __TC_BUCKET_NAME__ = env("TC_BUCKET_NAME", "");
export const __TC_REGION__ = env("TC_REGION", "");
