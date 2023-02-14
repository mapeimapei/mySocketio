

## 介绍

vue3可用的socketio 核心代码



## 依赖

"pinia-plugin-persistedstate": "^3.0.2",
"socket.io-client": "^4.6.0",
"vue-3-socket.io": "^1.0.5",



## 文件说明

socket.io.ts： socket.io的二次封装，一般放在utils下
index.ts：store的index，仅供参考
socket.ts：store-socket
socket.vue 组件内使用的一些demo



## 其它

main.ts下的相关代码：

```js
import mitt from 'mitt'
import socketio from "@/utils/socket.io"
app.use(socketio)
app.config.globalProperties.$mittBus = mitt()
```


app下的相关代码：

```js
import mySocketio from "@/utils/socket.io"
const { proxy } = getCurrentInstance() as any

onMounted(() => {
	// 刷新页面 重新连接 socket
	!!storesAuth.access_token && mySocketio.init(proxy)

	// 监听 登录成功
	proxy.$mittBus.on("login", (data: any) => {
		// 连接 socket
		mySocketio.init(proxy)
	})
	
	// 监听 注销成功
	proxy.$mittBus.on("logOut", (data: any) => {
		console.log("onLoginFn", data)
		// 关闭 socket
		mySocketio.close(proxy)
	})

});

// 页面销毁时，关闭监听布局配置/i18n监听
onUnmounted(() => {
	// 关闭监听登录和注销
	proxy.$mittBus.off("login", () => { })
	proxy.$mittBus.off("logOut", () => { })
});
```

vite.config.ts 代理：

```js
'/socket.io': {
	target: env.VITE_API_URL, // 代理的目标地址
	changeOrigin: true,
},
```

.env.development：
```js
VITE_API_URL = 'http://localhost:9000'
```