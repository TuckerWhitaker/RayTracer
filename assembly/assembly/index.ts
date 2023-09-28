class Vector {
	x: number;
	y: number;
	z: number;

	constructor(x: number, y: number, z: number) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	add(v: Vector): Vector {
		return new Vector(this.x + v.x, this.y + v.y, this.z + v.z);
	}

	sub(v: Vector): Vector {
		return new Vector(this.x - v.x, this.y - v.y, this.z - v.z);
	}

	dot(v: Vector): number {
		return this.x * v.x + this.y * v.y + this.z * v.z;
	}

	multiply(scalar: number): Vector {
		return new Vector(this.x * scalar, this.y * scalar, this.z * scalar);
	}
	length(): number {
		return Math.sqrt(this.dot(this));
	}

	normalize(): Vector {
		let length = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
		return new Vector(this.x / length, this.y / length, this.z / length);
	}
	reflect(normal: Vector): Vector {
		return this.sub(normal.multiply(2 * this.dot(normal)));
	}
}
class Ray {
	constructor(public origin: Vector, public direction: Vector) {}
}

class Sphere {
	constructor(
		public center: Vector,
		public radius: number,
		public albedo: Vector
	) {}

	intersect(ray: Ray): number {
		const oc = ray.origin.sub(this.center);
		const a = ray.direction.dot(ray.direction);
		const b = 2.0 * oc.dot(ray.direction);
		const c = oc.dot(oc) - this.radius * this.radius;
		const discriminant = b * b - 4 * a * c;
		if (discriminant < 0) {
			return -1;
		} else {
			return (-b - Math.sqrt(discriminant)) / (2.0 * a);
		}
	}
}

class HitInfo {
	didHit: bool = false;
	Position: Vector = new Vector(0, 0, 0);
	Index: number = 0;
	Normal: Vector = new Vector(0, 0, 0);

	constructor(didHit: bool, Position: Vector, Index: number, Normal: Vector) {
		this.didHit = didHit;
		this.Position = Position;
		this.Index = Index;
		this.Normal = Normal;
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
		return new HitInfo(false, new Vector(0, 0, 0), 0, new Vector(0, 0, 0));
	} else {
		let hitPosition = rayOrigin.add(rayDirection.multiply(closest));
		return new HitInfo(
			true,
			hitPosition,
			closestIndex,
			hitPosition.sub(spheres[closestIndex].center).normalize()
		);
	}
}

function calculateColor(
	hitInfo: HitInfo,
	lightDirection: Vector,
	spheres: Sphere[],
	closestIndex: i32
): Array<u32> {
	if (!hitInfo.didHit) {
		return [0, 0, 0];
	}

	let sphere = spheres[closestIndex];
	let normal = hitInfo.Position.sub(sphere.center).normalize();
	let light = Math.max(0, normal.dot(lightDirection));

	let R = u32(Math.min(Math.max(0, sphere.albedo.x * light), 255));
	let G = u32(Math.min(Math.max(0, sphere.albedo.y * light), 255));
	let B = u32(Math.min(Math.max(0, sphere.albedo.z * light), 255));

	return [R, G, B];
	//return 0x00000000 | (R << 16) | (G << 8) | B;
}

export function render(
	pixelX: number,
	pixelY: number,
	spheredataX: number,
	spheredataY: number,
	spheredataZ: number,
	spheredataScale: number
): u32 {
	const spheres = [
		new Sphere(new Vector(0, 4.5, 0), 4, new Vector(128, 0, 255)),
		new Sphere(
			new Vector(spheredataX, spheredataY, spheredataZ),
			spheredataScale,
			new Vector(255, 128, 0)
		),
	];
	let bounces: number = 2;
	const u = pixelX;
	const v = pixelY;

	let lightDirection = new Vector(-1, -1, 1).normalize();
	let rayOrigin = new Vector(0, 0, 1).normalize();
	let rayDirection = new Vector(u, v, -1).normalize();
	let multiplier: f64 = 1;

	let RGBValues = [0, 0, 0];

	for (let i = 0; i < bounces; i++) {
		let hitInfo = traceRay(rayOrigin, rayDirection, spheres);

		if (hitInfo.didHit) {
			let RGBVal = calculateColor(
				hitInfo,
				lightDirection,
				spheres,
				<i32>hitInfo.Index
			);

			for (let j = 0; j < RGBValues.length; j++) {
				RGBValues[j] += <i32>Math.round(<f64>RGBVal[j] * multiplier);
			}

			multiplier *= <f64>0.7;

			rayOrigin = hitInfo.Position.add(hitInfo.Normal.multiply(0.0001));
			rayDirection = rayDirection.reflect(hitInfo.Normal);
		}
	}

	return 0x00000000 | (RGBValues[0] << 16) | (RGBValues[1] << 8) | RGBValues[2];
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
