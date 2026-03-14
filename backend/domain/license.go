package domain

import (
	"context"
	"encoding/json"
)

const ContextKeyEditionLimitation contextKey = "edition_limitation"

type BaseEditionLimitation struct {
	MaxKb                  int   `json:"max_kb"`                     // 知识库站点数量
	MaxNode                int   `json:"max_node"`                   // 单个知识库下文档数量
	MaxSSOUser             int   `json:"max_sso_users"`              // SSO认证用户数量
	MaxAdmin               int64 `json:"max_admin"`                  // 后台管理员数量
	AllowAdminPerm         bool  `json:"allow_admin_perm"`           // 支持管理员分权控制
	AllowCustomCopyright   bool  `json:"allow_custom_copyright"`     // 支持自定义版权信息
	AllowCommentAudit      bool  `json:"allow_comment_audit"`        // 支持评论审核
	AllowAdvancedBot       bool  `json:"allow_advanced_bot"`         // 支持高级机器人配置
	AllowWatermark         bool  `json:"allow_watermark"`            // 支持水印
	AllowCopyProtection    bool  `json:"allow_copy_protection"`      // 支持内容复制保护
	AllowOpenAIBotSettings bool  `json:"allow_open_ai_bot_settings"` // 支持问答机器人
	AllowMCPServer         bool  `json:"allow_mcp_server"`           // 支持创建MCP Server
	AllowNodeStats         bool  `json:"allow_node_stats"`           // 支持文档统计
}

var baseEditionLimitationDefault = BaseEditionLimitation{
	MaxKb:                  999,   // 移除知识库数量限制
	MaxAdmin:               999,   // 移除管理员数量限制
	MaxNode:                99999, // 移除文档数量限制
	MaxSSOUser:             99999, // 移除 SSO 用户数量限制
	AllowAdminPerm:         true,  // 开放管理员分权控制
	AllowCustomCopyright:   true,  // 开放自定义版权信息
	AllowCommentAudit:      true,  // 开放评论审核
	AllowAdvancedBot:       true,  // 开放高级机器人配置
	AllowWatermark:         true,  // 开放水印功能
	AllowCopyProtection:    true,  // 开放内容复制保护
	AllowOpenAIBotSettings: true,  // 开放问答机器人
	AllowMCPServer:         true,  // 开放 MCP Server
	AllowNodeStats:         true,  // 开放文档统计
}

func GetBaseEditionLimitation(c context.Context) BaseEditionLimitation {

	edition, ok := c.Value(ContextKeyEditionLimitation).([]byte)
	if !ok {
		return baseEditionLimitationDefault
	}

	var editionLimitation BaseEditionLimitation
	if err := json.Unmarshal(edition, &editionLimitation); err != nil {
		return baseEditionLimitationDefault
	}

	return editionLimitation
}
