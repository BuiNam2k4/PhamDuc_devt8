package com.idai.gian_lan.repository;

import com.idai.gian_lan.entity.ExamSessionCamera;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExamSessionCameraRepository extends JpaRepository<ExamSessionCamera, String> {
}
