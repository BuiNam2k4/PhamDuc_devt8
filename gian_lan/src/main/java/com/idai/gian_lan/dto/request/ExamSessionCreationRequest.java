package com.idai.gian_lan.dto.request;

import com.idai.gian_lan.dto.enums.ExamMode;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ExamSessionCreationRequest {

    @NotNull(message = "Start time is required")
    Date startTime;

    @NotNull(message = "Duration is required")
    float duration;

    ExamMode mode;

    String roomId;

    @NotNull(message = "Subject ID is required")
    String subjectId;

    String modelId;

    List<String> studentIds;

    List<String> cameraIds;
}
