package usecase

import (
	"context"
	"testing"

	"github.com/chaitin/panda-wiki/domain"
)

func TestValidateUpdateAppAllowsNilSettings(t *testing.T) {
	u := &AppUsecase{}

	if err := u.ValidateUpdateApp(context.Background(), "missing-id", &domain.UpdateAppReq{}); err != nil {
		t.Fatalf("ValidateUpdateApp returned unexpected error: %v", err)
	}
}

func TestValidateUpdateAppSetsDefaultPromptWithoutRepoLookup(t *testing.T) {
	u := &AppUsecase{}
	req := &domain.UpdateAppReq{
		Settings: &domain.AppSettings{},
	}

	if err := u.ValidateUpdateApp(context.Background(), "missing-id", req); err != nil {
		t.Fatalf("ValidateUpdateApp returned unexpected error: %v", err)
	}

	if req.Settings.WeChatAppAdvancedSetting.Prompt != domain.SystemDefaultPrompt {
		t.Fatalf("expected default prompt %q, got %q", domain.SystemDefaultPrompt, req.Settings.WeChatAppAdvancedSetting.Prompt)
	}
}
