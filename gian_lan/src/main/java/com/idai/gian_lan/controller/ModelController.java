package com.idai.gian_lan.controller;

import com.idai.gian_lan.dto.request.ModelCreationRequest;
import com.idai.gian_lan.dto.request.ModelUpdateRequest;
import com.idai.gian_lan.dto.response.ApiResponse;
import com.idai.gian_lan.dto.response.ModelResponse;
import com.idai.gian_lan.service.ModelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/models")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "Model Management", description = "APIs for managing AI Models and Statistics")
public class ModelController {

    ModelService modelService;

    @PostMapping
    @Operation(summary = "Create a new AI Model version")
    public ApiResponse<ModelResponse> createModel(@RequestBody @Valid ModelCreationRequest request) {
        return ApiResponse.<ModelResponse>builder()
                .result(modelService.createModel(request))
                .build();
    }

    @GetMapping
    @Operation(summary = "Get all trained AI Models")
    public ApiResponse<List<ModelResponse>> getAllModels() {
        return ApiResponse.<List<ModelResponse>>builder()
                .result(modelService.getAllModels())
                .build();
    }

    @GetMapping("/active")
    @Operation(summary = "Get the currently ACTIVE AI Model for exam monitoring")
    public ApiResponse<ModelResponse> getActiveModel() {
        return ApiResponse.<ModelResponse>builder()
                .result(modelService.getActiveModel())
                .build();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get model details by ID")
    public ApiResponse<ModelResponse> getModelById(@PathVariable String id) {
        return ApiResponse.<ModelResponse>builder()
                .result(modelService.getModelById(id))
                .build();
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update AI Model attributes and statistics")
    public ApiResponse<ModelResponse> updateModel(@PathVariable String id, @RequestBody ModelUpdateRequest request) {
        return ApiResponse.<ModelResponse>builder()
                .result(modelService.updateModel(id, request))
                .build();
    }

    @PutMapping("/{id}/activate")
    @Operation(summary = "Activate a model for live cheating detection (Hot-reload)")
    public ApiResponse<ModelResponse> activateModel(@PathVariable String id) {
        return ApiResponse.<ModelResponse>builder()
                .result(modelService.activateModel(id))
                .build();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an AI Model version")
    public ApiResponse<String> deleteModel(@PathVariable String id) {
        modelService.deleteModel(id);
        return ApiResponse.<String>builder()
                .result("Model has been deleted successfully")
                .build();
    }
}
