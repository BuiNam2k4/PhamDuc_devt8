package com.idai.gian_lan.dto.request;

import jakarta.validation.constraints.Min;
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
public class SubjectCreationRequest {

    @NotBlank(message = "Subject code is required")
    String subjectCode;

    @NotBlank(message = "Subject name is required")
    String name;

    @Min(value = 1, message = "Credits must be at least 1")
    int credits;

    String department;
}
