import React from "react";
import "./Inspector.css";

function Inspector(props) {
	return (
		<div className="Inspector">
			<div className="InspectorChild">
				<div>Transform</div>
				<div className="InspectorChildProp">
					<div className="InspectorChildPropTitle">Position</div>
					<div className="InspectorChildPropContent">
						<label className="InspectorChildPropContentLabel">X:</label>
						<input
							className="InspectorChildPropContentInput"
							type="number"
							value={props.Position[0]}
							onChange={(e) => {
								const newPos = [
									parseFloat(e.target.value),
									props.Position[1],
									props.Position[2],
								];
								props.SetPosition(newPos);
							}}
						/>
						<label className="InspectorChildPropContentLabel">Y:</label>
						<input
							className="InspectorChildPropContentInput"
							type="number"
							value={props.Position[1]}
							onChange={(e) => {
								const newPos = [
									props.Position[0],
									parseFloat(e.target.value),
									props.Position[2],
								];
								props.SetPosition(newPos);
							}}
						/>
						<label className="InspectorChildPropContentLabel">Z:</label>
						<input
							className="InspectorChildPropContentInput"
							type="number"
							value={props.Position[2]}
							onChange={(e) => {
								const newPos = [
									props.Position[0],
									props.Position[1],
									parseFloat(e.target.value),
								];
								props.SetPosition(newPos);
							}}
						/>
					</div>
					<div className="InspectorChildPropTitle">Scale</div>
					<div className="InspectorChildPropContent">
						<input
							className="InspectorChildPropContentInput"
							type="number"
							value={props.Scale}
							onChange={(e) => {
								props.SetScale(parseFloat(e.target.value));
							}}
						/>
					</div>
					<div className="InspectorChildPropTitle">Color (RGB)</div>
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
									value={props.Color[index]}
									onChange={(e) => {
										const newColor = [...props.Color];
										newColor[index] = parseFloat(e.target.value);
										props.SetColor(newColor);
									}}
								/>
							</React.Fragment>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

export default Inspector;
