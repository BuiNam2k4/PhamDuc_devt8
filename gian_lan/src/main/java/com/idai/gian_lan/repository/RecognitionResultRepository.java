package com.idai.gian_lan.repository;

import com.idai.gian_lan.entity.RecognitionResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecognitionResultRepository extends JpaRepository<RecognitionResult, String> {
    List<RecognitionResult> findByExamSessionCamera_ExamSession_Id(String examSessionId);
}
