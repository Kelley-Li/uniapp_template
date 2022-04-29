export default class Request{
	config: {
		baseUrl: '',
		header: {
			'Content-Type': ''
		},
		data: {},
		method: "GET",
		dataType: "json",
		/* 如设为json，会对返回的数据做一次 JSON.parse */
		responseType: "text",
		timeout: 30000,
		success() {},
		fail() {},
		complete() {}
	}
	
	/* 判断url是否为绝对路径 */
	static verifyUrl(url) {
		return /(http|https):\/\/([\w.]+\/?)\S*/.test(url)
		
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

	/* 拼接请求参数 */
	static addQueryParams(params) {
		let paramsData = ''
		Object.keys(params).forEach(key => {
			// 把字符串作为 URI 组件进行编码。
			paramsData += key + '=' + encodeURIComponent(params[key])
		})
		return paramsData.substring(0, paramsData.length - 1)
	}
	/**
	 * @property {Function} request 请求拦截器
	 * @property {Function} response 响应拦截器
	 * @type {{request: Request.interceptor.request, response: Request.interceptor.response}}
	 */
	interceptor: {
		
		/**
		 * @param {Request~requestCallback} cb - 请求之前拦截,接收一个函数（config, cancel）=> {return config}。第一个参数为全局config,第二个参数为函数，调用则取消本次请求。
		 */
		request: (callback)=>{
			
		},
		response: null
	}
}
