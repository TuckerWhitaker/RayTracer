function DropDown(props) {
	return (
		<div className="DropDown">
			<button
				className="DropDownHeaderBtn"
				onClick={() => {
					if (
						document.getElementById("DropDownContent" + props.ID).style
							.display == "none"
					) {
						document.getElementById(
							"DropDownContent" + props.ID
						).style.display = "flex";
					} else {
						document.getElementById(
							"DropDownContent" + props.ID
						).style.display = "none";
					}
				}}
			>
				<div>{props.Header}</div>
			</button>
			<div id={"DropDownContent" + props.ID}>{props.Content}</div>
		</div>
	);
}

export default DropDown;
