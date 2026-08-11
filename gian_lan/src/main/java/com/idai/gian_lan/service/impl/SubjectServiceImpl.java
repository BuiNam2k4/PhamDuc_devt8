package com.idai.gian_lan.service.impl;

import com.idai.gian_lan.dto.request.SubjectCreationRequest;
import com.idai.gian_lan.dto.request.SubjectUpdateRequest;
import com.idai.gian_lan.dto.response.SubjectResponse;
import com.idai.gian_lan.entity.Subject;
import com.idai.gian_lan.exception.AppException;
import com.idai.gian_lan.exception.ErrorCode;
import com.idai.gian_lan.mapper.SubjectMapper;
import com.idai.gian_lan.repository.SubjectRepository;
import com.idai.gian_lan.service.SubjectService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SubjectServiceImpl implements SubjectService {

    SubjectRepository subjectRepository;
    SubjectMapper subjectMapper;

    @Override
    public SubjectResponse createSubject(SubjectCreationRequest request) {
        if (subjectRepository.existsBySubjectCode(request.getSubjectCode())) {
            throw new AppException(ErrorCode.SUBJECT_EXISTED);
        }

        Subject subject = subjectMapper.toSubject(request);
        Subject savedSubject = subjectRepository.save(subject);
        return subjectMapper.toSubjectResponse(savedSubject);
    }

    @Override
    public List<SubjectResponse> getAllSubjects() {
        return subjectRepository.findAll().stream()
                .map(subjectMapper::toSubjectResponse)
                .collect(Collectors.toList());
    }

    @Override
    public SubjectResponse getSubjectById(String id) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_EXISTED));
        return subjectMapper.toSubjectResponse(subject);
    }

    @Override
    public SubjectResponse getSubjectByCode(String subjectCode) {
        Subject subject = subjectRepository.findBySubjectCode(subjectCode)
                .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_EXISTED));
        return subjectMapper.toSubjectResponse(subject);
    }

    @Override
    public SubjectResponse updateSubject(String id, SubjectUpdateRequest request) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_EXISTED));

        subjectMapper.updateSubject(subject, request);
        Subject updatedSubject = subjectRepository.save(subject);
        return subjectMapper.toSubjectResponse(updatedSubject);
    }

    @Override
    public void deleteSubject(String id) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_EXISTED));
        subjectRepository.delete(subject);
    }
}
