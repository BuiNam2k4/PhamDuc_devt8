package com.idai.gian_lan.repository;

import com.idai.gian_lan.entity.Camera;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CameraRepository extends JpaRepository<Camera, String> {
}
