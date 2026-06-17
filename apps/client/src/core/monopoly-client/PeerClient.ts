import { useLoading } from "@src/store";
import { __ICE_SERVER_PATH__, __ICE_USE_PREFIX__, __FATPAPER_HOST__ } from "@src/../global.config";
import Peer, { DataConnection } from "peerjs";

export class PeerClient {
	private peer: Peer;
	private conn: DataConnection | null = null;

	private constructor(peer: Peer) {
		this.peer = peer;
	}

	public async linkToHost(hostId: string) {
		if (!hostId) throw new Error("无效的主机ID");
		if (this.conn) {
			this.conn.close();
			this.conn = null;
		}

		const conn = await new Promise<DataConnection>((resolve, reject) => {
			let settled = false;
			let pendingConn: DataConnection | null = null;
			const timeOutId = setTimeout(() => {
				if (settled) return;
				settled = true;
				pendingConn?.close();
				reject(new Error("连接主机超时, 连不上主机捏😣"));
			}, isAutomationMode() ? 15000 : 5000);
			const conn = this.peer.connect(hostId);
			pendingConn = conn;
			conn.on("open", () => {
				if (settled) return;
				settled = true;
				clearTimeout(timeOutId);
				resolve(conn);
			});
			conn.on("error", (e) => {
				if (settled) return;
				settled = true;
				clearTimeout(timeOutId);
				reject(e);
			});
		});

		this.conn = conn;
		return { conn: this.conn, peer: this.peer };
	}

	public static async create(host: string, port: number, iceServers: RTCIceServer[]) {
		//向服务器和获取自己的peerId
		const peer = await new Promise<Peer>((resolve, reject) => {
			const peer = new Peer(
				__ICE_USE_PREFIX__
					? {
							host: __FATPAPER_HOST__,
							path: __ICE_SERVER_PATH__,
							secure: true,
							config: { iceServers },
						}
					: { host, port }
			);
			peer.addListener("open", (id) => {
				console.log("ice服务器连接成功, ID:", id);
				peer.removeAllListeners();
				resolve(peer);
			});
			peer.addListener("error", (e) => {
				reject(e);
			});
		});
		return new PeerClient(peer);
	}

	public destory() {
		this.peer.destroy();
		this.conn = null;
	}
}

function isAutomationMode() {
	return (
		Boolean((window as typeof window & { __AI_LIVE_AUTOMATION__?: unknown }).__AI_LIVE_AUTOMATION__) ||
		window.location.search.includes("automation=1") ||
		window.location.hash.includes("automation=1")
	);
}
