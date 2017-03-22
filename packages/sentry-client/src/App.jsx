require('file?name=[name].[ext]!../static/index.html');

import React from "react";
import * as ReactDOM from "react-dom";
import Server from "./components/Server";

ReactDOM.render(
	<Server></Server>,
	document.getElementById("app")
);