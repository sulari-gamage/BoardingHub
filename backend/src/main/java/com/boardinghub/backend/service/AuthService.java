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

        // Generate 6-digit numeric OTP valid for 10 minutes
        String otpStr = String.format("%06d", new java.security.SecureRandom().nextInt(1000000));
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(otpStr)
                .user(user)
                .expiryDate(LocalDateTime.now().plusMinutes(10))
                .build();

        passwordResetTokenRepository.save(resetToken);

        System.out.println("=================================================");
        System.out.println("[BoardingHub Auth] Password Reset OTP Generated");
        System.out.println("User Email: " + user.getEmail());
        System.out.println("OTP Code: " + otpStr);
        System.out.println("=================================================");

        // Send Email asynchronously in background thread to avoid blocking HTTP response & timing out fetch requests
        if (mailSender != null) {
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                try {
                    SimpleMailMessage mailMessage = new SimpleMailMessage();
                    mailMessage.setTo(user.getEmail());
                    mailMessage.setSubject("BoardingHub - Password Reset OTP");
                    mailMessage.setText("Hello " + user.getName() + ",\n\n"
                            + "Your One-Time Password (OTP) for resetting your BoardingHub account password is:\n\n"
                            + "    " + otpStr + "\n\n"
                            + "This OTP code is valid for 10 minutes.\n"
                            + "If you did not request a password reset, please ignore this email.\n\n"
                            + "Best regards,\n"
                            + "The BoardingHub Team");
                    mailSender.send(mailMessage);
                    System.out.println("[BoardingHub Auth] OTP email successfully dispatched to " + user.getEmail());
                } catch (Exception e) {
                    System.err.println("[BoardingHub Auth] Could not send OTP email via SMTP (OTP logged above): " + e.getMessage());
                }
            });
        }
    }

    @Transactional(readOnly = true)
    public void verifyOtp(com.boardinghub.backend.dto.request.VerifyOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail().trim())
                .orElseThrow(() -> new IllegalArgumentException("User with this email does not exist."));

        PasswordResetToken resetToken = passwordResetTokenRepository.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException("No OTP request found for this email."));

        if (!resetToken.getToken().equals(request.getOtp().trim())) {
            throw new IllegalArgumentException("Invalid OTP code. Please check your email and try again.");
        }

        if (resetToken.isExpired()) {
            throw new IllegalArgumentException("OTP code has expired. Please request a new OTP.");
        }
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken().trim())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired OTP code."));

        if (resetToken.isExpired()) {
            passwordResetTokenRepository.delete(resetToken);
            throw new IllegalArgumentException("OTP code has expired. Please request a new OTP.");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Revoke token after successful use
        passwordResetTokenRepository.delete(resetToken);
        System.out.println("[BoardingHub Auth] Password reset successful for user: " + user.getEmail());

        // Send confirmation email asynchronously
        if (mailSender != null) {
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                try {
                    SimpleMailMessage mailMessage = new SimpleMailMessage();
                    mailMessage.setTo(user.getEmail());
                    mailMessage.setSubject("BoardingHub - Password Successfully Reset");
                    mailMessage.setText("Hello " + user.getName() + ",\n\n"
                            + "Your BoardingHub account password has been successfully updated.\n\n"
                            + "If you did not perform this change, please contact support immediately.\n\n"
                            + "Best regards,\n"
                            + "The BoardingHub Team");
                    mailSender.send(mailMessage);
                    System.out.println("[BoardingHub Auth] Reset confirmation email sent to " + user.getEmail());
                } catch (Exception e) {
                    System.err.println("[BoardingHub Auth] Failed to send reset confirmation email: " + e.getMessage());
                }
            });
        }
    }
}

