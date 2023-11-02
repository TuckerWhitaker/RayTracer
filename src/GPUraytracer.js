import React, { useCallback, useEffect, useRef, useState } from "react";
import DropDown from "./DropDown";
import "./GPUraytracer.css";
import Inspector from "./Inspector";

function GPUraytracer() {
	const canvasRef = useRef(null);
	const canvasRef1 = useRef(null);
	const [Accumulator, setAccumulator] = useState(
		new Float64Array(900 * 900 * 4)
	); // Assuming a 900x900 canvas
	const [Position, SetPosition] = useState([0.5, -0.1, -3.0]);

	const [spheres, setSpheres] = useState([
		// Blue planet in the center
		{
			Position: [0.0, -101.0, 0.0],
			Scale: 100.0,
			Color: [0.0, 0.4, 1.0],
			Roughness: 0.7,
			Emission: [0.0, 0.0, 0.0],
		},
		// Red moon orbiting the planet
		{
			Position: [0, -0.1, -3.5],
			Scale: 1.0,
			Color: [0.9, 0.0, 0.0],
			Roughness: 0.6,
			Emission: [0.0, 0.0, 0.0],
		},
		// Distant white sun emitting light
		{
			Position: [-50.0, 30.0, -60.0],
			Scale: 40.0,
			Color: [1.0, 1.0, 1.0],
			Roughness: 0.1,
			Emission: [1.0, 1.0, 1.0], // Emitting light
		},
		// Green floating island/vegetation 1
		{
			Position: [3.0, 0.0, -4.0],
			Scale: 1.2,
			Color: [1.0, 1.0, 1.0],
			Roughness: 0.0,
			Emission: [0.0, 0.0, 0.0],
		},
		// Green floating island/vegetation 2
		{
			Position: [-1.0, -0.6, -2.0],
			Scale: 0.5,
			Color: [0.0, 0.8, 0.0],
			Roughness: 0.7,
			Emission: [0.0, 0.0, 0.0],
		},
	]);

	const [selectedSphereIndex, setSelectedSphereIndex] = useState(0);
	const selectedSphere = spheres[selectedSphereIndex];

	let renderCount = 10;

	const updateSphereData = (index, data) => {
		const newSpheres = [...spheres];
		newSpheres[index] = { ...newSpheres[index], ...data };
		setSpheres(newSpheres);
	};

	function delay(time) {
		return new Promise((resolve) => setTimeout(resolve, time));
	}

	function processAccumulatorData(accumulator, count, width, height) {
		const data = new Uint8ClampedArray(width * height * 4);
		for (let i = 0; i < accumulator.length; i++) {
			data[i] = accumulator[i] / count;
		}
		return new ImageData(data, width, height);
	}

	const render = useCallback(
		(gl, shaderProgram, vertexBuffer, time) => {
			spheres.forEach((sphere, index) => {
				gl.uniform3fv(
					gl.getUniformLocation(shaderProgram, `u_SpherePosition${index}`),
					new Float32Array(sphere.Position)
				);
				gl.uniform1f(
					gl.getUniformLocation(shaderProgram, `u_SphereScale${index}`),
					sphere.Scale
				);
				gl.uniform3fv(
					gl.getUniformLocation(shaderProgram, `u_MaterialColor${index}`),
					new Float32Array(sphere.Color)
				);
				gl.uniform1f(
					gl.getUniformLocation(shaderProgram, `u_MaterialRoughness${index}`),
					sphere.Roughness
				);
				gl.uniform3fv(
					gl.getUniformLocation(shaderProgram, `u_MaterialEmission${index}`),
					new Float32Array(sphere.Emission)
				);
			});

			// Get the attribute and uniform locations, enable them
			var coord = gl.getAttribLocation(shaderProgram, "coordinates");
			gl.vertexAttribPointer(
				coord,
				2,
				gl.FLOAT,
				false,
				4 * Float32Array.BYTES_PER_ELEMENT,
				0
			);
			gl.enableVertexAttribArray(coord);

			var textureCoord = gl.getAttribLocation(shaderProgram, "textureCoord");
			gl.vertexAttribPointer(
				textureCoord,
				2,
				gl.FLOAT,
				false,
				4 * Float32Array.BYTES_PER_ELEMENT,
				2 * Float32Array.BYTES_PER_ELEMENT
			);
			gl.enableVertexAttribArray(textureCoord);

			var u_timeLocation = gl.getUniformLocation(shaderProgram, "u_time");
			gl.uniform1f(u_timeLocation, time);

			gl.clearColor(1.0, 0.0, 0.0, 1.0);
			gl.clear(gl.COLOR_BUFFER_BIT);

			// Draw the rectangle
			gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

			const pixels = new Uint8Array(900 * 900 * 4);
			gl.readPixels(0, 0, 900, 900, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

			// Update the Accumulator array
			for (let i = 0; i < pixels.length; i++) {
				Accumulator[i] += pixels[i];
			}
			setAccumulator(Accumulator);
		},
		[spheres, renderCount]
	);

	function resetCanvases() {
		// Clear the WebGL canvas

		const gl = canvasRef.current.getContext("webgl");
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);

		// Clear the 2D canvas
		//const ctx = canvasRef1.current.getContext("2d");
		//ctx.clearRect(0, 0, canvasRef1.current.width, canvasRef1.current.height);

		for (let i = 0; i < Accumulator.length; i++) {
			Accumulator[i] -= Accumulator[i];
		}
		setAccumulator(Accumulator);
	}

	function Setup() {
		console.log(spheres);
		const canvas = canvasRef.current;
		const canvas1 = canvasRef1.current;
		const gl = canvas.getContext("webgl");
		const ctx = canvas1.getContext("2d");

		resetCanvases();

		if (gl === null) {
			alert("WebGL not supported");
			return;
		}

		Promise.all([
			fetch("./vertexShader.glsl").then((response) => response.text()),
			fetch("./fragmentShader.glsl").then((response) => response.text()),
		]).then((shaders) => {
			const [vertShaderCode, fragShaderCode] = shaders;
			const start = Date.now();
			// Create the Vertex Shader object
			var vertShader = gl.createShader(gl.VERTEX_SHADER);

			// Attach the source code to the shader object
			gl.shaderSource(vertShader, vertShaderCode);

			// Compile the shader
			gl.compileShader(vertShader);

			// Check for compilation errors
			if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
				console.error(
					"ERROR compiling vertex shader!",
					gl.getShaderInfoLog(vertShader)
				);
			}

			// Fragment Shader code

			// Create the Fragment Shader object
			var fragShader = gl.createShader(gl.FRAGMENT_SHADER);

			// Attach the source code to the shader object
			gl.shaderSource(fragShader, fragShaderCode);

			// Compile the shader
			gl.compileShader(fragShader);

			// Check for compilation errors
			if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
				console.error(
					"ERROR compiling fragment shader!",
					gl.getShaderInfoLog(fragShader)
				);
			}

			// Create a shader program object
			var shaderProgram = gl.createProgram();

			// Attach the vertex shader to the program object
			gl.attachShader(shaderProgram, vertShader);

			// Attach the fragment shader to the program object
			gl.attachShader(shaderProgram, fragShader);

			// Link the program object to the WebGL context
			gl.linkProgram(shaderProgram);

			// Check for linking errors
			if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
				console.error(
					"ERROR linking program!",
					gl.getProgramInfoLog(shaderProgram)
				);
			}

			// Use the program object
			gl.useProgram(shaderProgram);
			// Create a buffer and put the vertices in it
			var vertexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
			var vertices = new Float32Array([
				-1, 1, 0, 1, -1, -1, 0, 0, 1, -1, 1, 0, 1, 1, 1, 1,
			]);

			gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

			// Bind the buffer, i.e., let's use the buffer we've just created
			gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

			for (let i = 1; i < renderCount; i++) {
				var time = Math.random();
				render(gl, shaderProgram, vertexBuffer, time);
			}
			const imageData = processAccumulatorData(
				Accumulator,
				renderCount,
				canvas.width,
				canvas.height
			);

			const end = Date.now();
			console.log(`Execution time: ${end - start} ms`);
			// Draw the ImageData to the canvas
			ctx.putImageData(imageData, 0, 0);
		});
	}

	useEffect(() => {
		//Setup();
	}, []);

	useEffect(() => {
		Setup();
	}, [spheres]);

	return (
		<div className="GPUraytracer">
			<div className="objectList">
				{spheres.map((_, index) => (
					<button
						key={index}
						className={`sphereButton ${
							index === selectedSphereIndex ? "active" : ""
						}`}
						onClick={() => setSelectedSphereIndex(index)}
					>
						Sphere {index + 1}
					</button>
				))}
			</div>
			<div className="Column">
				<canvas id="canvas0" ref={canvasRef} width={900} height={900}></canvas>
				<canvas id="canvas1" ref={canvasRef1} width={900} height={900}></canvas>
			</div>
			<div className="Column">
				{selectedSphereIndex}
				<DropDown
					ID={0}
					Header={"Transform"}
					Content={
						<Inspector
							Position={selectedSphere.Position}
							Scale={selectedSphere.Scale}
							Color={selectedSphere.Color}
							Roughness={selectedSphere.Roughness}
							SetPosition={(newPos) =>
								updateSphereData(selectedSphereIndex, { Position: newPos })
							}
							SetScale={(newScale) =>
								updateSphereData(selectedSphereIndex, { Scale: newScale })
							}
							SetColor={(newColor) =>
								updateSphereData(selectedSphereIndex, { Color: newColor })
							}
							SetRoughness={(newRoughness) =>
								updateSphereData(selectedSphereIndex, {
									Roughness: newRoughness,
								})
							}
						></Inspector>
					}
				></DropDown>
				<DropDown
					ID={1}
					Header={"Material"}
					Content={
						<div className="InspectorChildPropTitle">
							Color (RGB)
							<div className="InspectorChildPropContent">
								{["R", "G", "B"].map((channel, index) => (
									<React.Fragment key={channel}>
										<label className="InspectorChildPropContentLabel">
											{channel}:
										</label>
										<input
											className="InspectorChildPropContentInput"
											type="number"
											min="0"
											max="1"
											step="0.1"
											value={selectedSphere.Color[index]}
											onChange={(e) => {
												const newColor = [...selectedSphere.Color];
												newColor[index] = parseFloat(e.target.value);
												updateSphereData(selectedSphereIndex, {
													Color: newColor,
												});
											}}
										/>
									</React.Fragment>
								))}
							</div>
							Emission Color (RGB)
							<div className="InspectorChildPropContent">
								{["R", "G", "B"].map((channel, index) => (
									<React.Fragment key={channel}>
										<label className="InspectorChildPropContentLabel">
											{channel}:
										</label>
										<input
											className="InspectorChildPropContentInput"
											type="number"
											min="0"
											max="1"
											step="0.01"
											value={selectedSphere.Emission[index]}
											onChange={(e) => {
												const newColor = [...selectedSphere.Emission];
												newColor[index] = parseFloat(e.target.value);
												updateSphereData(selectedSphereIndex, {
													Emission: newColor,
												});
											}}
										/>
									</React.Fragment>
								))}
							</div>
							<label>Roughness: </label>
							<input
								className="InspectorChildPropContentInput"
								type="number"
								value={selectedSphere.Roughness}
								step={0.1}
								onChange={(e) => {
									const newRoughness = parseFloat(e.target.value);
									updateSphereData(selectedSphereIndex, {
										Roughness: newRoughness,
									});
								}}
							></input>
						</div>
					}
				></DropDown>
				<button
					onClick={() => {
						Setup();
					}}
				>
					Render
				</button>
				<button
					onClick={() => {
						renderCount = 1000;
						Setup();
					}}
				>
					FullRender
				</button>
			</div>
		</div>
	);
}

export default GPUraytracer;
