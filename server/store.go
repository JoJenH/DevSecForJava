package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
)

type Store struct {
	mu   sync.RWMutex
	data VulnerabilityData
	path string
}

func NewStore(dataPath string) (*Store, error) {
	s := &Store{path: dataPath}
	if err := s.load(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *Store) load() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	absPath, err := filepath.Abs(s.path)
	if err != nil {
		return err
	}

	data, err := os.ReadFile(absPath)
	if err != nil {
		if os.IsNotExist(err) {
			s.data = VulnerabilityData{Categories: []VulnerabilityCategory{}}
			return nil
		}
		return err
	}

	if err := json.Unmarshal(data, &s.data); err != nil {
		return err
	}
	return nil
}

func (s *Store) save() error {
	absPath, err := filepath.Abs(s.path)
	if err != nil {
		return err
	}

	dir := filepath.Dir(absPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	data, err := json.MarshalIndent(s.data, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(absPath, data, 0644)
}

func (s *Store) GetAll() VulnerabilityData {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.data
}

func (s *Store) CreateCategory(req CategoryCreateRequest) (*VulnerabilityCategory, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for _, cat := range s.data.Categories {
		if cat.ID == req.ID {
			return nil, fmt.Errorf("category already exists")
		}
	}

	newCat := VulnerabilityCategory{
		ID:    req.ID,
		Name:  req.Name,
		Items: []VulnerabilityItem{},
	}
	s.data.Categories = append(s.data.Categories, newCat)

	if err := s.save(); err != nil {
		return nil, err
	}
	return &newCat, nil
}

func (s *Store) UpdateCategory(categoryID string, req CategoryUpdateRequest) (*VulnerabilityCategory, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.data.Categories {
		if s.data.Categories[i].ID == categoryID {
			s.data.Categories[i].Name = req.Name
			cat := s.data.Categories[i]
			if err := s.save(); err != nil {
				return nil, err
			}
			return &cat, nil
		}
	}
	return nil, fmt.Errorf("category not found")
}

func (s *Store) DeleteCategory(categoryID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i, cat := range s.data.Categories {
		if cat.ID == categoryID {
			s.data.Categories = append(s.data.Categories[:i], s.data.Categories[i+1:]...)
			return s.save()
		}
	}
	return fmt.Errorf("category not found")
}

func (s *Store) CreateItem(categoryID string, req ItemCreateRequest) (*VulnerabilityItem, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.data.Categories {
		if s.data.Categories[i].ID == categoryID {
			for _, item := range s.data.Categories[i].Items {
				if item.ID == req.ID {
					return nil, fmt.Errorf("item already exists")
				}
			}
			newItem := VulnerabilityItem{
				ID:             req.ID,
				Name:           req.Name,
				ShortName:      req.ShortName,
				Description:    req.Description,
				VulnerableCode: req.VulnerableCode,
				FixedCode:      req.FixedCode,
				AuditPoints:    req.AuditPoints,
				FixPoints:      req.FixPoints,
				POC:            req.POC,
			}
			s.data.Categories[i].Items = append(s.data.Categories[i].Items, newItem)
			if err := s.save(); err != nil {
				return nil, err
			}
			return &newItem, nil
		}
	}
	return nil, fmt.Errorf("category not found")
}

func (s *Store) UpdateItem(categoryID, itemID string, req ItemUpdateRequest) (*VulnerabilityItem, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.data.Categories {
		if s.data.Categories[i].ID == categoryID {
			for j := range s.data.Categories[i].Items {
				if s.data.Categories[i].Items[j].ID == itemID {
					item := &s.data.Categories[i].Items[j]
					item.Name = req.Name
					item.ShortName = req.ShortName
					item.Description = req.Description
					item.VulnerableCode = req.VulnerableCode
					item.FixedCode = req.FixedCode
					item.AuditPoints = req.AuditPoints
					item.FixPoints = req.FixPoints
					item.POC = req.POC
					if err := s.save(); err != nil {
						return nil, err
					}
					return item, nil
				}
			}
			return nil, fmt.Errorf("item not found")
		}
	}
	return nil, fmt.Errorf("category not found")
}

func (s *Store) DeleteItem(categoryID, itemID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.data.Categories {
		if s.data.Categories[i].ID == categoryID {
			items := s.data.Categories[i].Items
			for j, item := range items {
				if item.ID == itemID {
					s.data.Categories[i].Items = append(items[:j], items[j+1:]...)
					return s.save()
				}
			}
			return fmt.Errorf("item not found")
		}
	}
	return fmt.Errorf("category not found")
}