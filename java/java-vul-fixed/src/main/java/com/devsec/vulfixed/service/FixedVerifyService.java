package com.devsec.vulfixed.service;

import com.devsec.vulfixed.model.VerifyRequest;
import com.devsec.vulfixed.model.VerifyResponse;

public interface FixedVerifyService {
    String getCategory();
    String getItem();
    VerifyResponse verify(VerifyRequest request);
    boolean supports(String category, String item);
}
