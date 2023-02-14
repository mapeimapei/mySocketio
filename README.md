

## 介绍

vue3可用的socketio 核心代码：
- ①消息默认由useSocket中的setSocketMsg进行统一处理，满足一般的使用场景：后台推送消息，useSocket统一处理，vue组件再引用setSocketMsg或者setSocketMsgList进行业务开发。
- ②更优的解决方案是，前端和后端讨论好，定好module和action，消息推送过来，就会直接调用module下的action进行数据消费，这样就和其它消息进行了解耦
- ③当然，还有一些场景不需要通过store，这个时候，可以在组件中使用subscribe订阅消息，ps：onUnmounted中需要unsubscribe，参考socket.vue
- ④默认的event_name是SOCKET_MSG，可以自行修改或扩展新event_name，和后端对齐即可，不过绝大多数时候用不到
- 初始化和关闭功能最好放在登录成功和注销成功时分别调用，我习惯登录成功和注销成功时候，分别给总线上emit消息，需要在登录或注销后处理事件的地方自行显性监听即可，这样登录和注销就和其它功能解耦了。


## 依赖

- "pinia-plugin-persistedstate": "^3.0.2",
- "socket.io-client": "^4.6.0",
- "vue-3-socket.io": "^1.0.5",



## 文件说明

1. socket.io.ts： socket.io的二次封装，一般放在utils下
2. index.ts：store的index，仅供参考
3. socket.ts：store-socket
4. socket.vue 组件内使用的一些demo



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