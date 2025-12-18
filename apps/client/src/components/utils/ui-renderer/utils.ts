import { compileExpression } from "filtrex";

// 缓存编译后的表达式
const expressionCache = new Map<string, (data: any) => any>();

// 自定义函数库
const extraFunctions = {
	len: (arr: any) => (Array.isArray(arr) ? arr.length : 0),
	get: (obj: any, key: string) => (obj ? obj[key] : null),
	contains: (str: string, sub: string) => (str && str.includes ? str.includes(sub) : false),
};

/**
 * 纯 JS 实现的安全路径获取 (基石)
 * 处理: user.name, users[0], !isShow
 */
export function safeGet(context: any, path: string): any {
	if (!path || context == null) return undefined;

	let currentPath = path;
	let isNegative = false;

	if (currentPath.startsWith("!")) {
		isNegative = true;
		currentPath = currentPath.slice(1);
	}

	// 数组下标归一化 users[0] -> users.0
	const normalizedPath = currentPath.replace(/\[(\w+)\]/g, ".$1");
	const keys = normalizedPath.split(".");

	let result = context;
	for (const key of keys) {
		if (result == null) {
			result = undefined;
			break;
		}
		result = result[key];
	}

	return isNegative ? !result : result;
}

/**
 * 创建代理上下文
 * 拦截 Filtrex 对根变量的读取，通过 safeGet 安全访问
 */
function createProxyContext(realContext: any) {
	return new Proxy(realContext || {}, {
		get(target, prop) {
			if (typeof prop !== "string") return Reflect.get(target, prop);
			const val = safeGet(target, prop);
			return val === undefined ? null : val;
		},
		has(target, prop) {
			return true; // 防止 ReferenceError
		},
	});
}

/**
 * 表达式求值 (混合策略)
 */
export function evalExpression(context: any, expression: string): any {
	if (!expression) return undefined;

	const trimmed = expression.trim();

	// 1. 简单路径优化：直接走 safeGet，性能更好，且原生支持 Vue Proxy
	const isSimplePath = /^!?[a-zA-Z0-9_.[\]]+$/.test(trimmed);
	if (isSimplePath) {
		return safeGet(context, trimmed);
	}

	// 2. 复杂表达式：走 Filtrex
	let compiled = expressionCache.get(trimmed);

	if (!compiled) {
		try {
			compiled = compileExpression(trimmed, {
				extraFunctions,
				// 处理嵌套对象访问 (.money)
				customProp: (propName, get, obj) => {
					if (obj == null) return null;
					const val = obj[propName];
					return val === undefined ? null : val;
				},
			});
			expressionCache.set(trimmed, compiled);
		} catch (error) {
			console.warn(`[Syntax Error]: "${trimmed}"`, error);
			return undefined;
		}
	}

	try {
		const magicContext = createProxyContext(context);
		return compiled(magicContext);
	} catch (error) {
		return undefined;
	}
}

/**
 * 解析 v-for
 */
export function parseVFor(expression: string) {
	const match = expression.match(/^\s*(\w+)\s+in\s+(.+)\s*$/);
	if (!match) return { itemKey: "item", listExpr: "" };
	return { itemKey: match[1], listExpr: match[2] };
}
