package com.devsec.vulverify.model;

public class VerifyResponse {
    private boolean success;
    private String message;
    private Object result;
    private long timestamp;
    private String category;
    private String item;

    public VerifyResponse() {
        this.timestamp = System.currentTimeMillis();
    }

    public VerifyResponse(boolean success, String message, Object result) {
        this.success = success;
        this.message = message;
        this.result = result;
        this.timestamp = System.currentTimeMillis();
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Object getResult() {
        return result;
    }

    public void setResult(Object result) {
        this.result = result;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getItem() {
        return item;
    }

    public void setItem(String item) {
        this.item = item;
    }

    public static VerifyResponse success(String message, Object result) {
        return new VerifyResponse(true, message, result);
    }

    public static VerifyResponse error(String message) {
        return new VerifyResponse(false, message, null);
    }
}
