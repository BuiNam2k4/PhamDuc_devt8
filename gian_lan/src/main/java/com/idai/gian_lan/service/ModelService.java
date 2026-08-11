package com.idai.gian_lan.service;

import com.idai.gian_lan.dto.request.ModelCreationRequest;
import com.idai.gian_lan.dto.request.ModelUpdateRequest;
import com.idai.gian_lan.dto.response.ModelResponse;

import java.util.List;

public interface ModelService {
    ModelResponse createModel(ModelCreationRequest request);
    List<ModelResponse> getAllModels();
    ModelResponse getModelById(String id);
    ModelResponse getActiveModel();
    ModelResponse updateModel(String id, ModelUpdateRequest request);
    ModelResponse activateModel(String id);
    void deleteModel(String id);
}
