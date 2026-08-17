package com.idai.gian_lan.controller;

import com.idai.gian_lan.dto.request.SubjectCreationRequest;
import com.idai.gian_lan.dto.request.SubjectUpdateRequest;
import com.idai.gian_lan.dto.response.ApiResponse;
import com.idai.gian_lan.dto.response.SubjectResponse;
import com.idai.gian_lan.service.SubjectService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SubjectController {

    SubjectService subjectService;

    @PostMapping
    public ApiResponse<SubjectResponse> createSubject(@RequestBody @Valid SubjectCreationRequest request) {
        return ApiResponse.<SubjectResponse>builder()
                .result(subjectService.createSubject(request))
                .build();
    }

    @GetMapping
    public ApiResponse<List<SubjectResponse>> getAllSubjects() {
        return ApiResponse.<List<SubjectResponse>>builder()
                .result(subjectService.getAllSubjects())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<SubjectResponse> getSubjectById(@PathVariable String id) {
        return ApiResponse.<SubjectResponse>builder()
                .result(subjectService.getSubjectById(id))
                .build();
    }

    @GetMapping("/code/{subjectCode}")
    public ApiResponse<SubjectResponse> getSubjectByCode(@PathVariable String subjectCode) {
        return ApiResponse.<SubjectResponse>builder()
                .result(subjectService.getSubjectByCode(subjectCode))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<SubjectResponse> updateSubject(
            @PathVariable String id,
            @RequestBody SubjectUpdateRequest request) {
        return ApiResponse.<SubjectResponse>builder()
                .result(subjectService.updateSubject(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteSubject(@PathVariable String id) {
        subjectService.deleteSubject(id);
        return ApiResponse.<String>builder()
                .result("Subject has been deleted successfully")
                .build();
    }
}
