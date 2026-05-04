import { _axios } from "@/utils/axios";
import { getEncryption } from "@/utils/auth";
import { message } from "ant-design-vue";

export const apiLogin = async (useraccount: string, password: string) => {
	const encryptedPassword = await getEncryption(password);
	if (encryptedPassword) {
		const res = await _axios.post("/user/login", {
			useraccount,
			password: encryptedPassword,
		});
		return res.data as string;
	} else {
		message.error("密码加密异常");
	}
};
