package com.idai.gian_lan.service;

import com.idai.gian_lan.dto.request.UserCreationRequest;
import com.idai.gian_lan.dto.response.UserResponse;

public interface UserService {
    UserResponse createUser(UserCreationRequest request);
    UserResponse getMyInfo();
}
