// https://pinia.vuejs.org/
import { createPinia } from 'pinia';
import { createPersistedState } from 'pinia-plugin-persistedstate'

// 创建持久化存储
// https://prazdevs.github.io/pinia-plugin-persistedstate/guide/
const pinia = createPinia();
pinia.use(createPersistedState({
    storage: sessionStorage,
}))

const modules = {}
// 批量化导入模块文件
const modulesFiles: any = import.meta.glob('./*/*.ts', { eager: true });
for (const [key, value] of Object.entries(modulesFiles)) {
    var moduleName = key.replace(/^\.\/(.*)\.\w+$/, '$1');
    let name = moduleName.split('/')[1]
    let _key = "use" + name.replace(name[0], name[0].toUpperCase())
    //具体的内容，都是每个js中返回值  value.default
    modules[_key] = modulesFiles[key][_key]
}
modules["pinia"] = pinia
// 导出
export const stores: any = modules
export default pinia
