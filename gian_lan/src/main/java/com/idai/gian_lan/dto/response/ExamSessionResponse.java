package com.idai.gian_lan.dto.response;

import com.idai.gian_lan.dto.enums.ExamMode;
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
public class ExamSessionResponse {

    String id;
    Date startTime;
    float duration;
    ExamMode mode;
    RoomResponse room;
    SubjectResponse subject;
    List<ExamSessionDetailResponse> examSessionDetails;
}
