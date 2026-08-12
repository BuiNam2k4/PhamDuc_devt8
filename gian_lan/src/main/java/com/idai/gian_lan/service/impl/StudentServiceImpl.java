package com.idai.gian_lan.service.impl;

import com.idai.gian_lan.dto.enums.Role;
import com.idai.gian_lan.dto.request.StudentCreationRequest;
import com.idai.gian_lan.dto.request.StudentUpdateRequest;
import com.idai.gian_lan.dto.response.StudentResponse;
import com.idai.gian_lan.entity.Student;
import com.idai.gian_lan.exception.AppException;
import com.idai.gian_lan.exception.ErrorCode;
import com.idai.gian_lan.mapper.StudentMapper;
import com.idai.gian_lan.repository.StudentRepository;
import com.idai.gian_lan.repository.UserRepository;
import com.idai.gian_lan.service.StudentService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StudentServiceImpl implements StudentService {

    StudentRepository studentRepository;
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;
    StudentMapper studentMapper;

    @Override
    public StudentResponse createStudent(StudentCreationRequest request) {
        if (studentRepository.existsByStudentCode(request.getStudentCode())) {
            throw new AppException(ErrorCode.STUDENT_EXISTED);
        }

        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        Student student = Student.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER.name())
                .fullName(request.getFullName())
                .email(request.getEmail())
                .studentCode(request.getStudentCode())
                .className(request.getClassName())
                .avatarUrl(request.getAvatarUrl())
                .faceEmbedding(request.getFaceEmbedding())
                .build();

        Student savedStudent = studentRepository.save(student);
        return studentMapper.toStudentResponse(savedStudent);
    }

    @Override
    public List<StudentResponse> getAllStudents() {
        return studentRepository.findAll().stream()
                .map(studentMapper::toStudentResponse)
                .collect(Collectors.toList());
    }

    @Override
    public StudentResponse getStudentById(String id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.STUDENT_NOT_EXISTED));
        return studentMapper.toStudentResponse(student);
    }

    @Override
    public StudentResponse getStudentByCode(String studentCode) {
        Student student = studentRepository.findByStudentCode(studentCode)
                .orElseThrow(() -> new AppException(ErrorCode.STUDENT_NOT_EXISTED));
        return studentMapper.toStudentResponse(student);
    }

    @Override
    public StudentResponse updateStudent(String id, StudentUpdateRequest request) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.STUDENT_NOT_EXISTED));

        studentMapper.updateStudent(student, request);

        Student updatedStudent = studentRepository.save(student);
        return studentMapper.toStudentResponse(updatedStudent);
    }

    @Override
    public void deleteStudent(String id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.STUDENT_NOT_EXISTED));
        studentRepository.delete(student);
    }
}
