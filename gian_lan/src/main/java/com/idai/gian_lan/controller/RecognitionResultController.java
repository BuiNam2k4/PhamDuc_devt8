package com.idai.gian_lan.controller;

import com.idai.gian_lan.dto.request.RecognitionResultCreationRequest;
import com.idai.gian_lan.dto.response.ApiResponse;
import com.idai.gian_lan.dto.response.RecognitionResultResponse;
import com.idai.gian_lan.service.RecognitionResultService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/violations")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "Violation Management", description = "APIs for saving and retrieving behavior violation detection results")
public class RecognitionResultController {

    RecognitionResultService recognitionResultService;

    @PostMapping
    @Operation(summary = "Save a new AI behavior recognition result (violation evidence)")
    public ApiResponse<RecognitionResultResponse> saveResult(@RequestBody @Valid RecognitionResultCreationRequest request) {
        return ApiResponse.<RecognitionResultResponse>builder()
                .result(recognitionResultService.saveResult(request))
                .build();
    }

    @GetMapping
    @Operation(summary = "Get all violation recognition results")
    public ApiResponse<List<RecognitionResultResponse>> getAllResults() {
        return ApiResponse.<List<RecognitionResultResponse>>builder()
                .result(recognitionResultService.getAllResults())
                .build();
    }

    @GetMapping("/session/{examSessionId}")
    @Operation(summary = "Get all violations for a specific exam session")
    public ApiResponse<List<RecognitionResultResponse>> getResultsByExamSession(@PathVariable String examSessionId) {
        return ApiResponse.<List<RecognitionResultResponse>>builder()
                .result(recognitionResultService.getResultsByExamSession(examSessionId))
                .build();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get violation details by ID")
    public ApiResponse<RecognitionResultResponse> getResultById(@PathVariable String id) {
        return ApiResponse.<RecognitionResultResponse>builder()
                .result(recognitionResultService.getResultById(id))
                .build();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a violation record")
    public ApiResponse<String> deleteResult(@PathVariable String id) {
        recognitionResultService.deleteResult(id);
        return ApiResponse.<String>builder()
                .result("Violation record has been deleted successfully")
                .build();
    }
}
