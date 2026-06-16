package com.expensetracker.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class StorageService {

    @Value("${app.storage.receipt-path}")
    private String storagePath;

    private Path root;

    @PostConstruct
    public void init() {
        root = Path.of(storagePath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new RuntimeException("Could not create storage path: " + root, e);
        }
    }

    public String store(UUID userId, MultipartFile file) {
        var userDir = root.resolve(userId.toString());
        try {
            Files.createDirectories(userDir);
            var filename = UUID.randomUUID() + getExtension(file.getOriginalFilename());
            var target = userDir.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return userId + "/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    public Path load(String path) {
        return root.resolve(path).normalize();
    }

    public void delete(String path) {
        try {
            Files.deleteIfExists(root.resolve(path));
        } catch (IOException e) {
            // Log but don't fail
        }
    }

    public void deleteByUserId(UUID userId) {
        var userDir = root.resolve(userId.toString());
        try {
            if (Files.exists(userDir)) {
                try (var files = Files.walk(userDir)) {
                    files.sorted(java.util.Comparator.reverseOrder())
                        .forEach(p -> {
                            try { Files.deleteIfExists(p); } catch (IOException ignored) {}
                        });
                }
            }
        } catch (IOException ignored) {}
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf("."));
    }
}
