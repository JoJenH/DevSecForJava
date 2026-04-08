package com.devsec.vulfixed.controller;

import com.devsec.vulfixed.model.VerifyRequest;
import com.devsec.vulfixed.model.VerifyResponse;
import com.devsec.vulfixed.service.FixedServiceRegistry;
import com.devsec.vulfixed.service.FixedVerifyService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/vul")
public class FixedController {
    private static final Logger logger = LoggerFactory.getLogger(FixedController.class);

    private final FixedServiceRegistry registry;

    public FixedController(FixedServiceRegistry registry) {
        this.registry = registry;
    }

    @PostMapping("/{category}/{item}/fixed")
    public ResponseEntity<VerifyResponse> verifyFixed(
            @PathVariable String category,
            @PathVariable String item,
            @Valid @RequestBody(required = false) VerifyRequest request) {

        logger.info("Received fixed verification request: category={}, item={}", category, item);

        if (request == null) {
            request = new VerifyRequest();
        }
        request.setCategory(category);
        request.setItem(item);

        FixedVerifyService service = registry.getService(category, item);

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
        List<FixedVerifyService> services = registry.getAllServices();

        Map<String, List<String>> vulnerabilityMap = new HashMap<>();
        for (FixedVerifyService service : services) {
            vulnerabilityMap
                    .computeIfAbsent(service.getCategory(), k -> new java.util.ArrayList<>())
                    .add(service.getItem());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("categories", vulnerabilityMap);
        result.put("total", services.size());

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
