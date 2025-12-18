export type ICommand<C extends ICommandMap, K extends keyof C> = {
	type: K;
	payload: C[K]["payload"];
};

export interface ICommandContext<C extends ICommandMap, K extends keyof C> {
	cancel(): void;
	setResult(result: C[K]["result"]): void;
	result?: C[K]["result"];
}

export interface ICommandBus<C extends ICommandMap> {
	execute<K extends keyof C>(command: ICommand<C, K>): Promise<C[K]["result"]>;

	setHandler<K extends keyof C>(
		type: K,
		handler: (payload: C[K]["payload"]) => C[K]["result"] | Promise<C[K]["result"]>
	): void;
}

export interface ICommandMap {
	[commandType: string]: {
		payload: any;
		result: any;
	};
}
