package com.idai.gian_lan.repository;

import com.idai.gian_lan.entity.Model;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModelRepository extends JpaRepository<Model, String> {
    Optional<Model> findByStatus(String status);
    List<Model> findAllByStatus(String status);
}
