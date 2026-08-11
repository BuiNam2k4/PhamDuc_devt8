package com.idai.gian_lan.dto.enums;

import lombok.Getter;

@Getter
public enum CameraStatus {
    ONLINE("Đang hoạt động"),
    OFFLINE("Mất kết nối"),
    RECORDING("Đang ghi hình"),
    ERROR("Gặp lỗi");

    private final String description;

    CameraStatus(String description) {
        this.description = description;
    }
}
