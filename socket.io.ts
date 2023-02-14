import VueSocketIO from 'vue-3-socket.io'
import io from 'socket.io-client'
import { App } from "vue"
import pinia, { stores } from '@/stores'

interface ISocketEvents {
    [key: string]: Function
}

interface IMsg {
    [key: string]: any
}

// 后端推送的消息体
interface IMsgRes {
    module?: string, // 对应store的模块
    action?: string, //  action方法
    data: IMsg //消息体
}

// 默认订阅的事件
// 和后端默认的event_name是SOCKET_MSG，可以自行修改，或扩展新event_name
const socketEvents = {
    // socket 消息处理，默认由 useSocket中的setSocketMsg进行处理
    // 也可以和后端对齐，传入module、action，使用对应module下的action处理消息
    SOCKET_MSG(res: IMsgRes) {
        let module = res.module ? res.module.replace(res.module[0], res.module[0].toUpperCase()) : "Socket"
        let action = res.action || "setSocketMsg"
        let data = res.data
        const store = stores["use" + module](pinia)
        store[action](data)
    },

    // 这是个测试
    dcenter(res: IMsgRes) {
        console.log("dcenter ===> ", res)
    },
}

// vueSocketIO配置参数
const vueSocketOptions = {
    debug: false,
    connection: io(
        import.meta.env.VITE_BASE_URL,  //http:自己的服务：端口
        {
            transports: ['polling'],
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: 5 // 重连次数
        }
    ),
    //extraHeaders: {"Access-Control-Allow-Origin": '*'},
}

/**
 * socketio的二次封装
 * 2023.2.14 带土
 * @method init 初始化，传参 { proxy } = getCurrentInstance() as any
 * @method connListen 连接状态监听
 * @method addListener 注册默认订阅
 * @method removeListener 销毁订阅
 * @method sendMsg 发送消息
 * @method subscribe 消息订阅
 * @method unsubscribe 取消订阅
 * @method get isConnected  连接状态
 * @method close  关闭socket
 * 
 * 说明：
 * ①消息默认由useSocket中的setSocketMsg进行统一处理，满足一般的使用场景：
 * 后台推送消息，useSocket统一处理，vue组件再引用setSocketMsg或者setSocketMsgList进行业务开发。
 * ②更优的解决方案是，前端和后端讨论好，定好module和action，消息推送过来，就会直接调用module下的action进行数据消费，这样就和其它消息进行了解耦
 * ③当然，还有一些场景不需要通过store，这个时候，可以在组件中使用subscribe订阅消息，ps：onUnmounted中需要unsubscribe，参考socket.vue
 * ④默认的event_name是SOCKET_MSG，可以自行修改或扩展新event_name，和后端对齐即可，不过绝大多数时候用不到
 * 
 * 初始化和关闭功能最好放在登录成功和注销成功时分别调用，
 * 我习惯登录成功和注销成功时候，分别给总线上emit消息，需要在登录或注销后处理事件的地方自行显性监听即可，这样登录和注销就和其它功能解耦了。
 * 
 */
class MySocketio {
    socketio = {}
    socketEvents: ISocketEvents = {}
    subscribeEvents: Array<string> = []
    constructor() {
        this.socketio = new VueSocketIO(vueSocketOptions)
        this.socketEvents = socketEvents
    }

    // socket初始化
    init(app: App<Element>) {
        // 如果已经连接，则return，避免重复连接
        if (!!this.isConnected) return
        this.socketio["app"] = app
        this.socketio["io"].open()
        // 连接状态监听
        this.connListen()
        // 注册默认订阅
        this.addListener(this.socketEvents)
    }

    // 连接状态监听
    connListen() {
        this.socketio["io"].on('connecting', () => { console.log('正在连接---666') })
        this.socketio["io"].on('connect', () => { console.log('连接成功---666') })
        this.socketio["io"].on('disconnect', () => { console.log('断开连接---666') })
        this.socketio["io"].on('connect_failed', () => { console.log('连接失败---666') })
        this.socketio["io"].on('error', () => {
            console.log('错误发生，并且无法被其他事件类型所处理')
            // do something 这里作错误处理，如果message提示，或者跳登录页面
        })
        this.socketio["io"].on('reconnect_attempt', () => { console.log('触发尝试重新连接', 666) })
        this.socketio["io"].on('reconnecting', () => { console.log('正在重连---666') })
        this.socketio["io"].on('reconnect_failed', () => { console.log('重连失败---666') })
        this.socketio["io"].on('reconnect', () => { console.log('重连成功---666') })
        //this.socketio["io"].on('response', (res:any) => { console.log('后台返回数据',res) })
    }

    // 注册默认订阅
    addListener(sockets: any) {
        // this.socketio["emitter"].addListener('dcenter', (data:any) => {
        //     console.log('data==========>', data)
        // },this.socketio["app"]) 
        sockets && Object.keys(sockets).forEach((t) => {
            "subscribe" !== t && "unsubscribe" !== t && this.socketio["emitter"].addListener(t, sockets[t], this.socketio["app"]);
        });
    }

    // 销毁订阅
    removeListener(sockets: any) {
        sockets && Object.keys(sockets).forEach((t) => {
            this.socketio["emitter"].removeListener(t, this.socketio["app"]);
        });
    }

    // 发送消息
    sendMsg(msg: IMsg, event_name = 'SOCKET_MSG') {
        this.socketio["io"].emit(event_name, msg);
    }

    // 消息订阅
    subscribe(event_name: string, cb: Function) {
        this.socketio["emitter"].addListener(event_name, cb, this.socketio["app"])
        this.subscribeEvents.push(event_name)
    }

    // 取消订阅
    unsubscribe(event_name: string) {
        this.socketio["emitter"].removeListener(event_name, this.socketio["app"])
        this.subscribeEvents = this.subscribeEvents.filter(item => item != event_name)
    }

    // 连接状态
    get isConnected() {
        return this.socketio["io"].connected
    }

    // 返回VueSocketIO实例
    // get socket() {
    //     return this.socketio
    // }

    // 关闭socket
    close() {
        // 销毁订阅
        this.removeListener(this.socketEvents)
        // 销毁组件中的订阅
        !!this.subscribeEvents.length && this.subscribeEvents.forEach((item: any) => {
            this.socketio["emitter"].removeListener(item, this.socketio["app"])
        })
        // 关闭连接
        this.socketio["io"].close()
        // 清空消息
        stores.useSocket(pinia).clearMsg()
    }
}

// 单例模式返回实例
let obj: any = null
const mySocketio = () => {
    if (!obj) {
        obj = new MySocketio();
        return obj;
    } else {
        return obj;
    }
}

export const socketio = mySocketio().socketio
export default mySocketio()