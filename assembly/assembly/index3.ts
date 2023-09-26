// raytracer.ts

class Vector {
	constructor(public x: f64, public y: f64, public z: f64) {}

	dot(other: Vector): f64 {
		return this.x * other.x + this.y * other.y + this.z * other.z;
	}
}

export function render(x: f64, y: f64): u32 {
	let radius = 0.8;
	let rayOrigin = new Vector(0, 0, 1.5);
	let rayDirection = new Vector(x, y, -1);

	let a = rayDirection.dot(rayDirection);
	let b = 2.0 * rayOrigin.dot(rayDirection);
	let c = rayOrigin.dot(rayOrigin) - radius * radius;

	let disc = b * b - 4 * a * c;
	if (disc < 0) {
		return 0xff000000; // Return black color with full alpha
	}

	let t1 = (-b - Math.sqrt(disc)) / (2 * a);
	let hitPoint = new Vector(
		rayOrigin.x + rayDirection.x * t1,
		rayOrigin.y + rayDirection.y * t1,
		rayOrigin.z + rayDirection.z * t1
	);

	let magnitude = Math.sqrt(
		hitPoint.x ** 2 + hitPoint.y ** 2 + hitPoint.z ** 2
	);

	hitPoint = new Vector(
		hitPoint.x / magnitude,
		hitPoint.y / magnitude,
		hitPoint.z / magnitude
	);

	let lightDir = new Vector(1, -1, 1);
	lightDir = new Vector(
		lightDir.x / magnitude,
		lightDir.y / magnitude,
		lightDir.z / magnitude
	);

	let d = Math.max(hitPoint.dot(lightDir), 0);

	let color = new Vector(0, 1, 1);
	color = new Vector(color.x * d, color.y * d, color.z * d);

	// Convert RGB to u32
	let R: u32 = (<u32>(color.x * 255)) << 24;
	let G: u32 = (<u32>(color.y * 255)) << 16;
	let B: u32 = (<u32>(color.z * 255)) << 8;
	let A: u32 = 0xff; // Full alpha

	return R | G | B | A;
}
