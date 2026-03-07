---
name: layaAir
description: 使用layaAir引擎编写代码以及使用layaIDE编辑游戏场景等
---

## Prefab / 场景优先策略

> **核心原则：优先编辑场景/预制体文件，而非用代码组装场景**

- 使用 LayaAir 开发时，**优先通过场景搭建与复用 Prefab** 来实现功能与 UI：目的在于**避免 AI 直接用代码"从零拼 UI/节点结构"**（脚本主要承载逻辑与交互，UI 层级与样式优先落在场景/Prefab 资产里）。在实现前先找现有场景节点与 Prefab 是否可复用，再考虑新建节点/新建 Prefab。
- 当用户提出的 **UI 类型（classic / ui2 / both）与项目配置不符时，必须先提醒用户存在不一致，不要去修改配置设置 UI 模式，应该终止一切操作**（以 `settings/PlayerSettings.json` 的 `addons["laya.ui"]` 为准）。
- **所有 LayaAir 资源文件修改请使用 `Laya_EditAsset` 工具**

---

## 代码中资源路径规范
- ❌ 禁止使用 UUID
- 资源放在 `assets/resources/` 下，路径格式：`resources/子目录/文件名.扩展名`
- 若需引用 `resources` 外的资源，需在 `settings/BuildSetting.json` 中配置 `alwaysIncluded`
比如用到了assets/ui里的资源 就需要在 在settings/BuildSetting.json
增加"alwaysIncluded": [
    "ui"
  ]
---

## 代码开发

### 命名空间约定

**必须使用 `Laya.` 前缀**访问所有引擎类和静态方法。
✅ `Laya.Sprite`, `Laya.Handler.create(...)` ❌ `Sprite`, `Handler`

---

### 入口规范 (Entry.ts)

入口函数结构固定，禁止修改：
```typescript
export async function main() { /* 正式初始化逻辑 */ }
```
❌ 禁止提交测试代码到 `main` 函数

---

### 版本与 API 查询

- 查询 API 时附加 `<LAYA_VERSION>` 版本号
- 迁移时对比 `<LAYA_PRE_VERSION>` → `<LAYA_VERSION>` 的 API 差异
- 以 MCP 返回的精准文档为准，自我修正幻觉

---

### 物理引擎识别

读取 `settings/PlayerSettings.json` 判断物理引擎：

| `physics3dModule` | 引擎 |
|---|---|
| 字段存在 | PhysX |
| 字段不存在 | Bullet |

查询物理 API 时按引擎类型过滤。

---

### MCP 知识库

LayaAir API 相关问题通过 MCP 查询，需附带版本号、UI 类型、物理引擎类型。

---

### MCP API 查询策略

#### 查询方式选择
| 场景 | 工具 | 示例 |
|---|---|---|
| 已知类名，查成员详情 | `get_api_detail` | `name="Vector3"` 或 `name="Vector3.scale"` |
| 已知类名.成员名 | `get_api_detail` | `name="Sprite.addChild"` |
| 不确定 API 名称，按功能搜索 | `query_api` | `query="实现拖拽功能"` |
| 探索性查询 | `query_api` | `query="动画相关的类"` |

#### 查询规范
1. **精确查询优先**：已知 API 名称时，直接用 `get_api_detail(name="类名.成员名")`
2. **查类成员**：用 `get_api_detail(name="类名")` 获取完整方法/属性列表
3. **模糊搜索**：仅在不确定 API 名称时使用 `query_api`
4. **格式要求**：
   - ✅ `Vector3.scale`（类名.成员名）
   - ❌ `Laya.Vector3.scale`（不要加 Laya 前缀）
   - ❌ `scale 方法`（避免自然语言描述已知 API）

---

### 脚本与组件职责边界

在脚本文件类里，我们只能写功能逻辑，但是组件添加的操作，只能通过ide mcp 接口来完成

---

## 场景 / 预制体 / 资源编辑

> **3D 模型资源**：`.fbx`、`.gltf`、`.glb` 格式的模型文件可以直接作为预制体使用，无需手动转换。

### 工作流建议（Overview）

先分析目标功能需要什么UI组件 
然后检索场景文件是否有相关的参考 
如果没有则通过mcp  get_schema_by_name 获得格式
最后进行UI修改

### UI 系统识别

读取 `settings/PlayerSettings.json` 判断 UI 类型：

| `addons["laya.ui"]` | 类型 | 约束 |
|---|---|---|
| 字段不存在 | classic | 仅用新 UI (GBox/GButton/GLabel 等) |
| `"both"` | both | 两套均可，同模块保持一致(经典UI：Box/Button/Label 等 、 新UI：GBox/GButton/GLabel 等）) |
| `"ui2"` | new | 仅用新 UI (GBox/GButton/GLabel 等) |

---

### ⚠️ 核心约束：场景/UI/预制体操作必须通过 IDE MCP

#### 禁止行为
❌ **绝对禁止**直接使用 `write`、`search_replace` 等文件操作工具修改以下文件：
- `.ls` 场景文件
- `.lh` 预制体文件  
- `.lmat` 材质文件

#### 必须使用的工具

| 操作类型 | 正确工具 | 错误做法 |
|---------|---------|---------|
| 读取场景/预制体结构 | `Laya_ReadLayaAsset` | ❌ `read_file` 后手动解析 |
| 编辑场景/预制体/材质 | `Laya_EditAsset`（或 `Laya_EditJson`） | ❌ `write` / `search_replace` |
| 创建场景 | `SceneManagement.saveAs` | ❌ `write` 创建 .ls 文件 |
| 创建预制体 | `PrefabManagement.create*` | ❌ `write` 创建 .lh 文件 |
| 保存场景 | `SceneManagement.save` | ❌ 直接写文件 |

#### 添加脚本组件流程

1. **创建脚本文件** → 使用 `write` 创建 `.ts` 文件（这个允许）
2. **等待资源刷新** → 调用 `AssetManagement.waitAssetBusy`
3. **确认脚本注册** → 调用 `SceneManagement.listComponents` 查看脚本 UUID
4. **添加组件到节点** → 使用 `Laya_EditAsset`，`_$type` 填脚本 UUID

```json
// 正确示例：通过 Laya_EditAsset 添加组件
{"op": "add", "path": "/节点路径/_$comp", "value": "[{\"_$type\":\"脚本UUID\"}]"}
```

#### 为什么必须这样做

1. **资源索引一致性**：IDE 维护资源索引和引用关系，直接操作文件会导致索引不同步
2. **Schema 校验**：`Laya_EditAsset` 会校验数据格式，避免无效数据导致场景损坏
3. **UUID 管理**：新建节点/组件需要 IDE 分配唯一 ID
4. **热更新支持**：通过 MCP 修改后 IDE 能实时刷新预览

#### 操作前检查清单

- [ ] 是否要修改 `.ls/.lh/.lmat` 文件？→ 必须用 `Laya_EditAsset`
- [ ] 是否要创建场景/预制体？→ 必须用对应的 MCP 工具
- [ ] 是否要添加脚本组件？→ 先创建脚本，等待注册，再用 MCP 添加

---

### LayaAir IDE 操作

**所有 LayaAir IDE 相关的操作必须通过 laya_ide MCP 处理**，包括但不限于：

| 操作类型 | 使用工具 |
|---|---|
| 资源管理（创建/移动/复制/删除） | `Asset_*` 系列工具 |
| 场景操作（打开/保存/关闭） | `Scene_*` 系列工具 |
| 预制体操作 | `Prefab_*` 系列工具 |
| 项目操作（运行/构建/设置） | `Project_*` 系列工具 |
| 读取/编辑 `.ls`、`.lh`、`.lmat` 文件 | `Laya_ReadLayaAsset`、`Laya_EditJson` |
| 调试日志 | `Debug_*` 系列工具 |

⚠️ **禁止**直接通过文件系统操作 LayaAir 资源文件，必须使用 IDE MCP 工具以确保资源索引和引用关系正确。

---

### LayaAir3 场景与预制体数据文件格式

LayaAir3 的场景与预制体数据文件采用标准 JSON 格式。其中的键（key）可分为两大类：

- **指令型键**：以 `_$` 开头，用于表达引擎可识别的特殊功能或元数据。
- **原生属性键**：除上述指令型键之外的所有键，对应对象在脚本中的实际属性名称。

下文将按 Node / Component / 特殊结构三类，说明指令型键的含义与用法（并补充少量场景/UI实践约定）。

#### 一、节点对象（Node）

节点对象中可能包含以下指令型键：

##### _$ver
- **类型**：数字或字符串
- 值固定为 `1`（或 `"1"`）。仅用于根节点，且必须提供，作为识别 LayaAir3 数据文件的标志。

##### _$runtime
- **类型**：字符串（可选）
- 仅用于根节点，表示该节点绑定的脚本基类。路径格式为 `res://uuid`（TypeScript 文件的 UUID）。
- **重要说明（尤其是 UI Prefab）**：这里常被误解为"挂了一个 `Laya.Script` 脚本"。实际上 `_$runtime` 绑定的是 **Runtime 类（脚本基类）**，它的**基类是目标节点的类型**（例如 `Laya.Box` / `Laya.Sprite` / `Laya.Scene` 等），也就是运行时该节点会按这个自定义类来实例化；它**不是**通过 `_$comp` 挂载的 `Laya.Script` 组件。

##### _$var
- **类型**：布尔值（可选）
- 当使用了 `_$runtime` 后，可通过此属性标记是否在脚本中为该节点生成变量声明。

##### _$preloads
- **类型**：字符串数组（可选）
- 仅用于根节点。定义预制体/场景载入时需同时加载的资源列表。每个元素路径格式为 `res://uuid`（资源 UUID）。

##### _$preloadTypes
- **类型**：字符串数组（可选）
- 仅用于根节点，配合 `_$preloads` 使用，指明每个资源的类型。某些情况下必须提供，例如扩展名为 `.json` 的资源实为 Spine 数据，则需在此写入 `"Spine"`。可选值可参考引擎 `Laya.Loader.assetTypeToLoadType` 的键名。

##### _$id
- **类型**：字符串
- 节点的唯一标识，通常为 8 位由小写字母与数字组成的随机字符串。从第三方工具导入的文件允许使用 `#`。只需保证该值在当前预制体内唯一即可。若非预制体覆盖属性节点，则必须提供。

##### _$type
- **类型**：字符串
- 节点的类型。若非预制体节点或预制体覆盖属性节点，则必须提供。可以是引擎内置类型（如 `"Image"`、`"Sprite3D"`），也可以是用户自定义脚本的 UUID。

##### _$prefab
- **类型**：字符串
- 预制体资源的 UUID。若该节点为预制体实例，则必须提供此键，且无需再填写 `_$type`。

##### _$override
- **类型**：字符串或字符串数组
- 仅出现在 `_$prefab` 节点的 `_$child` 数组中，表示该节点用于覆盖预制体内某个节点的属性。若为字符串，则为目标节点的 `_$id`；若为长度为 n 的数组，则前 n-1 个元素表示多层嵌套预制体根节点的 `_$id`，最后一个元素表示最终要修改的节点的 `_$id`。

##### _$parent
- **类型**：字符串或字符串数组
- 仅出现在 `_$prefab` 节点的 `_$child` 数组中，表示该节点是新增节点，将挂载到预制体的某个节点下。格式规则同 `_$override`。

##### _$index
- **类型**：整数（可选）
- 与 `_$parent` 搭配使用，指定在目标父节点子级列表中的插入位置。

##### _$child
- **类型**：对象数组（可选）
- 该节点的子节点列表。

##### _$comp
- **类型**：对象数组（可选）
- 该节点上挂载的组件列表。

##### 节点对象类型总结

| 类型 | 关键指令键 | 说明 |
|------|-----------|------|
| 普通节点 | `_$id`、`_$type` | 普通节点，需提供唯一ID与类型。 |
| 预制体节点 | `_$id`、`_$prefab` | 表示一个预制体实例。可在 `_$child` 中通过 `_$override` 覆盖内部属性，或通过 `_$parent` 新增子节点。 |
| 预制体属性覆盖节点 | `_$override` | 用于覆盖预制体内部某个节点的属性。它必须出现在_$prefab节点的_$child数组中。 |
| 预制体新增节点 | `_$parent`、`_$index` | 用于在预制体内部某个节点下新增一个节点（同时仍需提供该新增节点自身的 `_$type`，通常也会带 `_$id`）。它必须出现在_$prefab节点的_$child数组中。 |
| 根节点 | `_$ver`（必须）<br>`_$runtime`、`_$preloads`、`_$preloadTypes`（可选） | 具备普通节点属性，且必须包含 `_$ver: 1`（或 `"1"`），可选绑定脚本与预加载资源。 |

#### 二、组件对象（Component）

组件对象中可能包含以下指令型键：

##### _$type
- **类型**：字符串
- 组件的类型。若非预制体覆盖属性节点，则必须提供。可以是引擎内置类型（如 `"MeshRenderer"`、`"RigidBody"`），也可以是自定义脚本的 UUID。

##### _$id
- **类型**：字符串
- 组件的唯一标识，格式同节点 `_$id`。若组件为单例（同一节点仅允许挂载一个），则不应提供此键；若非单例，则必须提供。

##### _$override
- **类型**：字符串
- 仅出现在_$prefab/_$comp数组中，或出现在_$prefab/_$child/_$override/_$comp数组中。值为目标组件的 `_$type` 或 `_$id`（视目标组件是否为单例而定）。

##### 组件对象类型总结

| 类型 | 关键指令键 | 说明 |
|------|-----------|------|
| 单例组件 | `_$type` | 只可以添加一次的组件，只需提供类型。 |
| 非单例组件 | `_$id`、`_$type` | 非单例组件，需要提供唯一ID和类型。 |
| 预制体属性覆盖组件 | `_$override` | 用于覆盖预制体内部某个组件的属性。它仅出现在_$prefab/_$comp数组中，或出现在_$prefab/_$child/_$override/_$comp数组中。 |

#### 三、特殊用途指令键

以下指令键用于表达资源引用、节点引用等特殊结构：

##### 资源引用
使用 `_$uuid` 与 `_$type` 搭配，表示对某个资源的引用：
```json
{
  "texture": {
    "_$uuid": "3b15da0e-f2e4-4c83-92d2-bee8c233b1f7",
    "_$type": "Material"
  }
}
```

**注意：这种资源引用方式仅适用于属性类型是对象的情况，例如类型是Texture、Material或Prefab。如果属性类型是字符串，那么属性值是一个格式为res://xxxx的字符串（xxxx是资源的UUID），不使用上述的格式。**

##### 节点引用
使用 `_$ref` 引用同一文件内的某个节点：
```json
{
  "refNode": {
    "_$ref": "wov6aw5d"
  }
}
```

##### 组件引用
使用 `_$ref` 与 `_$type` 引用某节点上的特定组件：
```json
{
  "refComponent": {
    "_$ref": "wov6aw5d",
    "_$type": "MeshFilter"
  }
}
```

##### 控制器引用
使用 `_$ref` 与 `_$ctrl` 引用某节点上的控制器：
```json
{
  "refController": {
    "_$ref": "wov6aw5d",
    "_$ctrl": "c1"
  }
}
```

##### 模板节点引用
常用于列表类控件，比如List、GList，通过 `_$ref` 与 `_$tmpl` 指定列表项的模板节点。反序列化时，系统会将对应节点的原始数据存入 `_$tmpl` 指定的属性中，供后续实例化复用：
```json
{
  "_templateNode": {
    "_$ref": "wov6aw5d",
    "_$tmpl": "itemTemplate"
  }
}
```

通过以上结构，LayaAir3 的 JSON 数据文件能够清晰描述场景层级、组件挂载、预制体实例化及覆盖、资源引用等多种关系，便于引擎解析与运行时重建。

---

#### 四、场景 / UI 实践约定（避免踩坑）

##### 1) 场景层级约定（2D/3D混合）
- **根节点通常为 `Scene`**，建议命名 `Scene2D`（同时具备 `_$ver/_$id/_$type` 等根节点字段）。
- **包含 3D 时**：把 `Scene3D` 放在根节点 `_$child` 的**第一个子节点**，所有 3D 节点统一放到该 `Scene3D._$child` 下。
- **UI/2D 显示节点**：放在根节点 `_$child`（不要放进 `Scene3D`）。

##### 2) UI 组件类型（新旧UI区分）
- **新版UI**：类型名前带 `G`，例如 `GBox`、`GList`、`GLabel`、`GImage` 等。
- **经典UI**：不带 `G`，例如 `Box`、`List`、`Label`、`Image` 等。
- **场景与代码一致**：场景节点使用新版UI（如 `GBox`），代码中必须用 `Laya.GBox`；使用经典UI（如 `Box`），代码中用 `Laya.Box`，不可混用。

---

#### 五、新版UI类型说明

##### 行为组件:GLabel(标签)、GButton (按钮)、GComboBox(下拉框)、GProgressBar(进度条)、GSlider(滑动条)、GScrollBar(滚动条)
- 这类组件应用了组合设计模式,将显示和行为分离,使组件的样式和行为可以独立修改。具体说,就是这些组件只实现了具体的行为逻辑,但不带任何显示功能的组件(如文字图片等),需要用户为它那定显示组件才能正常显示内容。
- 举例,当在舞台上创建一个GButton组件时,发现它在舞台台上完全空白,没有任何按钮形态的显示。只有在绑定了另外一个GTextField节点作为它的标题组件,或者绑定了另外一个GImage节点作为它的图图标组件后,它才会具有一个按钮的真实效果。
- 通常我们不需要每次都这样操作,所以像按钮这类组件通常会在IDE中制作成预制体再使用。例如"Ul组件(默认皮肤)"里的安钮组件,就是IDE内置提供的一个按钮预制体。
- 这种设计模式的好处是,用户可以自由定制行为组件的显示部分,可以直接设置显示组件的所有属性,而不用依赖行为组件的二次导出,从而实现了组件的高度定制化。

**最佳实现开始**
1、先确定用的是新版UI还是经典UI（新版UI type 有 `GBox/GList/GLabel/GImage` 等；新版UI规则和FairyGUI相似；经典UI为 `Box/List/Label/Image` 等），再选定需要用到哪些引擎内置 UI 元素，避免靠大量嵌套暴力拼凑。  
2、使用选出的 type，通过 `get_schema_by_name` 查询属性 schema。 请严格遵守schema（严格类型）
3、使用 `Laya_EditAsset`（或你的 EditJson 工具）对场景/预制体数据进行修改。  
**最佳实现结束**

---

### LayaAir 资源文件特殊字段名

LayaAir 的 `.ls`、`.lh`、`.lmat` 等 JSON 资源文件使用 `_$` 前缀的特殊字段名。

⚠️ **MCP 返回数据可能丢失下划线**（`_$type` → `$type`），这是传输层问题。

**必须使用带下划线的正确格式**：

| 正确 ✅ | 错误 ❌ |
|---------|---------|
| `_$type` | `$type` |
| `_$id` | `$id` |
| `_$child` | `$child` |
| `_$prefab` | `$prefab` |
| `_$comp` | `$comp` |
| `_$ref` | `$ref` |

在编辑资源文件或生成 JSON 时，**始终使用 `_$` 前缀**，不要被 MCP 返回的数据误导。
