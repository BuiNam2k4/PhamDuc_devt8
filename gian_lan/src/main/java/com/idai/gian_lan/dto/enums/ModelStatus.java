package com.idai.gian_lan.dto.enums;

import lombok.Getter;

@Getter
public enum ModelStatus {
    ACTIVE("Đang kích hoạt"),
    INACTIVE("Ngừng kích hoạt"),
    TRAINING("Đang huấn luyện");

    private final String description;

    ModelStatus(String description) {
        this.description = description;
    }
}
