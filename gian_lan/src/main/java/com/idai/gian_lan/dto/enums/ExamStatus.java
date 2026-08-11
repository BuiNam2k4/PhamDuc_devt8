package com.idai.gian_lan.dto.enums;

import lombok.Getter;

@Getter
public enum ExamStatus {
    SCHEDULED("Chưa diễn ra"),
    CHECKED_IN("Đã điểm danh"),
    EXAMINING("Đang làm bài"),
    COMPLETED("Đã hoàn thành"),
    ABSENT("Vắng mặt"),
    VIOLATED("Bị đình chỉ do vi phạm");

    private final String description;

    ExamStatus(String description) {
        this.description = description;
    }
}
