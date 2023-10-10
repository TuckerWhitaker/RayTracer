declare namespace console {
	function debug(val: number): void;
}

class Vector {
	x: number;
	y: number;
	z: number;

	constructor(x: number = 0, y: number = 0, z: number = 0) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	set(x: number, y: number, z: number): Vector {
		this.x = x;
		this.y = y;
		this.z = z;
		return this;
	}

	add(v: Vector): Vector {
		this.x += v.x;
		this.y += v.y;
		this.z += v.z;
		return this;
	}

	sub(v: Vector): Vector {
		globalVector.x = this.x - v.x;
		globalVector.y = this.y - v.y;
		globalVector.z = this.z - v.z;

		return globalVector;
	}

	dot(v: Vector): number {
		return this.x * v.x + this.y * v.y + this.z * v.z;
	}

	multiply(scalar: number): Vector {
		this.x *= scalar;
		this.y *= scalar;
		this.z *= scalar;
		return this;
	}

	length(): number {
		return Math.sqrt(this.dot(this));
	}

	normalize(): Vector {
		const length = this.length();
		if (length > 0) {
			this.x /= length;
			this.y /= length;
			this.z /= length;
		}
		return this;
	}

	reflect(normal: Vector, out: Vector): Vector {
		const dot2 = this.dot(normal) * 2;
		out.set(
			this.x - normal.x * dot2,
			this.y - normal.y * dot2,
			this.z - normal.z * dot2
		);
		return out;
	}
}
let globalVector = new Vector(0, 0, 0);

class Ray {
	constructor(public origin: Vector, public direction: Vector) {}
}

class Material {
	constructor(
		public albedo: Vector,
		public Roughness: f64,
		public Metallic: f64
	) {}
}

// Global variables
let g_oc: Vector = new Vector(0, 0, 0);
let g_b: number = 0;
let g_c: number = 0;
let g_discriminant: number = 0;

class Sphere {
	constructor(
		public center: Vector,
		public radius: number,
		public material: Material
	) {}

	intersect(ray: Ray): number {
		g_oc = ray.origin.sub(this.center);
		g_b = g_oc.dot(ray.direction);
		g_c = g_oc.dot(g_oc) - this.radius * this.radius;
		g_discriminant =
			g_b * g_b - g_oc.dot(ray.direction) * g_oc.dot(ray.direction) + g_c;

		if (g_discriminant < 0) {
			return -1;
		} else {
			return (-g_b - Math.sqrt(g_discriminant)) / g_oc.dot(ray.direction);
			//return 1;
		}
	}
}

class HitInfo {
	didHit: bool = false;
	Position: Vector = new Vector(0, 0, 0);
	Index: number = 0;
	Normal: Vector = new Vector(0, 0, 0);
	Distance: f64 = Infinity;

	constructor(
		didHit: bool,
		Position: Vector,
		Index: number,
		Normal: Vector,
		Distance: f64
	) {
		this.didHit = didHit;
		this.Position = Position;
		this.Index = Index;
		this.Normal = Normal;
		this.Distance = Distance;
	}
}
function traceRay(
	rayOrigin: Vector,
	rayDirection: Vector,
	spheres: Sphere[]
): HitInfo {
	let closest = Infinity;
	let closestIndex = -1;

	for (let i = 0; i < spheres.length; i++) {
		let sphere = spheres[i];
		let t = sphere.intersect(new Ray(rayOrigin, rayDirection));

		if (t != -1 && t < closest && t > 0) {
			closest = t;
			closestIndex = i;
		}
	}

	if (closestIndex == -1) {
		return new HitInfo(false, new Vector(0, 0, 0), 0, new Vector(0, 0, 0), -1);
	} else {
		let hitPosition = rayOrigin.add(rayDirection.multiply(closest));
		return new HitInfo(
			true,
			hitPosition,
			closestIndex,
			hitPosition.sub(spheres[closestIndex].center).normalize(),
			closest
		);
	}
}

function calculateColor(
	hitInfo: HitInfo,
	lightDirection: Vector,
	spheres: Sphere[],
	closestIndex: i32
): Array<f64> {
	if (!hitInfo.didHit) {
		return [1, 1, 1];
	}

	let sphere = spheres[closestIndex];
	let normal = hitInfo.Position.sub(sphere.center).normalize();
	let light = Math.max(0, normal.dot(lightDirection));

	let R = f64(Math.min(Math.max(0, sphere.material.albedo.x * light), 1));
	let G = f64(Math.min(Math.max(0, sphere.material.albedo.y * light), 1));
	let B = f64(Math.min(Math.max(0, sphere.material.albedo.z * light), 1));

	return [R, G, B];
	//return 0x00000000 | (R << 16) | (G << 8) | B;
}

export function test(): number {
	return ASC_RUNTIME;
	return memory.size();
	//const r = load<u8>(0);
	//store<u8>(0, r * 2);
}
export function render(
	Width: i32,
	Height: i32,
	spheredataX: number,
	spheredataY: number,
	spheredataZ: number,
	spheredataScale: number
): void {
	//console.debug(69);
	const Materials = [new Material(new Vector(0.1, 0.5, 0.1), 0.05, 1)];

	let sphere = new Sphere(new Vector(0, 0, -3), 1, Materials[0]);
	let rayOrigin = new Vector(0, 0, 1);
	let rayDirection = new Vector(0, 0, -1);

	let index: i32 = 0; // An index to keep track of memory location

	let ray = new Ray(rayOrigin, rayDirection);
	let vector = new Vector(0, 0, 0);
	let R = 0;
	let G = 0;
	let B = 0;

	let u = 0;
	let v = 0;
	let t = Infinity;

	for (let y = 0; y < Height; y++) {
		for (let x = 0; x < Width; x++) {
			u = <i32>(<f32>x / <f32>Width);
			v = <i32>(<f32>y / <f32>Height);

			vector.set(u - 0.5, v - 0.5, -1); // Convert to NDC

			rayDirection = vector.normalize();
			ray.direction = rayDirection;

			t = sphere.intersect(ray);

			if (t == -1 || t < 0) {
				R = 255;
				G = 0;
				B = 0;
			} else if (t > 0 && t != -1) {
				R = u32((<f32>x / <f32>Width) * 255);
				G = u32(0);
				B = u32((<f32>y / <f32>Height) * 255);
			} else {
				R = 0;
				G = 255;
				B = 0;
			}

			store<u8>(index, R);
			store<u8>(index + 1, G);
			store<u8>(index + 2, B);
			store<u8>(index + 3, 255);

			index += 4; // Move to the next RGB triplet location
		}
	}
}

/*
			//normals
			let R = u32((normal.x * 0.5 + 0.5) * 255);
			let G = u32((normal.y * 0.5 + 0.5) * 255);
			let B = u32((normal.z * 0.5 + 0.5) * 255);


			//UV
			let R = u32(u * 255);
			let G = u32(v * 255);
			let B = u32(0);
			return u32(0x00000000 | (R << 16) | (G << 8) | B);
	*/
