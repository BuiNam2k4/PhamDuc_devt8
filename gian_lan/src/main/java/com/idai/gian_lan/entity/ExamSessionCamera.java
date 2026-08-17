package com.idai.gian_lan.entity;

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
@Table(name = "exam_session_cameras")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ExamSessionCamera {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    String videoPath;

    @ManyToOne
    @JoinColumn(name = "camera_id")
    Camera camera;

    @ManyToOne
    @JoinColumn(name = "exam_session_id")
    ExamSession examSession;
}
