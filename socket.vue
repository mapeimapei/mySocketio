<template>
  <div class="p20">
    <div class="pb10">
      <div class="pb10">
        test_namespace的消息:{{ test_namespace_msg }}
      </div>
      <el-button type="primary" @click="test_namespace_fn">发送test_namespace消息</el-button>
      <el-button type="primary" @click="subscribeFn">显示订阅test_namespace</el-button>
      <el-button type="primary" @click="unsubscribeFn">取消订阅test_namespace</el-button>

    </div>
    <div class="pt10 pb10">
      <el-button type="primary" @click="socketOpenFn">连接socket</el-button>
      <el-button type="primary" @click="isConnectedFn">isConnected</el-button>
      <el-button type="primary" @click="socketCloseFn">断开socket</el-button>
    </div>
    <div style="width: 400px; margin-bottom: 20px;">
      <el-input v-model="input" clearable placeholder="Please input">
        <template #append>
          <el-button type="primary" :disabled="!input || !mySocketio.isConnected" @click="sendMessage">Send</el-button>
        </template>
      </el-input>
    </div>


    <div class="pt10 pb10">
      socketMsg:
      {{ socketMsg }}
    </div>

    <ul class="pt10 pb10">
      <li>socketMsgList:</li>
      <li v-for="(item, index) in socketMsgList" :key="index + 's'">{{ item }}</li>
    </ul>

  </div>
</template>

<script setup lang="ts" name="socket.io">
import { getCurrentInstance, onMounted, onUnmounted } from 'vue';
import pinia, { stores } from '@/stores'
import mySocketio from "@/utils/socket.io"
import { ref } from 'vue'


const { proxy }: any = getCurrentInstance()
const storesSocket = stores.useSocket();
const { socketMsg, socketMsgList } = proxy.$storeToRefs(storesSocket);


const input = ref('')
const test_namespace_msg = ref()

const subscribeFn = () => {
  mySocketio.subscribe('test_namespace', (data: any) => {
    test_namespace_msg.value = data
  })
}

const unsubscribeFn = () => {
  mySocketio.unsubscribe('test_namespace')
  test_namespace_msg.value = null
}





const sendMessage = () => {
  let msg = { "msg": input.value }
  mySocketio.sendMsg(msg)
  input.value = ""
}

const test_namespace_fn = () => {
  let msg = {
    "CCCCCCC": "你好！ test_namespace ===> " + new Date()
  }
  mySocketio.sendMsg(msg, 'test_namespace');
}

const isConnectedFn = () => {
  console.log("mySocketio.isConnected", mySocketio.isConnected)
}

// 连接 测试用
const socketOpenFn = async () => {
  await mySocketio.init(proxy)
}

// 断开 测试用
const socketCloseFn = async () => {
  await mySocketio.close()
}


onMounted(async () => {
  // 消息订阅
  // proxy.sockets.subscribe('test_namespace', (data: any) => {
  //   console.log("test_namespace==>", data)
  // })
  subscribeFn()
})

onUnmounted(() => {
  // 取消订阅
  unsubscribeFn()
  //proxy.sockets.unsubscribe('test_namespace')
});

</script>

<style scoped lang="scss">

</style>