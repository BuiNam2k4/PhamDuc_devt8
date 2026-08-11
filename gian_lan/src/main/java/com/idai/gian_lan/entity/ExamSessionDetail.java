package com.idai.gian_lan.entity;

import com.idai.gian_lan.dto.enums.ExamStatus;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "exam_session_details")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ExamSessionDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Enumerated(EnumType.STRING)
    ExamStatus status;

    String seatNumber;

    String note;

    @ManyToOne
    @JoinColumn(name = "student_id")
    Student student;

    @ManyToOne
    @JoinColumn(name = "exam_session_id")
    ExamSession examSession;
}
