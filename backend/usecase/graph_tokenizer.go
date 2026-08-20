package usecase

import (
	"regexp"
	"sort"
	"strings"
	"unicode/utf8"
)

const (
	graphTokenMaxSourceRunes = 6000
	graphTokenMaxTerms       = 160
	graphTokenMinLatinLen    = 2
)

var (
	graphLatinTokenPattern = regexp.MustCompile(`[A-Za-z0-9_]+`)
	graphCJKTokenPattern   = regexp.MustCompile(`[\p{Han}]+`)
)

func extractGraphDocumentTokens(title, content string) []string {
	title = strings.TrimSpace(title)
	content = strings.TrimSpace(content)

	switch {
	case title == "" && content == "":
		return nil
	case title == "":
		return extractGraphDocumentTokensFromText(content)
	case content == "":
		return extractGraphDocumentTokensFromText(title)
	default:
		// Give title tokens a higher weight so naming intent is kept in matching.
		freq := make(map[string]int)
		appendWeightedTokens(freq, trimTextRunes(strings.ToLower(title), 1000), 3)
		appendWeightedTokens(freq, trimTextRunes(strings.ToLower(title+"\n"+content), graphTokenMaxSourceRunes), 1)
		return topGraphTokens(freq)
	}
}

func extractGraphDocumentTokensFromText(text string) []string {
	freq := make(map[string]int)
	appendWeightedTokens(freq, trimTextRunes(strings.ToLower(text), graphTokenMaxSourceRunes), 1)
	return topGraphTokens(freq)
}

func appendWeightedTokens(freq map[string]int, text string, weight int) {
	if text == "" || weight <= 0 {
		return
	}

	for _, token := range graphLatinTokenPattern.FindAllString(text, -1) {
		if len(token) < graphTokenMinLatinLen {
			continue
		}
		freq[token] += weight
	}

	for _, segment := range graphCJKTokenPattern.FindAllString(text, -1) {
		runes := []rune(segment)
		if len(runes) == 0 {
			continue
		}
		if len(runes) == 1 {
			freq[string(runes[0])] += weight
			continue
		}
		// Use bi-gram tokens for CJK text to improve Chinese matching coverage.
		for i := 0; i < len(runes)-1; i++ {
			freq[string(runes[i:i+2])] += weight
		}
	}
}

func topGraphTokens(freq map[string]int) []string {
	if len(freq) == 0 {
		return nil
	}

	type tokenScore struct {
		token string
		score int
	}
	tokenScores := make([]tokenScore, 0, len(freq))
	for token, score := range freq {
		if token == "" || score <= 0 {
			continue
		}
		tokenScores = append(tokenScores, tokenScore{
			token: token,
			score: score,
		})
	}
	sort.Slice(tokenScores, func(i, j int) bool {
		if tokenScores[i].score == tokenScores[j].score {
			return tokenScores[i].token < tokenScores[j].token
		}
		return tokenScores[i].score > tokenScores[j].score
	})

	if len(tokenScores) > graphTokenMaxTerms {
		tokenScores = tokenScores[:graphTokenMaxTerms]
	}
	tokens := make([]string, 0, len(tokenScores))
	for _, item := range tokenScores {
		tokens = append(tokens, item.token)
	}
	return tokens
}

func trimTextRunes(text string, maxRunes int) string {
	if maxRunes <= 0 || text == "" {
		return ""
	}
	if utf8.RuneCountInString(text) <= maxRunes {
		return text
	}
	return string([]rune(text)[:maxRunes])
}
