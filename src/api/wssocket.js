var websock = null;
let rec; // Reconnect after a delay of 5 seconds when disconnected. "rec" is used to store the delayed request code.
let isConnect = false; // Connection flag to avoid repeated connections
let messageCallBack = null;
let closeCallBack = null;

let connect = (wsurl, accessToken) => {
	try {
		if (isConnect) {
			
			return;
		}
		console.log("Connecting to WebSocket");
		websock = new WebSocket(wsurl);
		websock.onmessage = function (e) {
			let sendInfo = JSON.parse(e.data);
			if (sendInfo.cmd == 0) {
				// Successful WebSocket login
				heartCheck.start();
				console.log('WebSocket login successful');
			} else if (sendInfo.cmd == 1) {
				// Restart the heartbeat timer
				heartCheck.reset();
			} else {
				// Forward other messages
				console.log("Received message:", sendInfo);
				messageCallBack && messageCallBack(sendInfo.cmd, sendInfo.data);
			}
		};
		websock.onclose = function (e) {
			console.log('WebSocket connection closed');
			isConnect = false; // Modify the flag after disconnection
			closeCallBack && closeCallBack(e);
		};
		websock.onopen = function () {
			console.log("WebSocket connection successful");
			isConnect = true;
			// Send login command
			let loginInfo = {
				cmd: 0,
				data: {
					accessToken: accessToken
				}
			};
			websock.send(JSON.stringify(loginInfo));
		};

		// Callback method when a connection error occurs
		websock.onerror = function () {
			console.log('WebSocket connection error');
			isConnect = false; // Modify the flag after disconnection
			reconnect(wsurl, accessToken);
		};
	} catch (e) {
		console.log("Failed to create connection");
		reconnect(wsurl, accessToken); // Reconnect if WebSocket connection fails
	}
};

// Define the reconnect function
let reconnect = (wsurl, accessToken) => {
	console.log('WebSocket connection opened:', websock.url);
	console.log("Attempting to reconnect");
	if (isConnect) {
		// If already connected, no need to reconnect
		return;
	}
	rec && clearTimeout(rec);
	rec = setTimeout(function () {
		connect(wsurl, accessToken);
	}, 15000);
};

// Set the close connection function
let close = (code) => {
	websock && websock.close(code);
};

// Heartbeat setting
let heartCheck = {
	timeout: 5000, // Send a heartbeat packet every 20 seconds
	timeoutObj: null, // Delayed sending message object (create this object when starting the heartbeat, reset the object after receiving the message)
	start: function () {
		if (isConnect) {
			console.log('Sending WebSocket heartbeat');
			let heartBeat = {
				cmd: 1,
				data: {}
			};
			websock.send(JSON.stringify(heartBeat));
		}
	},

	reset: function () {
		clearTimeout(this.timeoutObj);
		this.timeoutObj = setTimeout(function () {
			heartCheck.start();
		}, this.timeout);
	}
};

// Actual method to be called
let sendMessage = (agentData) => {
	if (websock.readyState === websock.OPEN) {
		// If the ws is open
		websock.send(JSON.stringify(agentData));
	} else if (websock.readyState === websock.CONNECTING) {
		// If it is in the process of opening, wait for 1s and call again
		setTimeout(function () {
			sendMessage(agentData);
		}, 1000);
	} else {
		// If not open, wait for 1s and call again
		setTimeout(function () {
			sendMessage(agentData);
		}, 1000);
	}
};

let onMessage = (callback) => {
	messageCallBack = callback;
};

let onClose = (callback) => {
	closeCallBack = callback;
};

// Expose the methods
export {
	connect,
	reconnect,
	close,
	sendMessage,
	onMessage,
	onClose
};
