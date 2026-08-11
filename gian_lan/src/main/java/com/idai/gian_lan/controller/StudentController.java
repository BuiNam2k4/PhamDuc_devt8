package com.idai.gian_lan.controller;

import com.idai.gian_lan.dto.request.StudentCreationRequest;
import com.idai.gian_lan.dto.request.StudentUpdateRequest;
import com.idai.gian_lan.dto.response.ApiResponse;
import com.idai.gian_lan.dto.response.StudentResponse;
import com.idai.gian_lan.service.StudentService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StudentController {

    StudentService studentService;

    @PostMapping
    public ApiResponse<StudentResponse> createStudent(@RequestBody @Valid StudentCreationRequest request) {
        return ApiResponse.<StudentResponse>builder()
                .result(studentService.createStudent(request))
                .build();
    }

    @GetMapping
    public ApiResponse<List<StudentResponse>> getAllStudents() {
        return ApiResponse.<List<StudentResponse>>builder()
                .result(studentService.getAllStudents())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<StudentResponse> getStudentById(@PathVariable String id) {
        return ApiResponse.<StudentResponse>builder()
                .result(studentService.getStudentById(id))
                .build();
    }

    @GetMapping("/code/{studentCode}")
    public ApiResponse<StudentResponse> getStudentByCode(@PathVariable String studentCode) {
        return ApiResponse.<StudentResponse>builder()
                .result(studentService.getStudentByCode(studentCode))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<StudentResponse> updateStudent(
            @PathVariable String id,
            @RequestBody StudentUpdateRequest request) {
        return ApiResponse.<StudentResponse>builder()
                .result(studentService.updateStudent(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteStudent(@PathVariable String id) {
        studentService.deleteStudent(id);
        return ApiResponse.<String>builder()
                .result("Student has been deleted successfully")
                .build();
    }
}
