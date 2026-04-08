package main

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
)

func HandleLogin(editToken string) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req LoginRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
		}
		if req.Password != editToken {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "invalid token"})
		}
		token, err := GenerateToken()
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to generate token"})
		}
		return c.JSON(http.StatusOK, LoginResponse{Token: token})
	}
}

func HandleAuthCheck() echo.HandlerFunc {
	return func(c echo.Context) error {
		authHeader := c.Request().Header.Get("Authorization")
		if authHeader == "" {
			return c.JSON(http.StatusOK, map[string]bool{"authenticated": false})
		}
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.JSON(http.StatusOK, map[string]bool{"authenticated": false})
		}
		valid := ValidateToken(parts[1])
		return c.JSON(http.StatusOK, map[string]bool{"authenticated": valid})
	}
}

func HandleListCategories(store *Store) echo.HandlerFunc {
	return func(c echo.Context) error {
		categories, err := store.ListCategories()
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, categories)
	}
}

func HandleGetCategory(store *Store) echo.HandlerFunc {
	return func(c echo.Context) error {
		name := c.Param("name")
		category, err := store.GetCategory(name)
		if err != nil {
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, category)
	}
}

func HandleCreateCategory(store *Store) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req struct {
			Name string `json:"name"`
		}
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		if req.Name == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "name is required"})
		}
		if err := store.CreateCategory(req.Name); err != nil {
			return c.JSON(http.StatusConflict, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusCreated, CategoryInfo{Name: req.Name})
	}
}

func HandleUpdateCategory(store *Store) echo.HandlerFunc {
	return func(c echo.Context) error {
		name := c.Param("name")
		var req CategoryUpdateRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		if err := store.UpdateCategory(name, req); err != nil {
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, CategoryContent{Name: name, Content: req.Content})
	}
}

func HandleDeleteCategory(store *Store) echo.HandlerFunc {
	return func(c echo.Context) error {
		name := c.Param("name")
		if err := store.DeleteCategory(name); err != nil {
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		}
		return c.NoContent(http.StatusNoContent)
	}
}
