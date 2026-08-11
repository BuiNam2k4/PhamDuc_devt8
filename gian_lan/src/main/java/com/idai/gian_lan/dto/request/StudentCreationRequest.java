package com.idai.gian_lan.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StudentCreationRequest {

    @NotBlank(message = "Student code is required")
    String studentCode;

    @NotBlank(message = "Full name is required")
    String fullName;

    String email;
    String className;
    String avatarUrl;
    String faceEmbedding;
}
