// 知识图谱相关领域模型
package domain

import "time"

// GraphDocument 图谱中的文档节点
type GraphDocument struct {
	ID         string    `json:"id"`
	Name       string    `json:"name"`
	KbID       string    `json:"kb_id"`
	Status     int       `json:"status"`
	Visibility int       `json:"visibility"`
	CreatorID  string    `json:"creator_id"`
	EditorID   string    `json:"editor_id"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// GraphFolder 图谱中的文件夹节点
type GraphFolder struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	KbID      string    `json:"kb_id"`
	ParentID  string    `json:"parent_id"`
	Position  float64   `json:"position"`
	CreatedAt time.Time `json:"created_at"`
}

// GraphEntity 图谱中的实体节点
type GraphEntity struct {
	ID             string    `json:"id"`
	Name           string    `json:"name"`
	Type           string    `json:"type"` // Person, Organization, Technology, Concept, etc.
	Aliases        []string  `json:"aliases"`
	Description    string    `json:"description"`
	Confidence     float64   `json:"confidence"`
	SourceDocIDs   []string  `json:"source_doc_ids"`
	KbID           string    `json:"kb_id"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// GraphUser 图谱中的用户节点
type GraphUser struct {
	ID        string    `json:"id"`
	Account   string    `json:"account"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

// GraphKnowledgeBase 图谱中的知识库节点
type GraphKnowledgeBase struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

// GraphRelation 图谱关系
type GraphRelation struct {
	Type       string                 `json:"type"`
	Properties map[string]interface{} `json:"properties"`
}

// EntityType 实体类型枚举
const (
	EntityTypePerson       = "Person"
	EntityTypeOrganization = "Organization"
	EntityTypeTechnology   = "Technology"
	EntityTypeConcept      = "Concept"
	EntityTypeProduct      = "Product"
	EntityTypeEvent        = "Event"
	EntityTypeLocation     = "Location"
	EntityTypeOther        = "Other"
)

// RelationType 关系类型枚举
const (
	RelationContains    = "CONTAINS"     // 包含关系
	RelationMentions    = "MENTIONS"     // 提及关系
	RelationRelatesTo   = "RELATES_TO"   // 实体关联
	RelationCreatedBy   = "CREATED_BY"   // 创建关系
	RelationEditedBy    = "EDITED_BY"    // 编辑关系
	RelationBelongsTo   = "BELONGS_TO"   // 归属关系
	RelationReferences  = "REFERENCES"   // 引用关系
)

// RelationSubType 关系子类型 (用于 RELATES_TO)
const (
	RelationDependsOn   = "DEPENDS_ON"
	RelationSimilarTo   = "SIMILAR_TO"
	RelationPartOf      = "PART_OF"
	RelationUses        = "USES"
	RelationImplements  = "IMPLEMENTS"
	RelationExtends     = "EXTENDS"
	RelationRelated     = "RELATED_TO"
)
