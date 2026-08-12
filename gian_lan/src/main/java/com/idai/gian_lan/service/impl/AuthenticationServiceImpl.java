package com.idai.gian_lan.service.impl;

import com.idai.gian_lan.dto.enums.Role;
import com.idai.gian_lan.dto.request.AuthenticationRequest;
import com.idai.gian_lan.dto.request.IntrospectRequest;
import com.idai.gian_lan.dto.request.UserRegisterRequest;
import com.idai.gian_lan.dto.response.AuthenticationResponse;
import com.idai.gian_lan.dto.response.IntrospectResponse;
import com.idai.gian_lan.dto.response.UserResponse;
import com.idai.gian_lan.entity.Student;
import com.idai.gian_lan.entity.User;
import com.idai.gian_lan.exception.AppException;
import com.idai.gian_lan.exception.ErrorCode;
import com.idai.gian_lan.mapper.UserMapper;
import com.idai.gian_lan.repository.StudentRepository;
import com.idai.gian_lan.repository.UserRepository;
import com.idai.gian_lan.service.AuthenticationService;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AuthenticationServiceImpl implements AuthenticationService {

    final UserRepository userRepository;
    final StudentRepository studentRepository;
    final PasswordEncoder passwordEncoder;
    final UserMapper userMapper;

    @Value("${jwt.signerKey:1234567890123456789012345678901234567890123456789012345678901234}")
    String SIGNER_KEY;

    @Override
    public UserResponse register(UserRegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        Student student = Student.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER.name())
                .fullName(request.getFullName())
                .email(request.getEmail())
                .studentCode(request.getStudentCode() != null && !request.getStudentCode().isBlank() 
                        ? request.getStudentCode() 
                        : "SV" + System.currentTimeMillis() % 100000)
                .className(request.getClassName())
                .build();

        Student savedStudent = studentRepository.save(student);
        UserResponse response = userMapper.toUserResponse(savedStudent);
        response.setStudentCode(savedStudent.getStudentCode());
        response.setClassName(savedStudent.getClassName());
        return response;
    }

    @Override
    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());

        if (!authenticated) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        String token = generateToken(user);

        return AuthenticationResponse.builder()
                .token(token)
                .authenticated(true)
                .build();
    }

    @Override
    public IntrospectResponse introspect(IntrospectRequest request) {
        String token = request.getToken();
        boolean isValid = true;

        try {
            verifyToken(token);
        } catch (AppException | JOSEException | ParseException e) {
            isValid = false;
        }

        return IntrospectResponse.builder()
                .valid(isValid)
                .build();
    }

    private SignedJWT verifyToken(String token) throws JOSEException, ParseException {
        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());
        SignedJWT signedJWT = SignedJWT.parse(token);

        Date expirationTime = signedJWT.getJWTClaimsSet().getExpirationTime();
        boolean verified = signedJWT.verify(verifier);

        if (!(verified && expirationTime.after(new Date()))) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        return signedJWT;
    }

    private String generateToken(User user) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(user.getUsername())
                .issuer("gian_lan")
                .issueTime(new Date())
                .expirationTime(new Date(
                        Instant.now().plus(24, ChronoUnit.HOURS).toEpochMilli()
                ))
                .jwtID(UUID.randomUUID().toString())
                .claim("scope", buildScope(user))
                .claim("userId", user.getId())
                .build();

        Payload payload = new Payload(jwtClaimsSet.toJSONObject());
        JWSObject jwsObject = new JWSObject(header, payload);

        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            log.error("Cannot create token", e);
            throw new RuntimeException(e);
        }
    }

    private String buildScope(User user) {
        if (user.getRole() != null) {
            if (user.getRole().startsWith("ROLE_")) {
                return user.getRole();
            }
            return "ROLE_" + user.getRole();
        }
        return "ROLE_" + Role.USER.name();
    }
}
