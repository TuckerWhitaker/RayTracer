// raytracer.ts

export function subtractVectors(
	ax: f64,
	ay: f64,
	az: f64,
	bx: f64,
	by: f64,
	bz: f64
): f64[] {
	return [ax - bx, ay - by, az - bz];
}

export function dotProduct(
	ax: f64,
	ay: f64,
	az: f64,
	bx: f64,
	by: f64,
	bz: f64
): f64 {
	return ax * bx + ay * by + az * bz;
}

export function normalize(ax: f64, ay: f64, az: f64): f64[] {
	let len = Math.sqrt(ax * ax + ay * ay + az * az);
	return [ax / len, ay / len, az / len];
}

export function intersectSphere(
	rayOx: f64,
	rayOy: f64,
	rayOz: f64,
	rayDx: f64,
	rayDy: f64,
	rayDz: f64,
	sphereCx: f64,
	sphereCy: f64,
	sphereCz: f64,
	sphereRadius: f64
): f64 {
	let oc = subtractVectors(rayOx, rayOy, rayOz, sphereCx, sphereCy, sphereCz);
	let a = dotProduct(rayDx, rayDy, rayDz, rayDx, rayDy, rayDz);
	let b = 2.0 * dotProduct(oc[0], oc[1], oc[2], rayDx, rayDy, rayDz);
	let c =
		dotProduct(oc[0], oc[1], oc[2], oc[0], oc[1], oc[2]) -
		sphereRadius * sphereRadius;
	let discriminant = b * b - 4 * a * c;

	if (discriminant < 0) {
		return -1.0;
	} else {
		return (-b - Math.sqrt(discriminant)) / (2.0 * a);
	}
}

export function render(
	sphereCenters: f64[],
	sphereRadii: f64[],
	sphereColors: f64[],
	width: i32,
	height: i32
): Uint8Array {
	let pixels = new Uint8Array(width * height * 4);
	let light = normalize(0, 1, 0);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let u = (f64(x) / width) * 2 - 1;
			let v = (f64(y) / height) * 2 - 1;
			let rayDir = normalize(u, v, -1);

			let closestT = Infinity;
			let hitSphereIndex = -1;

			for (let i = 0; i < sphereCenters.length; i += 3) {
				let t = intersectSphere(
					0,
					0,
					0,
					rayDir[0],
					rayDir[1],
					rayDir[2],
					sphereCenters[i],
					sphereCenters[i + 1],
					sphereCenters[i + 2],
					sphereRadii[i / 3]
				);
				if (t > 0 && t < closestT) {
					closestT = t;
					hitSphereIndex = i / 3;
				}
			}

			let index = (y * width + x) * 4;

			if (hitSphereIndex !== -1) {
				let hitColorIndex = hitSphereIndex * 3;
				let normal = subtractVectors(
					0 + rayDir[0] * closestT,
					0 + rayDir[1] * closestT,
					0 + rayDir[2] * closestT,
					sphereCenters[hitSphereIndex * 3],
					sphereCenters[hitSphereIndex * 3 + 1],
					sphereCenters[hitSphereIndex * 3 + 2]
				);
				let normalizedNormal = normalize(normal[0], normal[1], normal[2]);
				let diffuse = Math.max(
					0,
					dotProduct(
						light[0],
						light[1],
						light[2],
						normalizedNormal[0],
						normalizedNormal[1],
						normalizedNormal[2]
					)
				);

				pixels[index] = u8(sphereColors[hitColorIndex] * diffuse * 255);
				pixels[index + 1] = u8(sphereColors[hitColorIndex + 1] * diffuse * 255);
				pixels[index + 2] = u8(sphereColors[hitColorIndex + 2] * diffuse * 255);
				pixels[index + 3] = 255; // Alpha
			} else {
				pixels[index] = 0;
				pixels[index + 1] = 0;
				pixels[index + 2] = 0;
				pixels[index + 3] = 255; // Alpha
			}
		}
	}

	return pixels;
}
