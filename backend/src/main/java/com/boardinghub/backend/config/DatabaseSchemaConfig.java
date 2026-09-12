package com.boardinghub.backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DatabaseSchemaConfig {

    @Bean
    public CommandLineRunner autoAlterTableSchema(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN avatar_url TYPE TEXT;");
            } catch (Exception e) {
                System.out.println("[DatabaseSchemaConfig] users.avatar_url alter check: " + e.getMessage());
            }

            try {
                jdbcTemplate.execute("ALTER TABLE property_images ALTER COLUMN image_url TYPE TEXT;");
            } catch (Exception e) {
                System.out.println("[DatabaseSchemaConfig] property_images.image_url alter check: " + e.getMessage());
            }

            try {
                jdbcTemplate.execute("ALTER TABLE rooms ALTER COLUMN image_url TYPE TEXT;");
            } catch (Exception e) {
                System.out.println("[DatabaseSchemaConfig] rooms.image_url alter check: " + e.getMessage());
            }
        };
    }
}
