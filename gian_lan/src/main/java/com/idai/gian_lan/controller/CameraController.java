package com.idai.gian_lan.controller;

import com.idai.gian_lan.dto.enums.CameraStatus;
import com.idai.gian_lan.dto.response.ApiResponse;
import com.idai.gian_lan.entity.Camera;
import com.idai.gian_lan.repository.CameraRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cameras")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CameraController {

    CameraRepository cameraRepository;

    @GetMapping
    public ApiResponse<List<Camera>> getAllCameras() {
        return ApiResponse.<List<Camera>>builder()
                .result(cameraRepository.findAll())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<Camera> getCameraById(@PathVariable String id) {
        Camera camera = cameraRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Camera not found"));
        return ApiResponse.<Camera>builder()
                .result(camera)
                .build();
    }

    @PostMapping
    public ApiResponse<Camera> createCamera(@RequestBody Camera camera) {
        if (camera.getStatus() == null) {
            camera.setStatus(CameraStatus.ONLINE);
        }
        return ApiResponse.<Camera>builder()
                .result(cameraRepository.save(camera))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<Camera> updateCamera(@PathVariable String id, @RequestBody Camera updated) {
        Camera camera = cameraRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Camera not found"));
        
        if (updated.getCameraCode() != null) camera.setCameraCode(updated.getCameraCode());
        if (updated.getName() != null) camera.setName(updated.getName());
        if (updated.getIpAddress() != null) camera.setIpAddress(updated.getIpAddress());
        if (updated.getLocation() != null) camera.setLocation(updated.getLocation());
        if (updated.getStatus() != null) camera.setStatus(updated.getStatus());

        return ApiResponse.<Camera>builder()
                .result(cameraRepository.save(camera))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteCamera(@PathVariable String id) {
        cameraRepository.deleteById(id);
        return ApiResponse.<String>builder()
                .result("Camera has been deleted successfully")
                .build();
    }
}
