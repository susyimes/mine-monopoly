export interface GameMapInDb {
	id: string;
	name: string;
	version: string;
	hash: string;
	coverUrl: string;
	mapUrl: string;
	inuse: boolean;
}
