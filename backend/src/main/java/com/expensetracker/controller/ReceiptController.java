package com.expensetracker.controller;

import com.expensetracker.dto.response.ApiResponse;
import com.expensetracker.service.AuthService;
import com.expensetracker.service.OcrService;
import com.expensetracker.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/receipts")
@RequiredArgsConstructor
public class ReceiptController {

    private final OcrService ocrService;
    private final StorageService storageService;
    private final AuthService authService;

    @PostMapping("/upload")
    public ApiResponse<OcrService.OcrResult> upload(
            @AuthenticationPrincipal OAuth2User principal,
            @RequestParam("file") MultipartFile file) {
        var userId = authService.getUserId(principal);
        var result = ocrService.process(userId, file);
        return ApiResponse.success(result);
    }

    @GetMapping("/image")
    public ResponseEntity<Resource> getImage(@RequestParam String path) {
        try {
            var filePath = storageService.load(path);
            var resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_JPEG)
                    .body(resource);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
