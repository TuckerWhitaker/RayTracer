import "./Inspector.css";

function Inspector() {
	return (
		<div className="Inspector">
			<div className="InspectorChild">
				<div>Transform</div>
				<div className="InspectorChildProp">
					<div className="InspectorChildPropTitle">Position</div>
					<div className="InspectorChildPropContent">
						<label className="InspectorChildPropContentLabel">X:</label>
						<input className="InspectorChildPropContentInput"></input>
						<label className="InspectorChildPropContentLabel">Y:</label>
						<input className="InspectorChildPropContentInput"></input>
						<label className="InspectorChildPropContentLabel">Z:</label>
						<input className="InspectorChildPropContentInput"></input>
					</div>
				</div>
				<div>Scale: 0</div>
			</div>
		</div>
	);
}

export default Inspector;
