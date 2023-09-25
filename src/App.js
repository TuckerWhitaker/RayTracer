import * as loader from "@assemblyscript/loader";
import React, { useEffect, useState } from "react";
import "./App.css";

function App() {
	const [wasmModule, setWasmModule] = useState(null);
	const [imageData, setImageData] = useState(null);

	useEffect(() => {
		fetch("/release.wasm")
			.then((response) => response.arrayBuffer())
			.then((bytes) => {
				const memory = new WebAssembly.Memory({ initial: 512, maximum: 4096 });

				const imports = {
					env: {
						memory,
						abort: (_msg, _file, line, column) => {
							console.error(`abort called at ${_file}:${line}:${column}`);
						},
					},
				};

				return WebAssembly.instantiate(bytes, imports);
			})
			.then((results) => {
				setWasmModule(results.instance);
			})
			.catch((error) => {
				console.error("Error loading WebAssembly module:", error);
			});
	}, []);

	useEffect(() => {
		if (wasmModule) {
		}

		//wasmModule.exports.render()
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

	return (
		<div className="App">
			<canvas width={200} height={200} id="canvas" />
			<button
				onClick={() => {
					// Get a reference to the canvas and its context
					const canvas = document.getElementById("canvas");
					const ctx = canvas.getContext("2d");
					ctx.imageSmoothingEnabled = false;

					// Set the canvas dimensions
					const width = (canvas.width = canvas.width);
					const height = (canvas.height = canvas.height);

					// Create an ImageData object
					const imgData = ctx.createImageData(width, height);

					for (let y = 0; y < height; y++) {
						for (let x = 0; x < width; x++) {
							// Call the render function to get the hit info for the current pixel
							const pointer = wasmModule.exports.render(
								(Number.parseFloat(x) / width) * 2 - 1,
								(Number.parseFloat(y) / height) * 2 - 1
							);

							const memoryBuffer = new Uint8Array(
								wasmModule.exports.memory.buffer
							);
							const dataView = new DataView(memoryBuffer.buffer);

							let color = largeIntToRGB(pointer);

							//const r = dataView.getFloat32(pointer);
							//const g = dataView.getFloat32(pointer + 4); // Next 4 bytes
							//const b = dataView.getFloat32(pointer + 8); // Next 4 bytes after g

							//console.log(r + " " + g + " " + b);
							const index = (y * width + x) * 4;
							//console.log(r);
							imgData.data[index + 0] = color[0]; // Red
							imgData.data[index + 1] = color[1]; // Green
							imgData.data[index + 2] = color[2]; // Blue
							imgData.data[index + 3] = 255; // Alpha (255 is fully opaque)

							/*
							// Read the data from the DataView
							const hit = dataView.getUint8(pointer) !== 0;
							const distance = dataView.getFloat64(pointer + 1, true);
							const normalOffset = pointer + 1 + 8; // adjust this based on the actual memory layout
							const normal = {
								x: dataView.getFloat64(normalOffset, true),
								y: dataView.getFloat64(normalOffset + 8, true),
								z: dataView.getFloat64(normalOffset + 16, true),
							};

							// Calculate the index in the image data array
							const index = (y * width + x) * 4;

							if (hit) {
								// If there is a hit, use the normal to compute a simple shading
								const shade = (normal.y + 1) * 0.5; // normal.y is in range [-1, 1], we map it to [0, 1]
								imgData.data[index + 0] = shade * 255; // Red
								imgData.data[index + 1] = shade * 255; // Green
								imgData.data[index + 2] = shade * 255; // Blue
							} else {
								// If there is no hit, set the background color (e.g., white)
								imgData.data[index + 0] = 0; // Red
								imgData.data[index + 1] = 0; // Green
								imgData.data[index + 2] = 0; // Blue
							}
							imgData.data[index + 3] = 255; // Alpha (255 is fully opaque)

							//wasmModule.exports.__release(pointer);
							*/
						}
					}

					// Put the image data on the canvas
					ctx.putImageData(imgData, 0, 0);
				}}
			>
				BUTTON
			</button>
		</div>
	);
}

export default App;
