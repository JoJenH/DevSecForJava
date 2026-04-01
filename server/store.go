package main

import (
	"fmt"
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

	parsed, err := LoadFromYAML(absPath)
	if err != nil {
		return err
	}
	s.data = parsed
	return nil
}

// func (s *Store) save() error {
// 	s.mu.Lock()
// 	defer s.mu.Unlock()
// 	return s.saveLocked()
// }

func (s *Store) saveLocked() error {
	absPath, err := filepath.Abs(s.path)
	if err != nil {
		return err
	}

	return SaveToYAML(absPath, s.data)
}

func (s *Store) GetAll() VulnerabilityData {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.data
}

func (s *Store) CreateCategory(req CategoryCreateRequest) (*VulnerabilityCategory, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	id := generateID(req.Name)
	for _, cat := range s.data.Categories {
		if cat.ID == id {
			return nil, fmt.Errorf("category already exists")
		}
	}

	newCat := VulnerabilityCategory{
		ID:    id,
		Name:  req.Name,
		Items: []VulnerabilityItem{},
	}
	s.data.Categories = append(s.data.Categories, newCat)

	if err := s.saveLocked(); err != nil {
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
			if err := s.saveLocked(); err != nil {
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
			return s.saveLocked()
		}
	}
	return fmt.Errorf("category not found")
}

func (s *Store) CreateItem(categoryID string, req ItemCreateRequest) (*VulnerabilityItem, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.data.Categories {
		if s.data.Categories[i].ID == categoryID {
			id := generateID(req.Name)

			for _, item := range s.data.Categories[i].Items {
				if item.ID == id {
					return nil, fmt.Errorf("item already exists")
				}
			}
			newItem := VulnerabilityItem{
				ID:             id,
				Name:           req.Name,
				Description:    req.Description,
				VulnerableCode: req.VulnerableCode,
				FixedCode:      req.FixedCode,
				AuditPoints:    req.AuditPoints,
				FixPoints:      req.FixPoints,
				POC:            req.POC,
			}
			s.data.Categories[i].Items = append(s.data.Categories[i].Items, newItem)
			if err := s.saveLocked(); err != nil {
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
					item.Description = req.Description
					item.VulnerableCode = req.VulnerableCode
					item.FixedCode = req.FixedCode
					item.AuditPoints = req.AuditPoints
					item.FixPoints = req.FixPoints
					item.POC = req.POC
					if err := s.saveLocked(); err != nil {
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
					return s.saveLocked()
				}
			}
			return fmt.Errorf("item not found")
		}
	}
	return fmt.Errorf("category not found")
}

func (s *Store) ReplaceData(data VulnerabilityData) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.data = data
	return s.saveLocked()
}
