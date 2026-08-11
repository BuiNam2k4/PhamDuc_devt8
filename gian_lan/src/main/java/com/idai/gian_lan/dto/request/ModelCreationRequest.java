package com.idai.gian_lan.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ModelCreationRequest {

    @NotBlank
    String name;

    String precision;

    String recall;

    String f1Score;

    String status;

    String modelPath;

    int totalSamples;

    int cheatingDetections;
}
