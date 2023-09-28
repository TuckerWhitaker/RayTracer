import * as loader from "@assemblyscript/loader";
import React, { useEffect, useState } from "react";
import "./App.css";

function App() {
	const [wasmModule, setWasmModule] = useState(null);
	const [imageData, setImageData] = useState(null);

	const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

	async function RenderFrame() {
		// Get a reference to the canvas and its context
		const canvas = document.getElementById("canvas");
		const ctx = canvas.getContext("2d");

		ctx.imageSmoothingEnabled = false;

		// Set the canvas dimensions
		const width = canvas.width;
		const height = canvas.height;

		ctx.fillStyle = "rgb(0, 0, 0, 255)";
		ctx.fillRect(0, 0, width, height);
		console.log("cleared");

		// Create an ImageData object
		const imgData = ctx.createImageData(width, height);

		let X = document.getElementById("X").value;
		let Y = document.getElementById("Y").value;
		let Z = document.getElementById("Z").value;
		let Scale = document.getElementById("Scale").value;

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				// Call the render function to get the hit info for the current pixel

				const pointer = wasmModule.exports.render(
					(Number.parseFloat(x) / width) * 2 - 1,
					(Number.parseFloat(y) / height) * 2 - 1,
					X,
					Y,
					Z,
					Scale
				);

				const memoryBuffer = new Uint8Array(wasmModule.exports.memory.buffer);
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
			}
		}

		// Put the image data on the canvas
		ctx.putImageData(imgData, 0, 0);
		await delay(1000);

		console.log(document.getElementById("CB").value);
		if (document.getElementById("CB").value == "on") {
			//RenderFrame();
		}
	}

	return (
		<div className="App">
			<canvas width={800} height={800} id="canvas" />
			<button
				onClick={async () => {
					RenderFrame();
				}}
			>
				BUTTON
			</button>
			<label>X: </label>
			<input id="X" step={0.1} type="number"></input>
			<label>Y: </label>
			<input id="Y" step={0.1} type="number"></input>
			<label>Z: </label>
			<input id="Z" step={0.1} type="number"></input>
			<label>Scale: </label>
			<input id="Scale" step={0.1} type="number"></input>
			<input id="CB" type="checkbox"></input>
		</div>
	);
}

export default App;
