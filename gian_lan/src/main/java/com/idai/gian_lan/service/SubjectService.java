package com.idai.gian_lan.service;

import com.idai.gian_lan.dto.request.SubjectCreationRequest;
import com.idai.gian_lan.dto.request.SubjectUpdateRequest;
import com.idai.gian_lan.dto.response.SubjectResponse;

import java.util.List;

public interface SubjectService {

    SubjectResponse createSubject(SubjectCreationRequest request);

    List<SubjectResponse> getAllSubjects();

    SubjectResponse getSubjectById(String id);

    SubjectResponse getSubjectByCode(String subjectCode);

    SubjectResponse updateSubject(String id, SubjectUpdateRequest request);

    void deleteSubject(String id);
}
