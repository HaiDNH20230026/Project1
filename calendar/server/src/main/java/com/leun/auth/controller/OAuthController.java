package com.leun.auth.controller;

import com.leun.auth.dto.LoginDto;
import com.leun.auth.dto.LoginDto.Response;
import com.leun.auth.dto.OAuthDto;
import com.leun.auth.service.OAuthService;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
public class OAuthController {

    private final OAuthService OAuthService;

    @PostMapping("/google/login")
    // Receives a request containing the authorization code from the client.
    public ResponseEntity<Response> googleLogin(@RequestBody OAuthDto.GoogleRequest request) throws Exception {
        // Extracts the authorization code from GoogleLoginRequest DTO.
        String authCode = request.getCode();
        if (authCode == null || authCode.isEmpty()) {
            // Returns Bad Request response if code is missing
            return ResponseEntity.badRequest().build(); // or include error message
        }

        // Delegates login processing to the service layer by passing the authorization code.
        // The service method name may be changed.
        LoginDto.Response response = OAuthService.googleLoginWithAuthCode(authCode);
        return ResponseEntity.ok(response);
    }
}
