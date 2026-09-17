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
            System.out.println("ℹ️ Database schema migration notice (property_id): " + e.getMessage());
        }

        try {
            // Rename seeker_id column to user_id if seeker_id column exists
            jdbcTemplate.execute("ALTER TABLE reviews RENAME COLUMN seeker_id TO user_id;");
            System.out.println("✅ Successfully updated reviews table: renamed seeker_id column to user_id.");
        } catch (Exception e) {
            System.out.println("ℹ️ Database schema migration notice (user_id rename): " + e.getMessage());
        }

        try {
            // Drop old status check constraint on booking_requests table in PostgreSQL to allow REMOVED status
            jdbcTemplate.execute("ALTER TABLE booking_requests DROP CONSTRAINT IF EXISTS booking_requests_status_check;");
            System.out.println("✅ Successfully dropped booking_requests_status_check constraint for REMOVED status.");
        } catch (Exception e) {
            System.out.println("ℹ️ Database schema migration notice (booking_requests_status_check drop): " + e.getMessage());
        }
    }
}
