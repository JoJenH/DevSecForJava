package com.devsec.vulfixed.controller;

import com.devsec.vulfixed.model.VerifyRequest;
import com.devsec.vulfixed.model.VerifyResponse;
import com.devsec.vulfixed.service.FixedVerifyService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/fixed")
public class FixedController {
    private static final Logger logger = LoggerFactory.getLogger(FixedController.class);

    private final Map<String, FixedVerifyService> services;

    public FixedController(List<FixedVerifyService> serviceList) {
        this.services = serviceList.stream()
                .collect(Collectors.toMap(
                        s -> s.getCategory().toLowerCase() + ":" + s.getItem().toLowerCase(),
                        s -> s,
                        (a, b) -> a
                ));
    }

    @PostMapping("/verify")
    public ResponseEntity<VerifyResponse> verifyFixed(
            @Valid @RequestBody VerifyRequest request) {

        String category = request.getCategory();
        String item = request.getItem();

        logger.info("Received fixed verification request: category={}, item={}", category, item);

        if (category == null || item == null) {
            VerifyResponse response = VerifyResponse.error("Missing category or item in request body");
            return ResponseEntity.badRequest().body(response);
        }

        String key = category.toLowerCase() + ":" + item.toLowerCase();
        FixedVerifyService service = services.get(key);

        if (service == null) {
            logger.warn("No fixed service found for category={}, item={}", category, item);
            VerifyResponse response = VerifyResponse.error(
                    "Unsupported vulnerability type: " + category + "/" + item);
            return ResponseEntity.badRequest().body(response);
        }

        VerifyResponse response = service.verify(request);
        response.setCategory(category);
        response.setItem(item);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> listVulnerabilities() {
        List<FixedVerifyService> allServices = services.values().stream().collect(Collectors.toList());

        Map<String, List<String>> vulnerabilityMap = new HashMap<>();
        for (FixedVerifyService service : allServices) {
            vulnerabilityMap
                    .computeIfAbsent(service.getCategory(), k -> new java.util.ArrayList<>())
                    .add(service.getItem());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("categories", vulnerabilityMap);
        result.put("total", allServices.size());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "UP");
        status.put("service", "vul-fixed");
        return ResponseEntity.ok(status);
    }
}
