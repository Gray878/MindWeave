# Neo4j 数据迁移和测试工具

## 1. 测试 Neo4j 连接

```bash
# 编译测试工具
cd PandaWiki/backend
go build -o test-neo4j.exe ./cmd/test-neo4j

# 运行测试
./test-neo4j.exe -config config/config.yaml
```

## 2. 数据迁移

### 2.1 预览迁移（不实际执行）

```bash
# 编译迁移工具
go build -o migrate.exe ./cmd/migrate

# 预览所有知识库的迁移
./migrate.exe -config config/config.yaml -dry-run

# 预览指定知识库的迁移
./migrate.exe -config config/config.yaml -dry-run -kb <知识库ID>
```

### 2.2 执行迁移

```bash
# 迁移所有知识库
./migrate.exe -config config/config.yaml

# 迁移指定知识库
./migrate.exe -config config/config.yaml -kb <知识库ID>
```

## 3. 配置说明

确保 `config/config.yaml` 中包含 Neo4j 配置：

```yaml
neo4j:
  uri: bolt://169.2