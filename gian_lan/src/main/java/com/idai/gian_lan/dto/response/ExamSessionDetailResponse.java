package com.idai.gian_lan.dto.response;

import com.idai.gian_lan.dto.enums.ExamStatus;
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
public class ExamSessionDetailResponse {

    String id;
    ExamStatus status;
    String seatNumber;
    String note;
    StudentResponse student;
}
