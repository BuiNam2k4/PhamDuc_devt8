package com.idai.gian_lan.dto.response;

import com.idai.gian_lan.dto.enums.CameraStatus;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CameraResponse {
    String id;
    String cameraCode;
    String name;
    String ipAddress;
    String location;
    CameraStatus status;
}
