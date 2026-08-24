package com.idai.gian_lan.repository;

import com.idai.gian_lan.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, String> {

    Optional<Student> findByStudentCode(String studentCode);

    Optional<Student> findByUsername(String username);

    boolean existsByStudentCode(String studentCode);

    List<Student> findByClassName(String className);
}
