package com.idai.gian_lan.dto.response;

import com.idai.gian_lan.dto.enums.ViolationType;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RecognitionResultResponse {

    String id;

    ViolationType violationType;

    Double confidence;

    String detectionTime;

    String detail;

    String imageUrl;

    String modelId;

    String modelName;

    String studentUsername;

    String studentFullName;

    String examSessionCameraId;

    String examSessionId;
}
