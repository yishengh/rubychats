import axios from 'axios'
import router from '@/router'
import { Message } from 'element-ui'

const http = axios.create({
	baseURL: process.env.VUE_APP_BASE_API,
	timeout: 1000 * 30,
	withCredentials: true,
	headers: {
		'Content-Type': 'application/json; charset=utf-8'
	}
})

/**
 * Request Interceptor
 */
http.interceptors.request.use(config => {
	let accessToken = sessionStorage.getItem("accessToken");
	if (accessToken) {
		config.headers.accessToken = encodeURIComponent(accessToken);
	}
	return config
}, error => {
	return Promise.reject(error)
})

/**
 * Response Interceptor
 */
http.interceptors.response.use(async response => {
	if (response.data.code == 200) {
		return response.data.data;
	} else if (response.data.code == 400) {
		router.replace("/login");
	} else if (response.data.code == 401) {
		console.log("Token expired, attempting to refresh");
		let refreshToken = sessionStorage.getItem("refreshToken");
		if (!refreshToken) {
			router.replace("/login");
		}
		// Send a request to refresh the token and get a new one
		const data = await http({
			method: 'put',
			url: '/refreshToken',
			headers: {
				refreshToken: refreshToken
			}
		}).catch(() => {
			router.replace("/login");
		})
		// Save the new tokens
		sessionStorage.setItem("accessToken", data.accessToken);
		sessionStorage.setItem("refreshToken", data.refreshToken);
		// Clear headers here; otherwise, it will cause an error when making the request again
		response.config.headers = undefined;
		// Resend the original request
		return http(response.config)
	} else {
		Message({
			message: response.data.message,
			type: 'error',
			duration: 1500,
			customClass: 'element-error-message-zindex'
		})
		return Promise.reject(response.data)
	}
}, error => {
	switch (error.response.status) {
		case 400:
			Message({
				message: error.response.data,
				type: 'error',
				duration: 1500,
				customClass: 'element-error-message-zindex'
			})
			break
		case 401:
			router.replace("/login");
			break
		case 405:
			Message({
				message: 'Incorrect http request method',
				type: 'error',
				duration: 1500,
				customClass: 'element-error-message-zindex'
			})
			break
		case 404:
		case 500:
			Message({
				message: 'The server encountered a small problem, please try again later',
				type: 'error',
				duration: 1500,
				customClass: 'element-error-message-zindex'
			})
			break
		case 501:
			Message({
				message: 'The server does not support a feature needed for the current request',
				type: 'error',
				duration: 1500,
				customClass: 'element-error-message-zindex'
			})
			break
	}

	return Promise.reject(error)
})

export default http
