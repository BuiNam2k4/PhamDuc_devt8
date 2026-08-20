package com.idai.gian_lan.repository;

import com.idai.gian_lan.entity.ExamSessionCamera;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ExamSessionCameraRepository extends JpaRepository<ExamSessionCamera, String> {
    void deleteByExamSession_Id(String examSessionId);
    Optional<ExamSessionCamera> findByExamSession_Id(String examSessionId);
    java.util.List<ExamSessionCamera> findAllByExamSession_Id(String examSessionId);
}

