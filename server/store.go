package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

type Store struct {
	mu   sync.RWMutex
	path string
}

func NewStore(dataPath string) (*Store, error) {
	s := &Store{path: dataPath}
	if err := s.ensureDir(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *Store) ensureDir() error {
	absPath, err := filepath.Abs(s.path)
	if err != nil {
		return err
	}
	return os.MkdirAll(absPath, 0755)
}

func (s *Store) ListCategories() ([]CategoryInfo, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	absPath, err := filepath.Abs(s.path)
	if err != nil {
		return nil, err
	}

	entries, err := os.ReadDir(absPath)
	if err != nil {
		return nil, err
	}

	var categories []CategoryInfo
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		if filepath.Ext(entry.Name()) != ".md" {
			continue
		}
		name := strings.TrimSuffix(entry.Name(), ".md")
		categories = append(categories, CategoryInfo{Name: name})
	}
	return categories, nil
}

func (s *Store) GetCategory(name string) (*CategoryContent, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	absPath, err := filepath.Abs(s.path)
	if err != nil {
		return nil, err
	}

	filename := name + ".md"
	filePath := filepath.Join(absPath, filename)

	content, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("category not found")
		}
		return nil, err
	}

	return &CategoryContent{
		Name:    name,
		Content: string(content),
	}, nil
}

func (s *Store) CreateCategory(name string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	absPath, err := filepath.Abs(s.path)
	if err != nil {
		return err
	}

	filename := name + ".md"
	filePath := filepath.Join(absPath, filename)

	if _, err := os.Stat(filePath); err == nil {
		return fmt.Errorf("category already exists")
	}

	defaultContent := "# " + name + "\n\n"
	return os.WriteFile(filePath, []byte(defaultContent), 0644)
}

func (s *Store) UpdateCategory(name string, req CategoryUpdateRequest) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	absPath, err := filepath.Abs(s.path)
	if err != nil {
		return err
	}

	filename := name + ".md"
	filePath := filepath.Join(absPath, filename)

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return fmt.Errorf("category not found")
	}

	return os.WriteFile(filePath, []byte(req.Content), 0644)
}

func (s *Store) DeleteCategory(name string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	absPath, err := filepath.Abs(s.path)
	if err != nil {
		return err
	}

	filename := name + ".md"
	filePath := filepath.Join(absPath, filename)

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return fmt.Errorf("category not found")
	}

	return os.Remove(filePath)
}
