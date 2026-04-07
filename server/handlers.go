package main

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
)

func HandleLogin(adminPassword string) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req LoginRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
		}
		if req.Password != adminPassword {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "invalid password"})
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

func HandleGetData(store *Store) echo.HandlerFunc {
	return func(c echo.Context) error {
		return c.JSON(http.StatusOK, store.GetAll())
	}
}

func HandleCreateCategory(store *Store) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req CategoryCreateRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		if req.Name == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "name is required"})
		}
		cat, err := store.CreateCategory(req)
		if err != nil {
			return c.JSON(http.StatusConflict, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusCreated, cat)
	}
}

func HandleUpdateCategory(store *Store) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req CategoryUpdateRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		cat, err := store.UpdateCategory(c.Param("categoryId"), req)
		if err != nil {
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, cat)
	}
}

func HandleDeleteCategory(store *Store) echo.HandlerFunc {
	return func(c echo.Context) error {
		if err := store.DeleteCategory(c.Param("categoryId")); err != nil {
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		}
		return c.NoContent(http.StatusNoContent)
	}
}

func HandleCreateItem(store *Store) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req ItemCreateRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		if req.Name == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "name is required"})
		}
		item, err := store.CreateItem(c.Param("categoryId"), req)
		if err != nil {
			return c.JSON(http.StatusConflict, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusCreated, item)
	}
}

func HandleUpdateItem(store *Store) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req ItemUpdateRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		item, err := store.UpdateItem(c.Param("categoryId"), c.Param("itemId"), req)
		if err != nil {
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, item)
	}
}

func HandleDeleteItem(store *Store) echo.HandlerFunc {
	return func(c echo.Context) error {
		if err := store.DeleteItem(c.Param("categoryId"), c.Param("itemId")); err != nil {
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		}
		return c.NoContent(http.StatusNoContent)
	}
}

func HandleExportYAML(store *Store) echo.HandlerFunc {
	return func(c echo.Context) error {
		data := store.GetAll()
		yamlData, err := SaveToYAMLString(data)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		c.Response().Header().Set("Content-Type", "text/yaml; charset=utf-8")
		c.Response().Header().Set("Content-Disposition", "attachment; filename=vulnerabilities.yaml")
		return c.String(http.StatusOK, yamlData)
	}
}

func HandleExportMarkdown(store *Store) echo.HandlerFunc {
	return func(c echo.Context) error {
		data := store.GetAll()
		markdown := ExportToMarkdown(data)
		c.Response().Header().Set("Content-Type", "text/markdown; charset=utf-8")
		c.Response().Header().Set("Content-Disposition", "attachment; filename=vulnerabilities.md")
		return c.String(http.StatusOK, markdown)
	}
}

func HandleImportYAML(store *Store) echo.HandlerFunc {
	return func(c echo.Context) error {
		file, err := c.FormFile("file")
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "file is required"})
		}

		src, err := file.Open()
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to open file"})
		}
		defer src.Close()

		buf := make([]byte, file.Size)
		_, err = src.Read(buf)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to read file"})
		}

		data, err := LoadFromYAMLString(string(buf))
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}

		if err := store.ReplaceData(data); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}

		return c.JSON(http.StatusOK, map[string]string{"message": "import successful"})
	}
}
