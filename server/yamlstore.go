package main

import (
	"fmt"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

func LoadFromYAML(path string) (VulnerabilityData, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return VulnerabilityData{Categories: []VulnerabilityCategory{}}, nil
		}
		return VulnerabilityData{}, fmt.Errorf("failed to read file: %w", err)
	}

	var vulnData VulnerabilityData
	if err := yaml.Unmarshal(data, &vulnData); err != nil {
		return VulnerabilityData{}, fmt.Errorf("failed to parse YAML: %w", err)
	}

	// Ensure IDs are set for existing data
	for i := range vulnData.Categories {
		if vulnData.Categories[i].ID == "" {
			vulnData.Categories[i].ID = generateID(vulnData.Categories[i].Name)
		}
		for j := range vulnData.Categories[i].Items {
			if vulnData.Categories[i].Items[j].ID == "" {
				vulnData.Categories[i].Items[j].ID = generateID(vulnData.Categories[i].Items[j].Name)
			}
		}
	}

	return vulnData, nil
}

func SaveToYAML(path string, data VulnerabilityData) error {
	absPath, err := filepath.Abs(path)
	if err != nil {
		return err
	}

	dir := filepath.Dir(absPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	yamlData, err := yaml.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal YAML: %w", err)
	}

	return os.WriteFile(absPath, yamlData, 0644)
}

func SaveToYAMLString(data VulnerabilityData) (string, error) {
	yamlData, err := yaml.Marshal(data)
	if err != nil {
		return "", fmt.Errorf("failed to marshal YAML: %w", err)
	}
	return string(yamlData), nil
}

func LoadFromYAMLString(content string) (VulnerabilityData, error) {
	var vulnData VulnerabilityData
	if err := yaml.Unmarshal([]byte(content), &vulnData); err != nil {
		return VulnerabilityData{}, fmt.Errorf("failed to parse YAML: %w", err)
	}

	for i := range vulnData.Categories {
		if vulnData.Categories[i].ID == "" {
			vulnData.Categories[i].ID = generateID(vulnData.Categories[i].Name)
		}
		for j := range vulnData.Categories[i].Items {
			if vulnData.Categories[i].Items[j].ID == "" {
				vulnData.Categories[i].Items[j].ID = generateID(vulnData.Categories[i].Items[j].Name)
			}
		}
	}

	return vulnData, nil
}
