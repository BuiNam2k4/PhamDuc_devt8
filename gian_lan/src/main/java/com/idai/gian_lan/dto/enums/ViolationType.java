package com.idai.gian_lan.dto.enums;

import lombok.Getter;

@Getter
public enum ViolationType {
    PHONE_DETECTED("Phát hiện sử dụng điện thoại"),
    LOOK_AWAY("Quay đầu / Nhìn ra ngoài màn hình"),
    MULTIPLE_FACES("Phát hiện nhiều khuôn mặt trong khung hình"),
    FACE_NOT_DETECTED("Không phát hiện khuôn mặt thí sinh"),
    USING_DOCUMENT("Sử dụng tài liệu trái phép"),
    HEAD_POSE_ABNORMAL("Tư thế đầu bất thường kéo dài"),
    OTHER("Vi phạm khác");

    private final String description;

    ViolationType(String description) {
        this.description = description;
    }
}
