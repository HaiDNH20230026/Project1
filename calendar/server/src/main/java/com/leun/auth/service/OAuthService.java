package com.leun.auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeTokenRequest;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.leun.auth.config.OAuthConfig;
import com.leun.auth.dto.LoginDto;
import com.leun.auth.security.JwtUtil;
import com.leun.user.dto.UserSettingDto;
import com.leun.user.entity.User;
import com.leun.user.entity.User.ProviderType;
import com.leun.user.entity.User.UserRole;
import com.leun.user.entity.UserProfile;
import com.leun.user.entity.UserSetting;
import com.leun.user.repository.UserProfileRepository;
import com.leun.user.repository.UserRepository;
import com.leun.user.repository.UserSettingRepository;
import jakarta.transaction.Transactional;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.NoSuchElementException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OAuthService {

    private final OAuthConfig oauthConfig;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserSettingRepository userSettingRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public LoginDto.Response googleLogin(String credential) throws Exception {
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
            .setAudience(Collections.singletonList(oauthConfig.getClientId()))
            .build();

        GoogleIdToken idToken = verifier.verify(credential);
        if (idToken == null) {
            throw new IllegalArgumentException("Invalid Google ID token.");
        }

        GoogleIdToken.Payload payload = idToken.getPayload();
        String email = payload.getEmail();
        String name = (String) payload.get("name");
        String imageUrl = (String) payload.get("picture");

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            // First time logging in with Google OAuth, register user
            user = new User(email, passwordEncoder.encode("password"), ProviderType.GOOGLE, UserRole.ROLE_USER);
            userRepository.save(user);

            UserProfile userProfile = new UserProfile(user, name, imageUrl);
            userProfileRepository.save(userProfile);

            UserSetting userSetting = new UserSetting(user, "Vietnamese", "Viet Nam", "GMT +07:00");
            userSettingRepository.save(userSetting);
        } else if (user.getProvider() != ProviderType.GOOGLE) {
            throw new IllegalArgumentException("This email is already registered with a different provider.");
        }

        String token = jwtUtil.generateToken(user.getEmail());
        UserProfile profile = userProfileRepository.findByUser(user)
            .orElseThrow(() -> new NoSuchElementException("User Profile Not Found"));
        UserSetting setting = userSettingRepository.findByUser(user)
            .orElseThrow(() -> new NoSuchElementException("User Setting Not Found"));

        UserSettingDto.Response settingDto =
            new UserSettingDto.Response(setting.getLanguage(), setting.getCountry(), setting.getTimezone());

        return new LoginDto.Response(profile.getName(), profile.getImage(), settingDto, token);
    }

    @Transactional
    public LoginDto.Response googleLoginWithAuthCode(String authCode) throws Exception { // Receives auth code as parameter

        if (authCode == null || authCode.isEmpty()) {
            throw new IllegalArgumentException("Authorization code cannot be null or empty.");
        }

        // 1. Exchange auth code for tokens (ID token, Access token) from Google
        //    This process requires Google API library and Client Secret
        GoogleTokenResponse tokenResponse;
        try {
            // Với popup auth-code flow (@react-oauth/google), redirect_uri PHẢI là "postmessage"
            // Nếu dùng redirect flow thì mới cần URI thật
            String redirectUri = "postmessage";
            
            tokenResponse = new GoogleAuthorizationCodeTokenRequest(
                new NetHttpTransport(), // HTTP transport layer
                new GsonFactory(), // JSON parsing library (using Gson)
                oauthConfig.getClientId(), // Client ID injected from application.yml or GoogleConfig
                oauthConfig.getClientSecret(), // Client Secret injected from application.yml or GoogleConfig (!!Use only on server!!)
                authCode, // Auth code received from client
                redirectUri // "postmessage" for popup flow
            ).execute(); // Send server-to-server request to Google API

        } catch (IOException e) {
            // Handle Google API communication error
            throw new Exception("Failed to exchange auth code for tokens with Google.", e);
        }

        // 2. Extract ID token string from Google response
        String idTokenString = tokenResponse.getIdToken();
        if (idTokenString == null) {
            // If ID token is not included in response (check scope settings)
            throw new Exception("ID token not received from Google token endpoint.");
        }

        // 3. Verify extracted ID token string (reuse existing GoogleIdTokenVerifier)
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
            .setAudience(Collections.singletonList(oauthConfig.getClientId())) // Set Audience with Client ID
            .build();

        GoogleIdToken idToken;
        try {
            idToken = verifier.verify(idTokenString); // Verify ID token string
        } catch (GeneralSecurityException | IOException e) {
            // Handle token verification library error
            throw new Exception("Failed to verify Google ID token.", e);
        }


        if (idToken == null) {
            // Token verification failed (forged, expired, different Audience, etc.)
            throw new IllegalArgumentException("Invalid or expired Google ID token.");
        }

        // 4. Extract user information from payload after successful ID token verification (similar to existing logic)
        GoogleIdToken.Payload payload = idToken.getPayload();
        String email = payload.getEmail();
        String name = (String) payload.get("name");
        String imageUrl = (String) payload.get("picture");
        // Can extract additional information like locale if needed

        // 5. Backend user processing (find existing user or create new) - reuse existing logic
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            // First time logging in with Google OAuth, register user
            user = new User(email, passwordEncoder.encode("password"), ProviderType.GOOGLE, UserRole.ROLE_USER);
            userRepository.save(user);

            UserProfile userProfile = new UserProfile(user, name, imageUrl); // Save image URL
            userProfileRepository.save(userProfile);

            UserSetting userSetting = new UserSetting(user, "Korean", "South Korea", "KST +09:00"); // Default settings
            userSettingRepository.save(userSetting);
        } else if (user.getProvider() != ProviderType.GOOGLE) {
            // Email already registered with a different provider
            throw new IllegalArgumentException("This email is already registered with a different provider.");
        }

        // 6. Generate backend JWT token (reuse existing logic)
        String token = jwtUtil.generateToken(user.getEmail());

        // 7. Retrieve user profile and settings (reuse existing logic)
        UserProfile profile = userProfileRepository.findByUser(user)
            .orElseThrow(() -> new NoSuchElementException("User Profile Not Found"));
        UserSetting setting = userSettingRepository.findByUser(user)
            .orElseThrow(() -> new NoSuchElementException("User Setting Not Found"));

        // 8. Create and return response DTO (reuse existing logic)
        UserSettingDto.Response settingDto =
            new UserSettingDto.Response(setting.getLanguage(), setting.getCountry(), setting.getTimezone());

        // Backend response DTO should include backend-generated JWT and user information
        // LoginDto.Response structure verification needed
        return new LoginDto.Response(profile.getName(), profile.getImage(), settingDto, token); // Example: return name, image, settings, token
    }
}