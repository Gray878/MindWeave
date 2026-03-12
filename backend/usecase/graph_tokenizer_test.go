package usecase

import "testing"

func containsToken(tokens []string, expected string) bool {
	for _, token := range tokens {
		if token == expected {
			return true
		}
	}
	return false
}

func TestExtractGraphDocumentTokensMixedLanguage(t *testing.T) {
	tokens := extractGraphDocumentTokens(
		"知识图谱关系设计",
		"该文档讨论知识图谱中的文档关系匹配策略，同时对 graph relation matching 做比较。",
	)

	if len(tokens) == 0 {
		t.Fatal("expected non-empty tokens")
	}
	for _, expected := range []string{"知识", "图谱", "关系", "graph", "relation"} {
		if !containsToken(tokens, expected) {
			t.Fatalf("expected token %q in %v", expected, tokens)
		}
	}
}

func TestExtractGraphDocumentTokensRespectsLimit(t *testing.T) {
	huge := ""
	for i := 0; i < 1200; i++ {
		huge += "知识图谱关系分析 graphrelation "
	}
	tokens := extractGraphDocumentTokens("标题", huge)
	if len(tokens) == 0 {
		t.Fatal("expected tokens for long content")
	}
	if len(tokens) > graphTokenMaxTerms {
		t.Fatalf("token length exceeds limit: %d > %d", len(tokens), graphTokenMaxTerms)
	}
}
