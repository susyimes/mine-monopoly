import apiClient from "./index";
import { FPMessage } from "@mine-monopoly/ui";
import { getEncryption } from "@src/utils/encryption";
import { setToken } from "@src/utils/auth";
import type { ApiResponse } from "@mine-monopoly/types";

export const getUserInfo = async () => {
	const response = await apiClient.get<ApiResponse<{
		id: string;
		username: string;
		avatar: string;
		color: string;
	}>>("/user/info");
	return response.data;
};

export const getPublicKey = async () => {
	const response = await apiClient.get<ApiResponse<string>>("/user/public-key");
	const publicKey = response.data;
	localStorage.setItem("public-key", publicKey);
	return publicKey;
};

export const apiLogin = async (useraccount: string, password: string) => {
	const encryptionPassword = await getEncryption(password);
	if (!encryptionPassword) {
		FPMessage({ type: "error", message: "密码加密异常" });
		return null;
	}

	try {
		const response = await apiClient.post<ApiResponse<string>>("/user/login", {
			useraccount,
			password: encryptionPassword,
		});
		const token = response.data;
		if (token) setToken(token);
		return token;
	} catch (error) {
		return null;
	}
};

export const apiRegister = async (formData: FormData): Promise<boolean> => {
	try {
		await apiClient.post<ApiResponse<void>>("/user/register", formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return true;
	} catch (error) {
		return false;
	}
};
