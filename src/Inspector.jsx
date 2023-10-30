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
							placeholder="0.5"
							onChange={(e) => {
								let newpos = [
									e.target.value,
									props.Position[1],
									props.Position[2],
								];
								props.SetPosition(newpos);
							}}
						></input>
						<label className="InspectorChildPropContentLabel">Y:</label>
						<input
							className="InspectorChildPropContentInput"
							type="number"
							placeholder="-0.1"
							onChange={(e) => {
								let newpos = [
									props.Position[0],
									e.target.value,
									props.Position[2],
								];
								props.SetPosition(newpos);
							}}
						></input>
						<label className="InspectorChildPropContentLabel">Z:</label>
						<input
							className="InspectorChildPropContentInput"
							type="number"
							placeholder="-3.0"
							onChange={(e) => {
								let newpos = [
									props.Position[0],
									props.Position[1],
									e.target.value,
								];
								props.SetPosition(newpos);
							}}
						></input>
					</div>
				</div>
				<div>Scale: 0</div>
			</div>
		</div>
	);
}

export default Inspector;
