import React, { useCallback, useEffect, useRef, useState } from "react";
import "./GPUraytracer.css";
import Inspector from "./Inspector";
function GPUraytracer() {
	const canvasRef = useRef(null);
	const canvasRef1 = useRef(null);
	const [Accumulator, setAccumulator] = useState(
		new Float64Array(900 * 900 * 4)
	); // Assuming a 900x900 canvas

	function processAccumulatorData(accumulator, count, width, height) {
		const data = new Uint8ClampedArray(width * height * 4);
		for (let i = 0; i < accumulator.length; i++) {
			data[i] = accumulator[i] / count;
		}
		return new ImageData(data, width, height);
	}

	const render = useCallback((gl, shaderProgram, vertexBuffer, time) => {
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
	}, []);

	useEffect(() => {
		const canvas = canvasRef.current;
		const canvas1 = canvasRef1.current;
		const gl = canvas.getContext("webgl");
		const ctx = canvas1.getContext("2d");

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

			let renderCount = 5000;

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
	}, []);

	return (
		<div className="GPUraytracer">
			<div className="Column">Object List</div>
			<div className="Column">
				<canvas id="canvas0" ref={canvasRef} width={900} height={900}></canvas>
				<canvas id="canvas1" ref={canvasRef1} width={900} height={900}></canvas>
			</div>
			<div className="Column">
				<Inspector></Inspector>
			</div>
		</div>
	);
}

export default GPUraytracer;
