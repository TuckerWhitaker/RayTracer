function DropDown(props) {
	return (
		<div className="DropDown">
			<button
				className="DropDownHeaderBtn"
				onClick={() => {
					if (
						document.getElementById("DropDownContent").style.display == "none"
					) {
						document.getElementById("DropDownContent").style.display = "flex";
					} else {
						document.getElementById("DropDownContent").style.display = "none";
					}
				}}
			>
				<div>{props.Header}</div>
				<div className="Arrow">^</div>
			</button>
			<div id="DropDownContent">{props.Content}</div>
		</div>
	);
}

export default DropDown;
