package com.idai.gian_lan.repository;

import com.idai.gian_lan.entity.ModelStatistic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModelStatisticRepository extends JpaRepository<ModelStatistic, String> {
    Optional<ModelStatistic> findByStatus(String status);
    List<ModelStatistic> findAllByStatus(String status);
}

