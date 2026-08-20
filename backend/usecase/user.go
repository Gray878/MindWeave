package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	v1 "github.com/chaitin/panda-wiki/api/user/v1"
	"github.com/chaitin/panda-wiki/config"
	"github.com/chaitin/panda-wiki/consts"
	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/repo/pg"
)

type UserUsecase struct {
	repo             *pg.UserRepository
	graphSyncUseCase *GraphSyncUseCase
	logger           *log.Logger
	config           *config.Config
}

func NewUserUsecase(repo *pg.UserRepository, graphSyncUseCase *GraphSyncUseCase, logger *log.Logger, config *config.Config) (*UserUsecase, error) {
	if config.AdminPassword != "" {
		if err := repo.UpsertDefaultUser(context.Background(), &domain.User{
			ID:       uuid.New().String(),
			Account:  "admin",
			Password: config.AdminPassword,
			Role:     consts.UserRoleAdmin,
		}); err != nil {
			return nil, fmt.Errorf("failed to create default user: %w", err)
		}
	}
	return &UserUsecase{
		repo:             repo,
		graphSyncUseCase: graphSyncUseCase,
		logger:           logger.WithModule("usecase.user"),
		config:           config,
	}, nil
}

func (u *UserUsecase) CreateUser(ctx context.Context, user *domain.User, edition consts.LicenseEdition) error {
	if err := u.repo.CreateUser(ctx, user, edition); err != nil {
		return err
	}

	if u.graphSyncUseCase != nil {
		go func() {
			createdAt := user.CreatedAt
			if createdAt.IsZero() {
				createdAt = time.Now()
			}
			if err := u.graphSyncUseCase.runWithRetry(context.Background(), graphSyncTaskUserCreate, user.ID, map[string]any{
				"account":    user.Account,
				"role":       string(user.Role),
				"created_at": createdAt.Format(time.RFC3339Nano),
			}, func(syncCtx context.Context) error {
				return u.graphSyncUseCase.SyncUserCreate(syncCtx, &domain.User{
					ID:        user.ID,
					Account:   user.Account,
					Role:      user.Role,
					CreatedAt: createdAt,
				})
			}); err != nil {
				u.logger.Error("sync user create to graph failed",
					log.String("user_id", user.ID),
					log.Error(err))
			}
		}()
	}

	return nil
}

func (u *UserUsecase) VerifyUserAndGenerateToken(ctx context.Context, req v1.LoginReq) (string, error) {
	var user *domain.User
	var err error
	user, err = u.repo.VerifyUser(ctx, req.Account, req.Password)
	if err != nil {
		return "", err
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":  user.ID,
		"exp": time.Now().Add(time.Hour * 24).Unix(),
	})

	return token.SignedString([]byte(u.config.Auth.JWT.Secret))
}

func (u *UserUsecase) GetUser(ctx context.Context, userID string) (*domain.User, error) {
	return u.repo.GetUser(ctx, userID)
}

func (u *UserUsecase) ListUsers(ctx context.Context) (*v1.UserListResp, error) {
	// 获取所有用户列表
	users, err := u.repo.ListUsers(ctx)
	if err != nil {
		return nil, err
	}
	return &v1.UserListResp{Users: users}, nil
}

func (u *UserUsecase) ResetPassword(ctx context.Context, req *v1.ResetPasswordReq) error {
	return u.repo.UpdateUserPassword(ctx, req.ID, req.NewPassword)
}

func (u *UserUsecase) DeleteUser(ctx context.Context, userID string) error {
	return u.repo.DeleteUser(ctx, userID)
}
