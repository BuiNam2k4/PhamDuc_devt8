package com.idai.gian_lan.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RecognitionResultCreationRequest {

    @NotBlank(message = "Violation type cannot be blank")
    String violationType;

    @NotNull(message = "Confidence cannot be null")
    Double confidence;

    String detectionTime;

    String detail;

    String imageUrl;

    String modelId;

    @NotBlank(message = "Exam session camera ID cannot be blank")
    String examSessionCameraId;
}
