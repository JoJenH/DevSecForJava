package com.devsec.vulfixed.model;

public class VerifyResponse {
    private boolean success;
    private String message;
    private Object result;
    private String category;
    private String item;

    public static VerifyResponse success(String message) {
        VerifyResponse response = new VerifyResponse();
        response.setSuccess(true);
        response.setMessage(message);
        return response;
    }

    public static VerifyResponse success(String message, Object result) {
        VerifyResponse response = new VerifyResponse();
        response.setSuccess(true);
        response.setMessage(message);
        response.setResult(result);
        return response;
    }

    public static VerifyResponse error(String message) {
        VerifyResponse response = new VerifyResponse();
        response.setSuccess(false);
        response.setMessage(message);
        return response;
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
}
