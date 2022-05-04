export default class Request {
	config: {
		baseUrl: '',
		header: {
			'Content-Type': ''
		},
		data: {}, // Object/String/ArrayBuffer	 请求的参数
		method: "GET",
		dataType: "json", // 如设为json，会对返回的数据做一次 JSON.parse
		responseType: "text", // 设置响应的数据类型。合法值：text、arraybuffer
		timeout: 30000, // 超时时间，单位 ms
		custom,
		sslVerify: true, // 是否验证 ssl 证书
		success() {}, // 收到开发者服务器成功返回的回调函数
		fail() {}, // 接口调用失败的回调函数
		complete() {} // 接口调用结束的回调函数（调用成功、失败都会执行）
	}

	/* 判断url是否为绝对路径 */
	static verifyUrl(url) {
		return /(http|https):\/\/([\w.]+\/?)\S*/.test(url)
	}

	/* 拼接请求参数 */
	static addQueryParams(params) {
		let paramsData = ''
		Object.keys(params).forEach(key => {
			// 把字符串作为 URI 组件进行编码。
			paramsData += key + '=' + encodeURIComponent(params[key])
		})
		return paramsData.substring(0, paramsData.length - 1)
	}

	/* url路径拼接 */
	static mergeUrl(url, baseUrl, params) {
		// 如果不是完整路径则拼接baseUrl
		let mergeUrl = Request.verifyUrl(url) ? url : `${baseUrl}${url}`
		if (Object.keys(params).length !== 0) {
			const paramsD = Request.addQueryParams(params)
			mergeUrl += mergeUrl.includes('?') ? `&${paramsD}` : `?${paramsD}`
		}
	}


	/**
	 * @property {Function} request 请求拦截器
	 * @property {Function} response 响应拦截器
	 * @type {{request: Request.interceptor.request, 
			   response: Request.interceptor.response}}
	 */
	interceptor: {

		/**
		 * @param {Request~requestCallback} cb - 请求之前拦截,
		 * 接收一个函数（config, cancel）=> {return config}。
		 * 第一个参数为全局config,第二个参数为函数，调用则取消本次请求。
		 */
		request: (cb) => {
			if (cb) {
				this.requestBeforFun = cb
			}
		},
		/**
		 * @param {Request~responseCallback} cb 响应拦截器，对响应数据做点什么
		 * @param {Request~responseErrCallback} ecb 响应拦截器，对响应错误做点什么
		 */
		response: (cb, ecb) {
			if (ob) {
				this.requestComFun = ob
			}
			if (ecb) {
				this.requestComFail = ecb
			}
		}
	}

	/* 请求之前的函数 */
	requestBeforFun(config) {
		return config
	}
	/* 请求成功的函数 */
	requestComFun(response) {
		return response
	}
	/* 请求失败的函数 */
	requestComFail(response) {
		return response
	}

	/**
	 * 自定义验证器，如果返回true 则进入响应拦截器的响应成功函数(resolve)，
	 * 否则进入响应拦截器的响应错误函数(reject)
	 * @param { Number } statusCode - 请求响应体statusCode（只读）
	 * @return { Boolean } 如果为true,则 resolve, 否则 reject
	 */
	validateStatus(statusCode) {
		return statusCode === 200
	}

	/**
	 * @Function
	 * @param {Request~setConfigCallback}f --> function 设置全局默认配置 
	 */
	setConfig(f) {
		this.config = f(this.config)
	}

	/**
	 * @Function 参数说明
	 * @param {Object} options - 请求配置项
	 * @prop {String} options.baseUrl - 请求地址
	 * @prop {String} options.url - 请求路径
	 * @prop {String} options.timeout - 请求超时时间
	 * @prop {Object} [options.dataType = config.dataType] - 
	 * 				如果设为 json，会尝试对返回的数据做一次 JSON.parse
	 * @prop {Object} options.data - 请求参数
	 * @prop {Object} [options.responseType = config.responseType] 
	 * 				[text|arraybuffer] - 响应的数据类型
	 * @prop {Object} [options.header = config.header] - 请求header
	 * @prop {Object} [options.method = config.method] - 请求方法
	 * @prop {Object} [options.sslVerify ||  config.method] - 是否验证 ssl 证书
	 * @returns {Promise<unknown>}
	 */

	request(options = {}) {
		options.baseUrl = options.baseUrl || this.config.baseUrl //请求地址
		options.url = options.baseUrl + options.url //请求路径
		options.timeout = options.timeout || this.config.timeout // 请求超时时间
		options.dataType = options.dataType || this.config.dataType // 如果设为 json，会尝试对返回的数据做一次 JSON.parse
		options.data = options.data || {} // Object/String/ArrayBuffer	否		请求的参数
		options.params = options.params || {}
		options.responseType = options.responseType || this.config.responseType // 设置响应的数据类型
		options.header = options.header || this.config.header // 设置请求的 header，header 中不能设置 Referer。
		options.method = options.method || this.config.method
		options.custom = {
			...this.config.custom,
			...(options.custom || {})
		}
		// #ifdef APP-PLUS
		options.sslVerify = options.sslVerify === undefined ? this.config.sslVerify : options.sslVerify
		// #endif

		return new Promise((resolve, reject) => {
			let next = true
			const cancel = (t = 'handle candel', config = options) => {
				const err = {
					errMsg: t,
					config: config
				}
				reject(err)
				next = false
			}
			const handel = {
				...this.requestBeforFun(options, cancel)
			}
			const _config = {
				...handel
			}
			if (!next) return
			const requestTask = uni.request({
				url: Request.mergeUrl(_config.url, _config.baseUrl, _config.params),
				data: _config.data,
				header: _config.header,
				method: _config.method,
				timeout: _config.timeout,
				dataType: _config.dataType,
				responseType: _config.responseType,
				// #ifdef APP-PLUS
				sslVerify: _config.sslVerify,
				// #endif
				// 接口调用结束的回调函数（调用成功、失败都会执行）
				complete: (response) => {
					response.config = handleRe
					if (this.validateStatus(response.statusCode)) { // 成功
						response = this.requestComFun(response)
						resolve(response)
					} else {
						response = this.requestComFail(response)
						reject(response)
					}
				}
			})
		})
	}

	get(url, params = {}) {
		const options = {};
		options.params = params;
		return this.request({
			url,
			method: 'GET',
			...options
		})
	}

	post(url, data, options = {}) {
		return this.request({
			url,
			data,
			method: 'POST',
			...options
		})
	}

	upload(url, {
		files,
		// #ifdef MP-ALIPAY
		fileType,
		// #endif
		filePath,
		name,
		header,
		formData = {},
		custom = {},
		params = {},
		getTask
	}) {
		return new Promise((resolve, reject) => {
			let next = true
			const globalHeader = {
				...this.config.header
			}
			delete globalHeader['content-type']
			delete globalHeader['Content-Type']
			const pubConfig = {
				baseUrl: this.config.baseUrl,
				url,
				// #ifdef MP-ALIPAY
				fileType,
				// #endif
				filePath,
				method: 'UPLOAD',
				name,
				header: header || globalHeader,
				formData,
				params,
				custom: {
					...this.config.custom,
					...custom
				},
				getTask: getTask || this.config.getTask
			}
			// #ifdef APP-PLUS
			if (files) {
				pubConfig.files = files
			}
			// #endif
			const cancel = (t = 'handle cancel', config = pubConfig) => {
				const err = {
					errMsg: t,
					config: config
				}
				reject(err)
				next = false
			}

			const handleRe = {
				...this.requestBeforeFun(pubConfig, cancel)
			}
			const _config = {
				url: Request.mergeUrl(handleRe.url, handleRe.baseUrl, handleRe.params),
				// #ifdef MP-ALIPAY
				fileType: handleRe.fileType,
				// #endif
				filePath: handleRe.filePath,
				name: handleRe.name,
				header: handleRe.header,
				formData: handleRe.formData,
				complete: (response) => {
					response.config = handleRe
					if (typeof response.data === 'string') {
						response.data = JSON.parse(response.data)
					}
					if (this.validateStatus(response.statusCode)) { // 成功
						response = this.requestComFun(response)
						resolve(response)
					} else {
						response = this.requestComFail(response)
						reject(response)
					}
				}
			}
			// #ifdef APP-PLUS
			if (handleRe.files) {
				_config.files = handleRe.files
			}
			// #endif
			if (!next) return
			const requestTask = uni.uploadFile(_config)
			if (handleRe.getTask) {
				handleRe.getTask(requestTask, handleRe)
			}
		})
	}



}
