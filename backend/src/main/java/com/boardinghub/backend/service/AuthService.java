package com.boardinghub.backend.service;

import com.boardinghub.backend.dto.request.ForgotPasswordRequest;
import com.boardinghub.backend.dto.request.LoginRequest;
import com.boardinghub.backend.dto.request.RegisterRequest;
import com.boardinghub.backend.dto.request.ResetPasswordRequest;
import com.boardinghub.backend.dto.response.AuthResponse;
import com.boardinghub.backend.entity.PasswordResetToken;
import com.boardinghub.backend.entity.User;
import com.boardinghub.backend.repository.PasswordResetTokenRepository;
import com.boardinghub.backend.repository.UserRepository;
import com.boardinghub.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email address is already registered: " + request.getEmail());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .whatsappNumber(request.getWhatsappNumber())
                .role(request.getRole())
                .build();

        User savedUser = userRepository.save(user);

        org.springframework.security.core.userdetails.User userDetails = new org.springframework.security.core.userdetails.User(
                savedUser.getEmail(),
                savedUser.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + savedUser.getRole().name()))
        );

        String jwtToken = jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .token(jwtToken)
                .id(savedUser.getId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .whatsappNumber(savedUser.getWhatsappNumber())
                .role(savedUser.getRole())
                .avatarUrl(savedUser.getAvatarUrl())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        org.springframework.security.core.userdetails.User userDetails = new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );

        String jwtToken = jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .token(jwtToken)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .whatsappNumber(user.getWhatsappNumber())
                .role(user.getRole())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail().trim())
                .orElse(null);

        // Security best practice: do not leak whether an email exists or not
        if (user == null) {
            return;
        }

        // Delete any existing token for this user and flush to DB immediately
        passwordResetTokenRepository.findByUser(user).ifPresent(existingToken -> {
            passwordResetTokenRepository.delete(existingToken);
            passwordResetTokenRepository.flush();
        });

        // Generate 32-char UUID reset token valid for 30 minutes
        String tokenStr = UUID.randomUUID().toString().replace("-", "");
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(tokenStr)
                .user(user)
                .expiryDate(LocalDateTime.now().plusMinutes(30))
                .build();

        passwordResetTokenRepository.save(resetToken);

        System.out.println("=================================================");
        System.out.println("[BoardingHub Auth] Password Reset Token Generated");
        System.out.println("User Email: " + user.getEmail());
        System.out.println("Token: " + tokenStr);
        System.out.println("=================================================");

        // Send Email if JavaMailSender is configured
        if (mailSender != null) {
            try {
                SimpleMailMessage mailMessage = new SimpleMailMessage();
                mailMessage.setTo(user.getEmail());
                mailMessage.setSubject("BoardingHub - Password Reset Request");
                mailMessage.setText("Hello " + user.getName() + ",\n\n"
                        + "You requested a password reset for your BoardingHub account.\n"
                        + "Your password reset token is:\n\n"
                        + tokenStr + "\n\n"
                        + "This token will expire in 30 minutes.\n"
                        + "If you did not request a password reset, please ignore this email.\n\n"
                        + "Best regards,\n"
                        + "The BoardingHub Team");
                mailSender.send(mailMessage);
                System.out.println("[BoardingHub Auth] Reset email successfully dispatched to " + user.getEmail());
            } catch (Exception e) {
                System.err.println("[BoardingHub Auth] Could not send email via SMTP (Token logged above): " + e.getMessage());
            }
        }
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired password reset token."));

        if (resetToken.isExpired()) {
            passwordResetTokenRepository.delete(resetToken);
            throw new IllegalArgumentException("Password reset token has expired. Please request a new token.");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Revoke token after successful use
        passwordResetTokenRepository.delete(resetToken);
        System.out.println("[BoardingHub Auth] Password reset successful for user: " + user.getEmail());
    }
}

