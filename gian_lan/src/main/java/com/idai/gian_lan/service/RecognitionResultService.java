package com.idai.gian_lan.service;

import com.idai.gian_lan.dto.request.RecognitionResultCreationRequest;
import com.idai.gian_lan.dto.response.RecognitionResultResponse;

import java.util.List;

public interface RecognitionResultService {

    RecognitionResultResponse saveResult(RecognitionResultCreationRequest request);

    List<RecognitionResultResponse> getAllResults();

    List<RecognitionResultResponse> getResultsByExamSession(String examSessionId);

    RecognitionResultResponse getResultById(String id);

    void deleteResult(String id);
}
