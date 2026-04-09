package com.devsec.vulfixed.service.impl;

import com.devsec.vulfixed.model.VerifyRequest;
import com.devsec.vulfixed.model.VerifyResponse;
import com.devsec.vulfixed.service.FixedVerifyService;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class RCEFixedVerifyService implements FixedVerifyService {
    private static final String CATEGORY = "RCE";
    private static final String ITEM = "Runtime.exec";
    private static final int TIMEOUT_SECONDS = 5;

    @Override
    public String getCategory() {
        return CATEGORY;
    }

    @Override
    public String getItem() {
        return ITEM;
    }

    @Override
    public VerifyResponse verify(VerifyRequest request) {
        String payload = request.getPayload();

        if (payload == null || payload.isEmpty()) {
            return VerifyResponse.error("Payload is required");
        }

        if (containsCommandInjection(payload)) {
            return VerifyResponse.error("Potential command injection detected - input contains shell metacharacters");
        }

        try {
            String[] cmd = {"ping", "-c", "1", "-W", "1", payload};
            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            StringBuilder output = new StringBuilder();
            boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);

            if (!finished) {
                process.destroyForcibly();
                return VerifyResponse.error("Command timeout exceeded");
            }

            try (java.io.BufferedReader reader = new java.io.BufferedReader(
                    new java.io.InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }

            int exitCode = process.exitValue();

            if (exitCode == 0) {
                return VerifyResponse.success("Secure input validation works correctly", output.toString());
            } else {
                return VerifyResponse.success("Host reachable but with errors", output.toString());
            }
        } catch (Exception e) {
            return VerifyResponse.error("Execution failed: " + e.getMessage());
        }
    }

    private boolean containsCommandInjection(String input) {
        if (input == null) return false;
        String[] dangerous = {";", "|", "&", "`", "$", "(", ")", "<", ">", "\n", "\r", "\t"};
        for (String token : dangerous) {
            if (input.contains(token)) {
                return true;
            }
        }
        return false;
    }

    @Override
    public boolean supports(String category, String item) {
        return CATEGORY.equalsIgnoreCase(category) && ITEM.equalsIgnoreCase(item);
    }
}
