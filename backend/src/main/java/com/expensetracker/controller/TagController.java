package com.expensetracker.controller;

import com.expensetracker.dto.response.ApiResponse;
import com.expensetracker.service.AuthService;
import com.expensetracker.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;
    private final AuthService authService;

    @GetMapping
    public ApiResponse<List<String>> getAll(@AuthenticationPrincipal OAuth2User principal) {
        var userId = authService.getUserId(principal);
        return ApiResponse.success(tagService.getAllTags(userId));
    }

    @PutMapping("/rename")
    public ApiResponse<Void> rename(
            @AuthenticationPrincipal OAuth2User principal,
            @RequestBody Map<String, String> body) {
        var userId = authService.getUserId(principal);
        tagService.renameTag(userId, body.get("oldName"), body.get("newName"));
        return ApiResponse.success(null);
    }

    @PutMapping("/merge")
    public ApiResponse<Void> merge(
            @AuthenticationPrincipal OAuth2User principal,
            @RequestBody Map<String, String> body) {
        var userId = authService.getUserId(principal);
        tagService.mergeTags(userId, body.get("sourceTag"), body.get("targetTag"));
        return ApiResponse.success(null);
    }
}
