import * as THREE from "three";

export class Animated2DBase {
	protected readonly baseUrl;
	protected readonly name;
	public readonly size;
	public model: THREE.Group;

	protected lastFrameTime = Date.now() / 1000;

	constructor(size: number, baseUrl: string, fileNameWithoutType: string) {
		this.size = size;
		this.baseUrl = baseUrl;
		this.name = fileNameWithoutType;
		this.model = new THREE.Group();
	}

	public async load() {
		this.model = await loadRoleModel(this.baseUrl, this.name);
		return this.model;
	}
}

async function loadRoleModel(baseUrl: string, fileNameWithType: string): Promise<THREE.Group> {
	const textureLoader = new THREE.TextureLoader();
	const texture = await textureLoader.loadAsync(`${baseUrl}/${fileNameWithType}`);
	texture.repeat.set(1, 1);
	texture.colorSpace = THREE.SRGBColorSpace;

	// 创建一个基础材质
	const planeMaterial = new THREE.MeshBasicMaterial({
		map: texture,
		transparent: true,
		side: THREE.DoubleSide,
		depthWrite: true,
		alphaTest: 0.5,
	});
	const planeGeometry = new THREE.PlaneGeometry(1, 1);
	const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
	const group = new THREE.Group();
	planeMesh.position.y = 0.5;
	group.add(planeMesh);

	// 缩放到单位大小
	const box = new THREE.Box3().setFromObject(group);
	const size = new THREE.Vector3();
	box.getSize(size);
	const maxSide = Math.max(size.x, size.y, size.z);
	const scale = 1 / maxSide;
	group.scale.set(scale, scale, scale);

	// 把几何移到原点
	const center = new THREE.Vector3();
	box.getCenter(center).multiplyScalar(scale);
	group.position.sub(center);

	return group;
}
