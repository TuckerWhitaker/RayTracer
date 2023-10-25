import * as loader from "@assemblyscript/loader";
import { WASI } from "@wasmer/wasi";
import React, { useEffect, useState } from "react";
import "./App.css";

function App() {
	const Width = 100;
	const Height = 100;
	console.log("Expected Time: " + Width * Height * 0.0113625 + "ms");
	const [wasmModule, setWasmModule] = useState(null);
	const [Memory, SetMemory] = useState(null);

	let frameIndex = 1;
	let Accumulator = new Float64Array(Width * Height * 4);

	let memory = null;

	const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

	function PRNG(seed) {
		let state = seed;
		const a = 1664525;
		const c = 1013904223;
		const m = 2 ** 32;

		return {
			next: function () {
				state = (a * state + c) % m;
				return state / m;
			},
		};
	}
	function seed(value) {
		// Initialize the PRNG with the given seed value
		const prng = PRNG(value * Math.random());

		// Replace Math.random with the PRNG
		Math.random = prng.next;
	}

	useEffect(() => {
		const arraySize = (Width * Height * 4) >>> 0;
		const nPages = (((arraySize + 0xffff) & ~0xffff) >>> 16) + 3;
		//	console.log(nPages);
		memory = new WebAssembly.Memory({ initial: nPages });
		//memory = new WebAssembly.Memory({ initial: 1000, max: 10000 });
		SetMemory(memory);

		const imports = {
			env: {
				memory,
				abort: (_msg, _file, line, column) => {
					console.error(`abort called at ${_file}:${line}:${column}`);
				},
				exit: () => {
					throw new Error("Program called exit()");
				},
				seed: seed,
				"console.log": function (arg) {
					console.log(arg);
				},
				emscripten_memcpy_js: function (/* parameters */) {
					// Your implementation here...
				},
				emscripten_resize_heap: function (size) {
					return false;
					// Implementation or stub of the function
					// ...
				},

				// ... potentially other imported functions ...
			},
		};

		fetch("/test.wasm")
			.then((response) => {
				if (!response.ok) {
					throw new Error(`HTTP error! Status: ${response.status}`);
				}
				return response;
			})
			.then((response) => WebAssembly.instantiateStreaming(response, imports))
			.then((results) => {
				setWasmModule(results.instance);
			})
			.catch((error) => {
				console.error("Error loading WebAssembly module:", error);
			});
	}, []);

	useEffect(() => {
		const canvas = document.getElementById("canvas");
		const ctx = canvas.getContext("2d");
		//AccumulationData = ctx.createImageData(Width, Height);
	}, [wasmModule]);

	function largeIntToRGB(integer) {
		let binaryString = integer.toString(2).padStart(24, "0");

		let redBinary = binaryString.substring(0, 8);
		let greenBinary = binaryString.substring(8, 16);
		let blueBinary = binaryString.substring(16, 24);

		let red = parseInt(redBinary, 2);
		let green = parseInt(greenBinary, 2);
		let blue = parseInt(blueBinary, 2);

		return [red, green, blue];
	}

	async function RenderFrame() {
		const worker = new Worker("test.worker.js");
		console.log(worker);

		const start = Date.now();
		// Get a reference to the canvas and its context
		const canvas = document.getElementById("canvas");
		const ctx = canvas.getContext("2d");

		ctx.imageSmoothingEnabled = false;

		// Set the canvas dimensions
		const width = canvas.width;
		const height = canvas.height;

		ctx.fillStyle = "rgb(0, 0, 0, 255)";
		ctx.fillRect(0, 0, width, height);
		//console.log("cleared");

		// Create an ImageData object
		//const imgData = ctx.createImageData(width, height);

		const NUM_WORKERS = 4; // Adjust as needed
		const workers = [];
		const width_per_thread = width / NUM_WORKERS;
		console.log("B");
		for (let i = 0; i < NUM_WORKERS; i++) {
			const worker = new Worker("test.worker.js");
			worker.onerror = function (e) {
				console.log(e);
			};
			worker.onmessage = function (e) {
				console.log("worker on message");
				const { start_x, end_x, width, height, useSampling } = e.data;
				const result = wasmModule.exports.renderColumn(
					start_x,
					end_x,
					width,
					height,
					useSampling
				); // Assuming createArray is the name of the function exported from WebAssembly
				console.log(result);
				worker.postMessage(result);
				// Process result here, e.g., combine into final image
			};
			workers.push(worker);
			const start_x = i * width_per_thread;
			const end_x = (i + 1) * width_per_thread;
			let useSampling = true;
			//worker.postMessage({ start_x, end_x, width, height, useSampling });
			worker.postMessage({
				cmd: "render",
				start_x,
				end_x,
				width,
				height,
				useSampling,
			});
			console.log(workers);
		}
		console.log("B For loop eend");

		const pointer = wasmModule.exports.createArray(width, height, true, 1);
		//console.log(pointer);
		const uvMapRGB = new Int32Array(
			wasmModule.exports.memory.buffer,
			pointer,
			width * height * 3
		);
		//console.log(uvMapRGB);

		// Convert UV map from RGB to RGBA

		for (let i = 0, j = 0; i < uvMapRGB.length; i += 3, j += 4) {
			Accumulator[j] += uvMapRGB[i];
			Accumulator[j + 1] += uvMapRGB[i + 1];
			Accumulator[j + 2] += uvMapRGB[i + 2];
			Accumulator[j + 3] = 255; // Set alpha to fully opaque
		}
		const AccumulatedColor = new Uint8ClampedArray(width * height * 4);
		for (let i = 0; i < Accumulator.length; i += 4) {
			AccumulatedColor[i] = Accumulator[i] / frameIndex;
			AccumulatedColor[i + 1] = Accumulator[i + 1] / frameIndex;
			AccumulatedColor[i + 2] = Accumulator[i + 2] / frameIndex;
			AccumulatedColor[i + 3] = 255; // Set alpha to fully opaque
		}

		const imageData = new ImageData(AccumulatedColor, width, height);
		const end = Date.now();
		console.log(`Execution time: ${end - start} ms`);
		document.getElementById("executionTime").innerHTML = end - start + " ms";

		//console.log(imgData);
		// Put the image data on the canvas
		ctx.putImageData(imageData, 0, 0);
		//wasmModule.exports.free_uv_image(Ptr);

		await delay(50);
		frameIndex++;
		await delay(100);
		console.log(frameIndex);
		if (frameIndex <= 1) {
			await RenderFrame();
		}
	}

	return (
		<div className="App">
			<canvas width={Width} height={Height} id="canvas" />
			<div id="executionTime">0</div>
			<button
				onClick={async () => {
					frameIndex = 1;
					await RenderFrame();

					//console.log(`Execution time: ${end - start} ms`);
					//document.getElementById("executionTime").innerHTML =
					//	end - start + " ms";
				}}
			>
				BUTTON
			</button>
		</div>
	);
}

export default App;
