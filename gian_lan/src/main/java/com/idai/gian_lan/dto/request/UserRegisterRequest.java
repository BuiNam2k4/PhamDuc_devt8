package com.idai.gian_lan.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserRegisterRequest {

    @NotBlank
    @Size(min = 3, message = "USERNAME_INVALID")
    String username;

    @NotBlank
    @Size(min = 8, message = "INVALID_PASSWORD")
    String password;

    String role;
}
