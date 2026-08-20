#!/bin/bash
# Neo4j 连接测试脚本

set -e

echo "=== Neo4j 连接测试 ==="
echo ""

# 配置
NEO4J_URI=${NEO4J_URI:-"bolt://169.254.15.19:7687"}
NEO4J_USER=${NEO4J_USER:-"neo4j"}
NEO4J_PASSWORD=${NEO4J_PASSWORD:-"your_password"}

echo "连接信息:"
echo "  URI: $NEO4J_URI"
echo "  用户: $NEO4J_USER"
echo ""

# 测试查询：获取节点总数
echo "1. 测试连接并查询节点总数..."
cypher-shell -a "$NEO4J_URI" -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" \
  "MATCH (n) RETURN count(n) as total_nodes;" || {
  echo "错误: 无法连接到 Neo4j"
  exit 1
}

echo ""
echo "2. 查询各类型节点数量..."
cypher-shell -a "$NEO4J_URI" -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" \
  "MATCH (n) RETURN labels(n)[0] as type, count(n) as count ORDER BY count DESC;"

echo ""
echo "3. 查询关系数量..."
cypher-shell -a "$NEO4J_URI" -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" \
  "MATCH ()-[r]->() RETURN type(r) as relation_type, count(r) as count ORDER BY count DESC;"

echo ""
echo "4. 查询最近创建的 5 个文档..."
cypher-shell -a "$NEO4J_URI" -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" \
  "MATCH (d:Document) RETURN d.id, d.name, d.created_at ORDER BY d.created_at DESC LIMIT 5;"

echo ""
echo "=== 测试完成 ==="
