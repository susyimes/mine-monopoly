import type { AgentColonyEventHandler, AgentIdentity, GameAdapter } from "./types";

export interface AgentColonyRuntimeOptions {
  agent: AgentIdentity;
  adapter: GameAdapter;
  handler: AgentColonyEventHandler;
}

export class AgentColonyRuntime {
  private readonly agent: AgentIdentity;
  private readonly adapter: GameAdapter;
  private readonly handler: AgentColonyEventHandler;

  constructor(options: AgentColonyRuntimeOptions) {
    this.agent = options.agent;
    this.adapter = options.adapter;
    this.handler = options.handler;
  }

  async tick(): Promise<boolean | undefined> {
    const events = await this.adapter.readEvents();
    if (!events) return undefined;

    for (const event of events) {
      const snapshot = event.snapshot ?? (await this.adapter.readSnapshot?.());
      const legalActions = this.adapter.listLegalActions(event, snapshot);
      const input = { agent: this.agent, adapter: this.adapter, event, snapshot, legalActions };
      await this.handler.observeEvent?.(input);

      const action = await this.handler.decideAction(input);
      if (!action) continue;

      const result = await this.adapter.dispatchAction(action);
      await this.handler.afterDispatch?.({ ...input, action, result });
      return true;
    }

    return false;
  }
}
