import React, { useEffect, useState } from "react";
import "./App.css";

function App() {
	const [wasmModule, setWasmModule] = useState(null);
	const [result, setResult] = useState(0);
	const [imageData, setImageData] = useState(null);

	useEffect(() => {
		fetch("/release.wasm")
			.then((response) => response.arrayBuffer())
			.then((bytes) => {
				// Define memory for the WebAssembly module
				const memory = new WebAssembly.Memory({ initial: 512, maximum: 4096 });

				// Define the imports object
				const imports = {
					env: {
						memory, // Provide memory as an import
						// Define the abort function
						abort: (_msg, _file, line, column) => {
							console.error(`abort called at ${_file}:${line}:${column}`);
						},
						// Additional environment functions can be added here if needed
					},
				};

				// Instantiate the WebAssembly module with the imports
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
			// Define the input data
			const sphereCenters = [0, 0, -5];
			const sphereRadii = [1];
			const sphereColors = [255, 0, 0]; // Red sphere
			const width = 12;
			const height = 12;

			// Call the render function

			const pixels = new Uint8Array(
				wasmModule.exports.memory.buffer,
				wasmModule.exports.render(
					sphereCenters,
					sphereRadii,
					sphereColors,
					width,
					height
				),
				width * height * 4
			);
			console.log("PIXELS LENGTH");
			console.log(pixels.length, 4 * width * height);
			console.log(pixels);

			// Create an ImageData object from the pixel data
			const imageData = new ImageData(
				new Uint8ClampedArray(pixels.buffer, pixels.byteOffset, pixels.length),
				width,
				height
			);

			console.log(imageData);

			// Set the imageData state
			setImageData(imageData);
		}
	}, [wasmModule]);

	return (
		<div className="App">
			{imageData && (
				<canvas
					ref={(canvas) => {
						if (canvas) {
							const ctx = canvas.getContext("2d");
							if (ctx) {
								ctx.putImageData(imageData, 0, 0);
							}
						}
					}}
					width={imageData.width}
					height={imageData.height}
				/>
			)}
		</div>
	);
}

export default App;
