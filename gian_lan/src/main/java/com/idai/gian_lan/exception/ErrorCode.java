package com.idai.gian_lan.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Uncategorized error", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "User existed", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1003, "Username must be at least 3 characters", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1004, "Password must be at least 8 characters", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1005, "User not existed", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1006, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "You do not have permission", HttpStatus.FORBIDDEN),
    MODEL_NOT_EXISTED(1008, "Model not existed", HttpStatus.NOT_FOUND),
    STUDENT_NOT_EXISTED(1009, "Student not existed", HttpStatus.NOT_FOUND),
    STUDENT_EXISTED(1010, "Student code already existed", HttpStatus.BAD_REQUEST),
    ROOM_NOT_EXISTED(1011, "Room not existed", HttpStatus.NOT_FOUND),
    ROOM_EXISTED(1012, "Room code already existed", HttpStatus.BAD_REQUEST),
    SUBJECT_NOT_EXISTED(1013, "Subject not existed", HttpStatus.NOT_FOUND),
    SUBJECT_EXISTED(1014, "Subject code already existed", HttpStatus.BAD_REQUEST);

    private final int code;
    private final String message;
    private final HttpStatusCode httpStatusCode;

    ErrorCode(int code, String message, HttpStatusCode httpStatusCode) {
        this.code = code;
        this.message = message;
        this.httpStatusCode = httpStatusCode;
    }

}
