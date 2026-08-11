package com.idai.gian_lan.mapper;

import com.idai.gian_lan.dto.request.UserRegisterRequest;
import com.idai.gian_lan.dto.response.UserResponse;
import com.idai.gian_lan.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {

    User toUser(UserRegisterRequest request);

    UserResponse toUserResponse(User user);
}
