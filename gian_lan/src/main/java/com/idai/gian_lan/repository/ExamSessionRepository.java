package com.idai.gian_lan.repository;

import com.idai.gian_lan.entity.ExamSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamSessionRepository extends JpaRepository<ExamSession, String> {
    List<ExamSession> findByRoomId(String roomId);
    List<ExamSession> findBySubjectId(String subjectId);
}
