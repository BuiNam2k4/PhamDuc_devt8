package com.idai.gian_lan.service;

import com.idai.gian_lan.dto.request.StudentCreationRequest;
import com.idai.gian_lan.dto.request.StudentUpdateRequest;
import com.idai.gian_lan.dto.response.StudentResponse;

import java.util.List;

public interface StudentService {

    StudentResponse createStudent(StudentCreationRequest request);

    List<StudentResponse> getAllStudents();

    StudentResponse getStudentById(String id);

    StudentResponse getStudentByCode(String studentCode);

    StudentResponse updateStudent(String id, StudentUpdateRequest request);

    void deleteStudent(String id);
}
