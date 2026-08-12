package com.idai.gian_lan.service;

import com.idai.gian_lan.dto.request.ExamSessionCreationRequest;
import com.idai.gian_lan.dto.request.ExamSessionUpdateRequest;
import com.idai.gian_lan.dto.response.ExamSessionResponse;

import java.util.List;

public interface ExamSessionService {

    ExamSessionResponse createExamSession(ExamSessionCreationRequest request);

    List<ExamSessionResponse> getAllExamSessions();

    ExamSessionResponse getExamSessionById(String id);

    ExamSessionResponse updateExamSession(String id, ExamSessionUpdateRequest request);

    void deleteExamSession(String id);

    ExamSessionResponse addStudentsToSession(String id, List<String> studentIds);
}
