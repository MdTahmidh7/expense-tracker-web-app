package com.expensetracker.service;

import com.expensetracker.dto.response.UserProfileDTO;
import com.expensetracker.entity.User;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;

    @Transactional
    public User getOrCreateUser(OAuth2User oAuth2User) {
        String googleSub = oAuth2User.getAttribute("sub");
        return userRepository.findByGoogleSub(googleSub)
            .orElseGet(() -> createUser(oAuth2User));
    }

    public UUID getUserId(OAuth2User principal) {
        String googleSub = principal.getAttribute("sub");
        return userRepository.findByGoogleSub(googleSub)
            .orElseThrow(() -> new ResourceNotFoundException("User", "googleSub", googleSub))
            .getId();
    }

    public UserProfileDTO getProfile(OAuth2User principal) {
        String googleSub = principal.getAttribute("sub");
        User user = userRepository.findByGoogleSub(googleSub)
            .orElseThrow(() -> new ResourceNotFoundException("User", "googleSub", googleSub));
        return UserProfileDTO.from(user);
    }

    private User createUser(OAuth2User oAuth2User) {
        User user = User.builder()
            .googleSub(oAuth2User.getAttribute("sub"))
            .email(oAuth2User.getAttribute("email"))
            .displayName(oAuth2User.getAttribute("name"))
            .build();
        return userRepository.save(user);
    }
}
