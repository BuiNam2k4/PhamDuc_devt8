package com.idai.gian_lan.service.impl;

import com.idai.gian_lan.dto.request.RecognitionResultCreationRequest;
import com.idai.gian_lan.dto.response.RecognitionResultResponse;
import com.idai.gian_lan.entity.ExamSessionCamera;
import com.idai.gian_lan.entity.Model;
import com.idai.gian_lan.entity.RecognitionResult;
import com.idai.gian_lan.exception.AppException;
import com.idai.gian_lan.exception.ErrorCode;
import com.idai.gian_lan.mapper.RecognitionResultMapper;
import com.idai.gian_lan.repository.ExamSessionCameraRepository;
import com.idai.gian_lan.repository.ExamSessionRepository;
import com.idai.gian_lan.entity.ExamSession;
import com.idai.gian_lan.repository.ModelRepository;
import com.idai.gian_lan.repository.RecognitionResultRepository;
import com.idai.gian_lan.repository.StudentRepository;
import com.idai.gian_lan.entity.Student;
import com.idai.gian_lan.service.RecognitionResultService;
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
public class RecognitionResultServiceImpl implements RecognitionResultService {

    RecognitionResultRepository recognitionResultRepository;
    ExamSessionCameraRepository examSessionCameraRepository;
    ExamSessionRepository examSessionRepository;
    StudentRepository studentRepository;
    ModelRepository modelRepository;
    RecognitionResultMapper recognitionResultMapper;

    @Override
    @Transactional
    public RecognitionResultResponse saveResult(RecognitionResultCreationRequest request) {
        ExamSessionCamera examSessionCamera = examSessionCameraRepository.findById(request.getExamSessionCameraId())
                .orElse(null);

        ExamSession examSession = null;
        if (examSessionCamera != null) {
            examSession = examSessionCamera.getExamSession();
        } else {
            // Fallback: If no camera found, check if the ID refers directly to an ExamSession (e.g. online exam)
            examSession = examSessionRepository.findById(request.getExamSessionCameraId())
                    .orElseThrow(() -> new AppException(ErrorCode.EXAM_SESSION_NOT_EXISTED));
        }

        Model model = null;
        if (request.getModelId() != null && !request.getModelId().isBlank()) {
            model = modelRepository.findById(request.getModelId())
                    .orElseThrow(() -> new AppException(ErrorCode.MODEL_NOT_EXISTED));
        }

        Student student = null;
        if (request.getStudentUsername() != null && !request.getStudentUsername().isBlank()) {
            student = studentRepository.findByUsername(request.getStudentUsername()).orElse(null);
        }

        RecognitionResult recognitionResult = recognitionResultMapper.toRecognitionResult(request);
        recognitionResult.setExamSessionCamera(examSessionCamera);
        recognitionResult.setExamSession(examSession);
        recognitionResult.setModel(model);
        recognitionResult.setStudent(student);

        if (recognitionResult.getDetectionTime() == null || recognitionResult.getDetectionTime().isBlank()) {
            recognitionResult.setDetectionTime(java.time.LocalDateTime.now().toString());
        }

        RecognitionResult savedResult = recognitionResultRepository.save(recognitionResult);
        return recognitionResultMapper.toRecognitionResultResponse(savedResult);
    }

    @Override
    public List<RecognitionResultResponse> getAllResults() {
        return recognitionResultRepository.findAll().stream()
                .map(recognitionResultMapper::toRecognitionResultResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<RecognitionResultResponse> getResultsByExamSession(String examSessionId) {
        return recognitionResultRepository.findByExamSession_Id(examSessionId).stream()
                .map(recognitionResultMapper::toRecognitionResultResponse)
                .collect(Collectors.toList());
    }

    @Override
    public RecognitionResultResponse getResultById(String id) {
        RecognitionResult result = recognitionResultRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RECOGNITION_RESULT_NOT_EXISTED));
        return recognitionResultMapper.toRecognitionResultResponse(result);
    }

    @Override
    @Transactional
    public void deleteResult(String id) {
        RecognitionResult result = recognitionResultRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RECOGNITION_RESULT_NOT_EXISTED));
        recognitionResultRepository.delete(result);
    }
}
