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

	let TrianglesData = null;
	let Trianglenormals = null;

	const [spheres, setSpheres] = useState([
		// Blue planet in the center
		{
			Position: [0.0, -101.0, 0.0],
			Scale: 100.0,
			Color: [0.9, 0.9, 0.9],
			Roughness: 0.7,
			Emission: [0.0, 0.0, 0.0],
		},
		// Red moon orbiting the planet
		{
			Position: [0, -0.1, -1.5],
			Scale: 1.0,
			Color: [0.9, 0.0, 0.0],
			Roughness: 0.6,
			Emission: [0.0, 0.0, 0.0],
		},
		// Distant white sun emitting light
		{
			Position: [-50.0, 30.0, -60.0],
			Scale: 40.0,
			Color: [1.0, 1.0, 0.9],
			Roughness: 0.1,
			Emission: [5.0, 5.0, 0.9], // Emitting light
		},
		// Green floating island/vegetation 1
		{
			Position: [7.0, 3.0, -5.0],
			Scale: 5.0,
			Color: [1.0, 1.0, 1.0],
			Roughness: 0.0,
			Emission: [0.0, 0.0, 0.0],
		},
		// Green floating island/vegetation 2
		{
			Position: [-3.5, -0.1, -2.5],
			Scale: 1.0,
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

	function parseOBJ(objText) {
		// Initialize arrays to hold the different kinds of data in the OBJ file
		const vertices = [];
		const textures = [];
		const normals = [];
		const faces = [];

		// Split the input text into lines
		const objLines = objText.split("\n");

		// Loop through each line
		for (let line of objLines) {
			// Trim whitespace and skip empty lines/comments
			line = line.trim();
			if (line === "" || line.startsWith("#")) continue;

			const components = line.split(/\s+/);
			const type = components[0];

			switch (type) {
				case "v": // Geometric vertices
					vertices.push(components.slice(1).map(Number));
					break;
				case "vt": // Texture coordinates
					textures.push(components.slice(1).map(Number));
					break;
				case "vn": // Vertex normals
					normals.push(components.slice(1).map(Number));
					break;
				case "f": // Face definitions
					// This assumes that the face vertices are defined in the format "v/vt/vn"
					const face = components.slice(1).map((face) => {
						// For each vertex definition, we may have a vertex index, a texture index, and a normal index
						const [v, vt, vn] = face
							.split("/")
							.map((numStr) => parseInt(numStr) || undefined);
						// OBJ indices are 1-based, we adjust them to be 0-based
						return {
							v: v ? v - 1 : undefined,
							vt: vt ? vt - 1 : undefined,
							vn: vn ? vn - 1 : undefined,
						};
					});
					faces.push(face);
					break;
				// Other data types like 'vp' (parameter space vertices), 's' (smoothing group), and 'usemtl' (material) are not handled in this simple example.
				// Add additional cases as needed.
			}
		}

		// Log out the parsed data

		// Return the parsed data
		return { vertices, textures, normals, faces };
	}

	function parseOBJToTriangles(objText) {
		const vertices = [];
		const triangles = [];

		const objLines = objText.split("\n");

		for (let line of objLines) {
			line = line.trim();
			if (line === "" || line.startsWith("#")) continue;

			const components = line.split(/\s+/);
			const type = components[0];

			switch (type) {
				case "v":
					// Convert to numbers and store each vertex
					vertices.push(components.slice(1).map(Number));
					break;
				case "f":
					// This assumes all faces are triangles or quads
					const faceVertices = components.slice(1).map((component) => {
						// We're only interested in the vertex index (1-based index in OBJ files)
						return parseInt(component.split("/")[0], 10) - 1; // Convert to 0-based index
					});
					// For a triangle, just add the vertex indices
					if (faceVertices.length === 3) {
						triangles.push(...faceVertices);
					}
					// For a quad, split it into two triangles
					else if (faceVertices.length === 4) {
						// First triangle
						triangles.push(faceVertices[0], faceVertices[1], faceVertices[2]);
						// Second triangle
						triangles.push(faceVertices[0], faceVertices[2], faceVertices[3]);
					}
					// More complex polygons are not handled in this example
					break;
			}
		}

		// At this point, triangles array contains indices to vertex array
		// If you need actual vertices data (for example, for WebGL buffers), you have to unpack them
		const unpackedTriangles = [];
		for (let i = 0; i < triangles.length; i += 3) {
			unpackedTriangles.push(
				...vertices[triangles[i]],
				...vertices[triangles[i + 1]],
				...vertices[triangles[i + 2]]
			);
		}

		// Log the unpacked triangles
		console.log(unpackedTriangles);

		return unpackedTriangles;
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

			//const VerticesArray = new Float32Array(RayTraceData.vertices);

			const TrianglesArray = new Float32Array(TrianglesData);

			const NormalsArray = new Float32Array(Trianglenormals.flat());

			//const VerticesArrayLocation = gl.getUniformLocation(
			//	shaderProgram,
			//	"u_VerticesArray"
			//);
			const TrianglesArrayLocation = gl.getUniformLocation(
				shaderProgram,
				"u_TrianglesArray"
			);
			const NormalsArrayLocation = gl.getUniformLocation(
				shaderProgram,
				"u_NormalsArray"
			);
			//gl.uniform3fv(VerticesArrayLocation, VerticesArray);
			gl.uniform1fv(NormalsArrayLocation, NormalsArray);

			gl.uniform1fv(TrianglesArrayLocation, TrianglesArray);

			var u_timeLocation = gl.getUniformLocation(shaderProgram, "u_time");
			gl.uniform1f(u_timeLocation, time);

			gl.clearColor(1.0, 0.0, 0.0, 1.0);
			gl.clear(gl.COLOR_BUFFER_BIT);

			// Draw the rectangle
			gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

			const pixels = new Uint8Array(900 * 900 * 4);
			gl.readPixels(0, 0, 900, 900, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

			let Pcount = 0;
			// Update the Accumulator array
			for (let i = 0; i < pixels.length; i++) {
				Accumulator[i] += pixels[i] * 1000;
				if (pixels[i] > 100.0) {
					Pcount++;
				}
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
			fetch("basicCube.obj")
				.then((response) => response.text())
				.then((objText) => {
					let objTextCpy = objText;
					const objData = parseOBJ(objTextCpy);
					console.log(objData.normals);

					Trianglenormals = objData.normals;

					let TD = parseOBJToTriangles(objText);
					TrianglesData = TD;

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
		});
	}

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
											max="1000"
											step="0.1"
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
