package com.idai.gian_lan.controller;

import com.idai.gian_lan.dto.request.ExamSessionCreationRequest;
import com.idai.gian_lan.dto.request.ExamSessionUpdateRequest;
import com.idai.gian_lan.dto.response.ApiResponse;
import com.idai.gian_lan.dto.response.ExamSessionResponse;
import com.idai.gian_lan.service.ExamSessionService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exam-sessions")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ExamSessionController {

    ExamSessionService examSessionService;

    @PostMapping
    public ApiResponse<ExamSessionResponse> createExamSession(@RequestBody @Valid ExamSessionCreationRequest request) {
        return ApiResponse.<ExamSessionResponse>builder()
                .result(examSessionService.createExamSession(request))
                .build();
    }

    @GetMapping
    public ApiResponse<List<ExamSessionResponse>> getAllExamSessions() {
        return ApiResponse.<List<ExamSessionResponse>>builder()
                .result(examSessionService.getAllExamSessions())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<ExamSessionResponse> getExamSessionById(@PathVariable String id) {
        return ApiResponse.<ExamSessionResponse>builder()
                .result(examSessionService.getExamSessionById(id))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<ExamSessionResponse> updateExamSession(
            @PathVariable String id,
            @RequestBody ExamSessionUpdateRequest request) {
        return ApiResponse.<ExamSessionResponse>builder()
                .result(examSessionService.updateExamSession(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteExamSession(@PathVariable String id) {
        examSessionService.deleteExamSession(id);
        return ApiResponse.<String>builder()
                .result("Exam session deleted successfully")
                .build();
    }

    @PostMapping("/{id}/students")
    public ApiResponse<ExamSessionResponse> addStudentsToSession(
            @PathVariable String id,
            @RequestBody List<String> studentIds) {
        return ApiResponse.<ExamSessionResponse>builder()
                .result(examSessionService.addStudentsToSession(id, studentIds))
                .build();
    }
}
