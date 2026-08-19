package com.idai.gian_lan.service.impl;

import com.idai.gian_lan.dto.enums.ExamMode;
import com.idai.gian_lan.dto.enums.ExamStatus;
import com.idai.gian_lan.dto.request.ExamSessionCreationRequest;
import com.idai.gian_lan.dto.request.ExamSessionUpdateRequest;
import com.idai.gian_lan.dto.response.ExamSessionResponse;
import com.idai.gian_lan.entity.ExamSession;
import com.idai.gian_lan.entity.ExamSessionDetail;
import com.idai.gian_lan.entity.Room;
import com.idai.gian_lan.entity.Student;
import com.idai.gian_lan.entity.Subject;
import com.idai.gian_lan.entity.Model;
import com.idai.gian_lan.exception.AppException;
import com.idai.gian_lan.exception.ErrorCode;
import com.idai.gian_lan.mapper.ExamSessionMapper;
import com.idai.gian_lan.repository.ExamSessionDetailRepository;
import com.idai.gian_lan.repository.ExamSessionRepository;
import com.idai.gian_lan.repository.RoomRepository;
import com.idai.gian_lan.entity.ExamSessionCamera;
import com.idai.gian_lan.repository.ExamSessionCameraRepository;
import com.idai.gian_lan.repository.StudentRepository;
import com.idai.gian_lan.repository.SubjectRepository;
import com.idai.gian_lan.repository.ModelRepository;
import com.idai.gian_lan.service.ExamSessionService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ExamSessionServiceImpl implements ExamSessionService {

    ExamSessionRepository examSessionRepository;
    ExamSessionDetailRepository examSessionDetailRepository;
    ExamSessionCameraRepository examSessionCameraRepository;
    RoomRepository roomRepository;
    SubjectRepository subjectRepository;
    StudentRepository studentRepository;
    ModelRepository modelRepository;
    ExamSessionMapper examSessionMapper;

    @Override
    @Transactional
    public ExamSessionResponse createExamSession(ExamSessionCreationRequest request) {
        Room room;

        // Nếu mode ONLINE -> không cần phòng (room = null)
        if (request.getMode() == ExamMode.ONLINE) {
            room = null;
        } else {
            // OFFLINE -> bắt buộc chọn phòng
            if (request.getRoomId() == null || request.getRoomId().isBlank()) {
                throw new AppException(ErrorCode.ROOM_NOT_EXISTED);
            }
            room = roomRepository.findById(request.getRoomId())
                    .orElseThrow(() -> new AppException(ErrorCode.ROOM_NOT_EXISTED));
        }

        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_EXISTED));

        Model model = null;
        if (request.getModelId() != null && !request.getModelId().isBlank()) {
            model = modelRepository.findById(request.getModelId())
                    .orElseThrow(() -> new AppException(ErrorCode.MODEL_NOT_EXISTED));
        }

        ExamSession examSession = examSessionMapper.toExamSession(request);
        examSession.setRoom(room);
        examSession.setSubject(subject);
        examSession.setModel(model);

        List<ExamSessionDetail> details = new ArrayList<>();
        if (request.getStudentIds() != null && !request.getStudentIds().isEmpty()) {
            int seatCounter = 1;
            for (String studentId : request.getStudentIds()) {
                Student student = studentRepository.findById(studentId)
                        .orElseThrow(() -> new AppException(ErrorCode.STUDENT_NOT_EXISTED));
                
                ExamSessionDetail detail = ExamSessionDetail.builder()
                        .examSession(examSession)
                        .student(student)
                        .status(ExamStatus.SCHEDULED)
                        .seatNumber("S" + String.format("%02d", seatCounter++))
                        .build();
                details.add(detail);
            }
        }
        examSession.setExamSessionDetails(details);

        ExamSession savedSession = examSessionRepository.save(examSession);

        if (savedSession.getMode() == ExamMode.ONLINE) {
            ExamSessionCamera sessionCamera = ExamSessionCamera.builder()
                    .examSession(savedSession)
                    .camera(null)
                    .build();
            examSessionCameraRepository.save(sessionCamera);
        }

        return examSessionMapper.toExamSessionResponse(savedSession);
    }

    @Override
    public List<ExamSessionResponse> getAllExamSessions() {
        return examSessionRepository.findAll().stream()
                .map(examSessionMapper::toExamSessionResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ExamSessionResponse getExamSessionById(String id) {
        ExamSession examSession = examSessionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.EXAM_SESSION_NOT_EXISTED));
        return examSessionMapper.toExamSessionResponse(examSession);
    }

    @Override
    @Transactional
    public ExamSessionResponse updateExamSession(String id, ExamSessionUpdateRequest request) {
        ExamSession examSession = examSessionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.EXAM_SESSION_NOT_EXISTED));

        examSessionMapper.updateExamSession(examSession, request);

        ExamMode currentMode = request.getMode() != null ? request.getMode() : examSession.getMode();
        if (currentMode == ExamMode.ONLINE) {
            examSession.setRoom(null);
        } else if (request.getRoomId() != null) {
            Room room = roomRepository.findById(request.getRoomId())
                    .orElseThrow(() -> new AppException(ErrorCode.ROOM_NOT_EXISTED));
            examSession.setRoom(room);
        }

        if (request.getSubjectId() != null) {
            Subject subject = subjectRepository.findById(request.getSubjectId())
                    .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_EXISTED));
            examSession.setSubject(subject);
        }

        if (request.getModelId() != null) {
            Model model = null;
            if (!request.getModelId().isBlank()) {
                model = modelRepository.findById(request.getModelId())
                        .orElseThrow(() -> new AppException(ErrorCode.MODEL_NOT_EXISTED));
            }
            examSession.setModel(model);
        }

        ExamSession updatedSession = examSessionRepository.save(examSession);
        return examSessionMapper.toExamSessionResponse(updatedSession);
    }

    @Override
    @Transactional
    public void deleteExamSession(String id) {
        ExamSession examSession = examSessionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.EXAM_SESSION_NOT_EXISTED));
        examSessionCameraRepository.deleteByExamSession_Id(id);
        examSessionRepository.delete(examSession);
    }

    @Override
    @Transactional
    public ExamSessionResponse addStudentsToSession(String id, List<String> studentIds) {
        ExamSession examSession = examSessionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.EXAM_SESSION_NOT_EXISTED));

        List<ExamSessionDetail> details = examSession.getExamSessionDetails();
        if (details == null) {
            details = new ArrayList<>();
        }

        int currentSeat = details.size() + 1;
        for (String studentId : studentIds) {
            boolean exists = details.stream()
                    .anyMatch(d -> d.getStudent() != null && d.getStudent().getId().equals(studentId));
            if (!exists) {
                Student student = studentRepository.findById(studentId)
                        .orElseThrow(() -> new AppException(ErrorCode.STUDENT_NOT_EXISTED));

                ExamSessionDetail detail = ExamSessionDetail.builder()
                        .examSession(examSession)
                        .student(student)
                        .status(ExamStatus.SCHEDULED)
                        .seatNumber("S" + String.format("%02d", currentSeat++))
                        .build();
                details.add(detail);
            }
        }

        examSession.setExamSessionDetails(details);
        ExamSession updatedSession = examSessionRepository.save(examSession);
        return examSessionMapper.toExamSessionResponse(updatedSession);
    }
}
