package com.devsec.vulfixed.service;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Component
public class FixedServiceRegistry {
    private final Map<String, FixedVerifyService> services = new ConcurrentHashMap<>();

    public void register(FixedVerifyService service) {
        String key = buildKey(service.getCategory(), service.getItem());
        services.put(key, service);
    }

    public void registerAll(List<FixedVerifyService> serviceList) {
        for (FixedVerifyService service : serviceList) {
            register(service);
        }
    }

    public FixedVerifyService getService(String category, String item) {
        String key = buildKey(category, item);
        return services.get(key);
    }

    public List<FixedVerifyService> getServicesByCategory(String category) {
        return services.values().stream()
                .filter(s -> s.getCategory().equalsIgnoreCase(category))
                .collect(Collectors.toList());
    }

    public List<FixedVerifyService> getAllServices() {
        return new ArrayList<>(services.values());
    }

    public boolean hasService(String category, String item) {
        return services.containsKey(buildKey(category, item));
    }

    private String buildKey(String category, String item) {
        return category.toLowerCase() + ":" + item.toLowerCase();
    }
}
