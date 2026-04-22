# Admin 专业版和商业版功能清单

## 一、专业版功能 (Professional Edition)

### 1. 管理员分权控制
- 位置: 设置 → 知识库设置 → 成员管理
- 文件: `PandaWiki/web/admin/src/pages/setting/component/CardKB.tsx`
- 功能: 支持最多 20 个管理员账号,可以为不同管理员分配不同权限

### 2. 高级流量分析 (7天)
- 位置: 统计页面
- 文件: `PandaWiki/web/admin/src/pages/stat/Statistic/index.tsx`
- 功能: 开源版仅支持近 24 小时,专业版支持近 7 天

### 3. 管理员数量限制
- 位置: 系统设置 → 成员添加
- 文件: `PandaWiki/web/admin/src/components/System/component/MemberAdd.tsx`
- 功能: 开源版最多 1 个管理员,专业版最多 20 个管理员

---

## 二、商业版功能 (Business Edition)

### 1. 用户组管理
- 位置: 设置 → 用户组
- 文件: `PandaWiki/web/admin/src/pages/setting/component/UserGroup/index.tsx`
- 功能: 创建和管理用户组,为用户组分配权限

### 2. 安全设置

#### 2.1 页面水印
- 位置: 设置 → 安全设置 → 水印开关
- 文件: `PandaWiki/web/admin/src/pages/setting/component/CardSecurity.tsx`
- 功能: 为页面添加水印,防止内容泄露

#### 2.2 限制复制
- 位置: 设置 → 安全设置 → 限制复制
- 文件: `PandaWiki/web/admin/src/pages/setting/component/CardSecurity.tsx`
- 功能: 禁止用户复制页面内容,保护知识产权

#### 2.3 敏感内容过滤
- 位置: 设置 → 安全设置 → 屏蔽 AI 问答中的关键字
- 文件: `PandaWiki/web/admin/src/pages/setting/component/CardSecurity.tsx`
- 功能: 过滤 AI 问答中的敏感关键词,自定义屏蔽词列表

### 3. API Token 管理
- 位置: 设置 → API Token
- 文件: `PandaWiki/web/admin/src/pages/setting/component/CardKB.tsx`
- 功能: 生成和管理 API Token,支持第三方系统集成

### 4. 登录认证 (第三方登录)
- 位置: 设置 → 登录认证
- 文件: `PandaWiki/web/admin/src/pages/setting/component/CardAuth.tsx`
- 功能: 钉钉登录、飞书登录、企业微信登录、OAuth 登录、CAS 登录、LDAP 登录、GitHub 登录

### 5. 问答机器人 API
- 位置: 设置 → 问答机器人 API
- 文件: `PandaWiki/web/admin/src/pages/setting/component/CardRobotApi.tsx`
- 功能: 启用问答机器人 API,生成和管理 API Token

### 6. MCP 协议支持
- 位置: 设置 → MCP 配置
- 文件: `PandaWiki/web/admin/src/pages/setting/component/CardMCP.tsx`
- 功能: 支持 Model Context Protocol,与 AI 工具深度集成

### 7. 文档历史版本管理
- 位置: 文档编辑器 → 历史版本
- 文件: `PandaWiki/web/admin/src/pages/document/editor/edit/Header.tsx`
- 功能: 查看文档的历史版本,恢复到指定版本,版本对比功能

### 8. 文档访问权限控制
- 位置: 文档属性 → 部分开放
- 文件: `PandaWiki/web/admin/src/pages/document/component/DocPropertiesModal.tsx`
- 功能: 细粒度的文档访问控制,支持部分开放模式

### 9. 高级流量分析 (30天/90天)
- 位置: 统计页面
- 文件: `PandaWiki/web/admin/src/pages/stat/Statistic/index.tsx`
- 功能: 支持查看近 30 天、90 天的访问数据,地域分布分析

### 10. AI 编辑器高级功能
- 位置: 文档编辑器
- 文件: `PandaWiki/web/admin/src/pages/document/editor/edit/Wrap.tsx`
- 功能: AI 辅助写作,智能补全,内容优化建议

---

## 三、功能汇总表

| 功能分类 | 功能名称 | 开源版 | 专业版 | 商业版 | 文件位置 |
|---------|---------|--------|--------|--------|---------|
| 权限管理 | 管理员分权控制 | ❌ | ✅ | ✅ | CardKB.tsx |
| | 用户组管理 | ❌ | ❌ | ✅ | UserGroup/index.tsx |
| | 文档访问权限控制 | ❌ | ❌ | ✅ | DocPropertiesModal.tsx |
| 数据分析 | 近 24 小时统计 | ✅ | ✅ | ✅ | Statistic/index.tsx |
| | 近 7 天统计 | ❌ | ✅ | ✅ | Statistic/index.tsx |
| | 近 30/90 天统计 | ❌ | ❌ | ✅ | Statistic/index.tsx |
| 安全功能 | 页面水印 | ❌ | ❌ | ✅ | CardSecurity.tsx |
| | 限制复制 | ❌ | ❌ | ✅ | CardSecurity.tsx |
| | 敏感内容过滤 | ❌ | ❌ | ✅ | CardSecurity.tsx |
| API 集成 | API Token 管理 | ❌ | ❌ | ✅ | CardKB.tsx |
| | 问答机器人 API | ❌ | ❌ | ✅ | CardRobotApi.tsx |
| | MCP 协议支持 | ❌ | ❌ | ✅ | CardMCP.tsx |
| 登录认证 | 第三方登录 | ❌ | ❌ | ✅ | CardAuth.tsx |
| 文档管理 | 历史版本管理 | ❌ | ❌ | ✅ | Header.tsx |
| | AI 编辑器高级功能 | ❌ | ❌ | ✅ | Wrap.tsx |
| 配额限制 | 管理员数量 | 1 | 20 | 50 | MemberAdd.tsx |

---

## 四、建议的精简方案

### 保留功能 (核心功能)
1. 基础文档管理
2. 基础统计 (近 24 小时)
3. 基础 AI 问答
4. 基础权限管理

### 删除功能 (非必需)
1. 所有第三方登录 (钉钉、飞书、企业微信、OAuth、CAS、LDAP、GitHub)
2. MCP 协议支持
3. 问答机器人 API
4. 页面水印
5. 限制复制
6. 敏感内容过滤
7. 用户组管理
8. API Token 管理
9. 文档历史版本管理

---

## 五、如何移除版本限制

### 方法 1: 修改版本常量
编辑 `PandaWiki/web/admin/src/constant/version.ts`,将开源版添加到权限列表中

### 方法 2: 移除组件权限检查
在各个组件中,找到 `permission={BUSINESS_VERSION_PERMISSION}` 的地方,删除 `permission` 属性

### 方法 3: 模拟商业版许可证
修改后端返回的 license 信息,将 edition 设置为 `LicenseEditionBusiness`

---

## 六、总结

Admin 中共有 10 大类商业版功能,涉及 10+ 个文件。对于毕业设计项目,建议:

1. 保留核心功能 (文档管理、基础统计、基础问答)
2. 删除第三方集成功能 (钉钉、飞书、企业微信等)
3. 移除版本限制,专注于知识图谱功能开发
4. 简化权限管理,只保留基础的管理员权限
  ```tsx
  <FormItem label='问答机器人 API' permission={BUSINESS_VERSION_PERMISSION}>
  ```

### 6. MCP 协议支持
- **位置**: 设置 → MCP 配置
- **文件**: `PandaWiki/web/admin/src/pages/setting/component/CardMCP.tsx`
- **功能**: 
  - 支持 Model Context Protocol
  - 与 AI 工具深度集成
  - MCP 服务器配置
- **代码标识**: 
  ```tsx
  const CardMCP = ({ kb }: CardMCPProps) => {
    // MCP 配置相关代码
  }
  ```

### 7. 文档历史版本管理
- **位置**: 文档编辑器 → 历史版本
- **文件**: `PandaWiki/web/admin/src/pages/document/editor/edit/Header.tsx`
- **功能**: 
  - 查看文档的历史版本
  - 恢复到指定版本
  - 版本对比功能
- **代码标识**: 
  ```tsx
  <StyledMenuSelect disabled={!isBusiness}>
    历史版本
    <VersionCanUse permission={BUSINESS_VERSION_PERMISSION} />
  </StyledMenuSelect>
  ```

### 8. 文档访问权限控制
- **位置**: 文档属性 → 部分开放
- **文件**: `PandaWiki/web/admin/src/pages/document/component/DocPropertiesModal.tsx`
- **功能**: 
  - 细粒度的文档访问控制
  - 支持部分开放模式
  - 访客权限管理
- **代码标识**: 
  ```tsx
  <Stack direction={'row'} alignItems={'center'}>
    <span>部分开放</span>
    <VersionCanUse permission={BUSINESS_VERSION_PERMISSION} />
  </Stack>
  ```

### 9. 高级流量分析 (30天/90天)
- **位置**: 统计页面
- **文件**: `PandaWiki/web/admin/src/pages/stat/Statistic/index.tsx`
- **功能**: 
  - 支持查看近 30 天、90 天的访问数据
  - 地域分布分析
  - 热力图分析
- **代码标识**: 
  ```tsx
  { label: '近 30 天', value: 30, disabled: !isBusiness }
  { label: '近 90 天', value: 90, disabled: !isBusiness }
  ```

### 10. AI 编辑器高级功能
- **位置**: 文档编辑器
- **文件**: `PandaWiki/web/admin/src/pages/document/editor/edit/Wrap.tsx`
- **功能**: 
  - AI 辅助写作
  - 智能补全
  - 内容优化建议
- **代码标识**: 
  ```tsx
  const isBusiness = useMemo(() => {
    return BUSINESS_VERSION_PERMISSION.includes(license.edition!);
  }, [license]);
  ```

---

## 三、版本权限常量定义

**文件**: `PandaWiki/web/admin/src/constant/version.ts`

```typescript
// 专业版权限
export const PROFESSION_VERSION_PERMISSION = [
  ConstsLicenseEdition.LicenseEditionProfession,
  ConstsLicenseEdition.LicenseEditionBusiness,
  ConstsLicenseEdition.LicenseEditionEnterprise,
];

// 商业版权限
export const BUSINESS_VERSION_PERMISSION = [
  ConstsLicenseEdition.LicenseEditionBusiness,
  ConstsLicenseEdition.LicenseEditionEnterprise,
];
```

---

## 四、功能汇总表

| 功能分类 | 功能名称 | 开源版 | 专业版 | 商业版 | 文件位置 |
|---------|---------|--------|--------|--------|---------|
| **权限管理** | 管理员分权控制 | ❌ | ✅ | ✅ | CardKB.tsx |
| | 用户组管理 | ❌ | ❌ | ✅ | UserGroup/index.tsx |
| | 文档访问权限控制 | ❌ | ❌ | ✅ | DocPropertiesModal.tsx |
| **数据分析** | 近 24 小时统计 | ✅ | ✅ | ✅ | Statistic/index.tsx |
| | 近 7 天统计 | ❌ | ✅ | ✅ | Statistic/index.tsx |
| | 近 30/90 天统计 | ❌ | ❌ | ✅ | Statistic/index.tsx |
| **安全功能** | 页面水印 | ❌ | ❌ | ✅ | CardSecurity.tsx |
| | 限制复制 | ❌ | ❌ | ✅ | CardSecurity.tsx |
| | 敏感内容过滤 | ❌ | ❌ | ✅ | CardSecurity.tsx |
| **API 集成** | API Token 管理 | ❌ | ❌ | ✅ | CardKB.tsx |
| | 问答机器人 API | ❌ | ❌ | ✅ | CardRobotApi.tsx |
| | MCP 协议支持 | ❌ | ❌ | ✅ | CardMCP.tsx |
| **登录认证** | 钉钉登录 | ❌ | ❌ | ✅ | CardAuth.tsx |
| | 飞书登录 | ❌ | ❌ | ✅ | CardAuth.tsx |
| | 企业微信登录 | ❌ | ❌ | ✅ | CardAuth.tsx |
| | OAuth 登录 | ❌ | ❌ | ✅ | CardAuth.tsx |
| | CAS 登录 | ❌ | ❌ | ✅ | CardAuth.tsx |
| | LDAP 登录 | ❌ | ❌ | ✅ | CardAuth.tsx |
| | GitHub 登录 | ❌ | ❌ | ✅ | CardAuth.tsx |
| **文档管理** | 历史版本管理 | ❌ | ❌ | ✅ | Header.tsx |
| | AI 编辑器高级功能 | ❌ | ❌ | ✅ | Wrap.tsx |
| **配额限制** | 管理员数量 | 1 | 20 | 50 | MemberAdd.tsx |

---

## 五、建议的精简方案

### 保留功能 (核心功能)
1. 基础文档管理
2. 基础统计 (近 24 小时)
3. 基础 AI 问答
4. 基础权限管理

### 删除功能 (非必需)
1. 所有第三方登录 (钉钉、飞书、企业微信、OAuth、CAS、LDAP、GitHub)
2. MCP 协议支持
3. 问答机器人 API
4. 页面水印
5. 限制复制
6. 敏感内容过滤
7. 用户组管理
8. API Token 管理
9. 文档历史版本管理

### 移除版本限制
将需要的功能改为开源版可用,专注于核心功能和知识图谱开发。

---

## 六、如何移除版本限制

### 方法 1: 修改版本常量
编辑 `PandaWiki/web/admin/src/constant/version.ts`:

```typescript
// 将所有功能改为开源版也支持
export const PROFESSION_VERSION_PERMISSION = [
  ConstsLicenseEdition.LicenseEditionFree,  // 添加开源版
  ConstsLicenseEdition.LicenseEditionProfession,
  ConstsLicenseEdition.LicenseEditionBusiness,
  ConstsLicenseEdition.LicenseEditionEnterprise,
];

export const BUSINESS_VERSION_PERMISSION = [
  ConstsLicenseEdition.LicenseEditionFree,  // 添加开源版
  ConstsLicenseEdition.LicenseEditionBusiness,
  ConstsLicenseEdition.LicenseEditionEnterprise,
];
```

### 方法 2: 移除组件权限检查
在各个组件中,找到 `permission={BUSINESS_VERSION_PERMISSION}` 的地方,删除 `permission` 属性。

### 方法 3: 模拟商业版许可证
修改后端返回的 license 信息,将 edition 设置为 `LicenseEditionBusiness`。

---

## 七、总结

Admin