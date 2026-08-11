package com.idai.gian_lan.service.impl;

import com.idai.gian_lan.dto.request.ModelCreationRequest;
import com.idai.gian_lan.dto.request.ModelUpdateRequest;
import com.idai.gian_lan.dto.response.ModelResponse;
import com.idai.gian_lan.entity.ModelStatistic;
import com.idai.gian_lan.exception.AppException;
import com.idai.gian_lan.exception.ErrorCode;
import com.idai.gian_lan.mapper.ModelMapper;
import com.idai.gian_lan.repository.ModelStatisticRepository;
import com.idai.gian_lan.service.ModelService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ModelServiceImpl implements ModelService {

    ModelStatisticRepository modelStatisticRepository;
    ModelMapper modelMapper;

    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_INACTIVE = "INACTIVE";

    @Override
    @Transactional
    public ModelResponse createModel(ModelCreationRequest request) {
        String status = (request.getStatus() != null && !request.getStatus().isBlank())
                ? request.getStatus().toUpperCase()
                : STATUS_INACTIVE;

        if (STATUS_ACTIVE.equalsIgnoreCase(status)) {
            deactivateAllModels();
        }

        ModelStatistic model = modelMapper.toModelStatistic(request);
        model.setStatus(status);

        ModelStatistic savedModel = modelStatisticRepository.save(model);
        return modelMapper.toModelResponse(savedModel);
    }

    @Override
    public List<ModelResponse> getAllModels() {
        return modelStatisticRepository.findAll().stream()
                .map(modelMapper::toModelResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ModelResponse getModelById(String id) {
        ModelStatistic model = modelStatisticRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MODEL_NOT_EXISTED));
        return modelMapper.toModelResponse(model);
    }

    @Override
    public ModelResponse getActiveModel() {
        ModelStatistic activeModel = modelStatisticRepository.findByStatus(STATUS_ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.MODEL_NOT_EXISTED));
        return modelMapper.toModelResponse(activeModel);
    }

    @Override
    @Transactional
    public ModelResponse updateModel(String id, ModelUpdateRequest request) {
        ModelStatistic model = modelStatisticRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MODEL_NOT_EXISTED));

        if (request.getName() != null) {
            model.setName(request.getName());
        }
        if (request.getPrecision() != null) {
            model.setPrecision(request.getPrecision());
        }
        if (request.getRecall() != null) {
            model.setRecall(request.getRecall());
        }
        if (request.getF1Score() != null) {
            model.setF1Score(request.getF1Score());
        }
        if (request.getModelPath() != null) {
            model.setModelPath(request.getModelPath());
        }
        if (request.getTotalSamples() != null) {
            model.setTotalSamples(request.getTotalSamples());
        }
        if (request.getCheatingDetections() != null) {
            model.setCheatingDetections(request.getCheatingDetections());
        }
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            String newStatus = request.getStatus().toUpperCase();
            if (STATUS_ACTIVE.equalsIgnoreCase(newStatus) && !STATUS_ACTIVE.equalsIgnoreCase(model.getStatus())) {
                deactivateAllModels();
            }
            model.setStatus(newStatus);
        }

        ModelStatistic updatedModel = modelStatisticRepository.save(model);
        return modelMapper.toModelResponse(updatedModel);
    }

    @Override
    @Transactional
    public ModelResponse activateModel(String id) {
        ModelStatistic model = modelStatisticRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MODEL_NOT_EXISTED));

        deactivateAllModels();
        model.setStatus(STATUS_ACTIVE);
        ModelStatistic savedModel = modelStatisticRepository.save(model);
        return modelMapper.toModelResponse(savedModel);
    }

    @Override
    @Transactional
    public void deleteModel(String id) {
        ModelStatistic model = modelStatisticRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MODEL_NOT_EXISTED));
        modelStatisticRepository.delete(model);
    }

    private void deactivateAllModels() {
        List<ModelStatistic> activeModels = modelStatisticRepository.findAllByStatus(STATUS_ACTIVE);
        for (ModelStatistic m : activeModels) {
            m.setStatus(STATUS_INACTIVE);
        }
        modelStatisticRepository.saveAll(activeModels);
    }
}
