package com.idai.gian_lan.dto.request;

import com.idai.gian_lan.dto.enums.ExamMode;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ExamSessionUpdateRequest {

    Date startTime;

    Float duration;

    ExamMode mode;

    String roomId;

    String subjectId;
}
