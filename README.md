# create

create 创建文件

<pre>
npm i -D <b>@fangzhongya/create</b>
</pre>

### package.json

创建 node.index.ts

```ts
import { runDev } from '@fangzhongya/create/package';

runDev();
```

用 ts-node 运行 ts 的 node 代码在

tsconfig.json 添加配置

```json
"ts-node": {
    "esm": true
  }
```

在 package.json 添加执行方法

```json
"scripts": {
    "dev": "ts-node node.index.ts",
}
```
