package com.boardinghub.backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseMigrationConfig implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseMigrationConfig(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        try {
            // Drop NOT NULL constraint from property_id in PostgreSQL reviews table
            jdbcTemplate.execute("ALTER TABLE reviews ALTER COLUMN property_id DROP NOT NULL;");
            System.out.println("✅ Successfully updated reviews table: property_id column is now NULLABLE.");
        } catch (Exception e) {
            System.out.println("ℹ️ Database schema migration notice: " + e.getMessage());
        }
    }
}
