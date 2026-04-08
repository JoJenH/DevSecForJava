package com.devsec.vulfixed.config;

import com.devsec.vulfixed.service.FixedServiceRegistry;
import com.devsec.vulfixed.service.FixedVerifyService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class FixedServiceConfig {

    @Bean
    public FixedServiceRegistry fixedServiceRegistry(
            List<FixedVerifyService> services) {
        FixedServiceRegistry registry = new FixedServiceRegistry();
        registry.registerAll(services);
        return registry;
    }
}
