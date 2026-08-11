package com.idai.gian_lan.service;

import com.idai.gian_lan.dto.request.AuthenticationRequest;
import com.idai.gian_lan.dto.request.IntrospectRequest;
import com.idai.gian_lan.dto.request.UserRegisterRequest;
import com.idai.gian_lan.dto.response.AuthenticationResponse;
import com.idai.gian_lan.dto.response.IntrospectResponse;
import com.idai.gian_lan.dto.response.UserResponse;

public interface AuthenticationService {
    UserResponse register(UserRegisterRequest request);
    AuthenticationResponse authenticate(AuthenticationRequest request);
    IntrospectResponse introspect(IntrospectRequest request);
}
