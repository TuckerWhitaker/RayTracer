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
		const length = this.length();
		return new Vector(this.x / length, this.y / length, this.z / length);
	}
}
class Ray {
	constructor(public origin: Vector, public direction: Vector) {}
}

class Sphere {
	constructor(public center: Vector, public radius: number) {}

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

class Color {
	constructor(public color: u32) {}
}

function convert(value: f64): i32 {
	return <i32>value;
}

export function render(pixelX: number, pixelY: number): u32 {
	const sphere = new Sphere(new Vector(0, 0, 0), 0.5);
	const u = pixelX;
	const v = pixelY;

	let rayOrigin = new Vector(0, 0, 1);
	let rayDirection = new Vector(u, v, -1);
	let t = sphere.intersect(new Ray(rayOrigin, rayDirection));

	if (t == -1) {
		return 0x00000000;
	} else {
		let hitPos: Vector = rayOrigin.add(rayDirection.multiply(t));
		let normal = hitPos.sub(sphere.center).normalize();

		let r = u32((normal.x * 0.5 + 0.5) * 255);
		let g = u32((normal.y * 0.5 + 0.5) * 255);
		let b = u32((normal.z * 0.5 + 0.5) * 255);

		return 0xff000000 | (b << 16) | (g << 8) | r;
	}
}
