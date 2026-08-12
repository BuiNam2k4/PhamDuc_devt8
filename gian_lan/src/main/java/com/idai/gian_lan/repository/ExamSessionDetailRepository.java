package com.idai.gian_lan.repository;

import com.idai.gian_lan.entity.ExamSessionDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamSessionDetailRepository extends JpaRepository<ExamSessionDetail, String> {
    List<ExamSessionDetail> findByExamSessionId(String examSessionId);
    List<ExamSessionDetail> findByStudentId(String studentId);
}
