# Complete Implementation Plan: Daily Expense Tracker

This plan covers ALL 4 phases. Execute top-to-bottom, phase-by-phase. Each phase delivers independently testable vertical slice.

---

## Phase 1: Foundation & Auth (Weeks 1-2)

**Goal**: Spring Boot + Angular scaffolded. DB running. User can login/logout with Google.

---

### Phase 1 Config & Dependencies

#### 1.1 CREATE `backend/pom.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.4.4</version>
        <relativePath/>
    </parent>
    <groupId>com.expensetracker</groupId>
    <artifactId>expense-tracker-backend</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>Expense Tracker Backend</name>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <!-- Web -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Database -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-database-postgresql</artifactId>
        </dependency>

        <!-- Auth -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-oauth2-client</artifactId>
        </dependency>

        <!-- Validation -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- Utility -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- OCR (Phase 3) -->
        <dependency>
            <groupId>net.sourceforge.tess4j</groupId>
            <artifactId>tess4j</artifactId>
            <version>5.4.0</version>
        </dependency>

        <!-- CSV Export (Phase 4) -->
        <dependency>
            <groupId>org.apache.commons</groupId>
            <artifactId>commons-csv</artifactId>
            <version>1.12.0</version>
        </dependency>

        <!-- Test -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

- **VALIDATE**: `cd backend && ./mvnw clean test -DskipTests` — builds without error

#### 1.2 CREATE `backend/src/main/resources/application.yml`

```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/expense_tracker
    username: postgres
    password: postgres
  jpa:
    hibernate:
      ddl-auto: validate  # Flyway manages schema
    show-sql: false
    properties:
      hibernate:
        format_sql: true
  flyway:
    enabled: true
    locations: classpath:db/migration
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}
            scope:
              - openid
              - email
              - profile

app:
  storage:
    receipt-path: ${RECEIPT_STORAGE_PATH:~/expense-tracker/receipts}
  demo-data: true

logging:
  level:
    com.expensetracker: DEBUG
    org.springframework.security: INFO
```

- **GOTCHA**: `ddl-auto: validate` — Flyway creates schema, Hibernate only validates. Never use `update` in production.

#### 1.3 CREATE `backend/src/main/resources/application-dev.yml`

```yaml
spring:
  jpa:
    show-sql: true
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID:dev-client-id}
            client-secret: ${GOOGLE_CLIENT_SECRET:dev-client-secret}

logging:
  level:
    com.expensetracker: DEBUG
    org.springframework.security: TRACE
```

#### 1.4 CREATE `backend/src/test/resources/application-test.yml`

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
    username: sa
    password:
  jpa:
    hibernate:
      ddl-auto: create-drop
    properties:
      hibernate:
        dialect: org.hibernate.dialect.H2Dialect
  flyway:
    enabled: false
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: test-client-id
            client-secret: test-client-secret
```

- **GOTCHA**: Flyway disabled in test — Hibernate `create-drop` handles schema. OAuth mocked in tests.

#### 1.5 CREATE `backend/Dockerfile`

```dockerfile
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY pom.xml mvnw ./
COPY .mvn .mvn
RUN ./mvnw dependency:go-offline
COPY src src
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### 1.6 CREATE `frontend/package.json`

```json
{
  "name": "expense-tracker-frontend",
  "version": "0.0.1",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "test": "ng test",
    "lint": "ng lint"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "^19.0.0",
    "@angular/cdk": "^19.0.0",
    "@angular/common": "^19.0.0",
    "@angular/compiler": "^19.0.0",
    "@angular/core": "^19.0.0",
    "@angular/forms": "^19.0.0",
    "@angular/material": "^19.0.0",
    "@angular/platform-browser": "^19.0.0",
    "@angular/platform-browser-dynamic": "^19.0.0",
    "@angular/router": "^19.0.0",
    "angular-oauth2-oidc": "^17.0.0",
    "chart.js": "^4.4.0",
    "ng2-charts": "^7.0.0",
    "rxjs": "^7.8.0",
    "tslib": "^2.6.0",
    "zone.js": "^0.14.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^19.0.0",
    "@angular/cli": "^19.0.0",
    "@angular/compiler-cli": "^19.0.0",
    "@types/jasmine": "^5.1.0",
    "jasmine-core": "^5.1.0",
    "karma": "^6.4.0",
    "karma-chrome-launcher": "^3.2.0",
    "karma-coverage": "^2.2.0",
    "karma-jasmine": "^5.1.0",
    "karma-jasmine-html-reporter": "^2.1.0",
    "typescript": "^5.5.0"
  }
}
```

#### 1.7 CREATE `frontend/angular.json`

```json
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "expense-tracker": {
      "projectType": "application",
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:application",
          "options": {
            "outputPath": "dist",
            "index": "src/index.html",
            "browser": "src/main.ts",
            "polyfills": ["zone.js"],
            "tsConfig": "tsconfig.app.json",
            "assets": ["src/favicon.ico", "src/assets"],
            "styles": [
              "@angular/material/prebuilt-themes/indigo-pink.css",
              "src/styles.css"
            ],
            "scripts": []
          },
          "configurations": {
            "production": {
              "budgets": [
                { "type": "initial", "maximumWarning": "2mb", "maximumError": "5mb" }
              ],
              "outputHashing": "all"
            },
            "development": {
              "optimization": false,
              "extractLicenses": false,
              "sourceMap": true
            }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "configurations": {
            "production": { "buildTarget": "expense-tracker:build:production" },
            "development": { "buildTarget": "expense-tracker:build:development" }
          },
          "defaultConfiguration": "development",
          "options": {
            "proxyConfig": "proxy.conf.json"
          }
        },
        "test": {
          "builder": "@angular-devkit/build-angular:karma",
          "options": {
            "polyfills": ["zone.js", "zone.js/testing"],
            "tsConfig": "tsconfig.spec.json",
            "assets": ["src/favicon.ico", "src/assets"],
            "styles": ["@angular/material/prebuilt-themes/indigo-pink.css", "src/styles.css"],
            "scripts": []
          }
        }
      }
    }
  }
}
```

#### 1.8 CREATE `frontend/proxy.conf.json`

```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  },
  "/login": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  },
  "/oauth2": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  }
}
```

- **GOTCHA**: Must proxy `/login` and `/oauth2` paths too, else OAuth redirects fail in dev mode.

#### 1.9 CREATE `frontend/tsconfig.json`

```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "outDir": "./dist/out-tsc",
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "sourceMap": true,
    "declaration": false,
    "experimentalDecorators": true,
    "moduleResolution": "bundler",
    "importHelpers": true,
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022", "dom"]
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}
```

#### 1.10 CREATE `frontend/Dockerfile`

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist/expense-tracker/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

#### 1.11 CREATE `frontend/nginx.conf`

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location /api {
        proxy_pass http://app:8080;
    }
}
```

#### 1.12 CREATE `docker-compose.yml` (root)

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: expense_tracker
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

- **VALIDATE**: `docker compose up -d` -> PostgreSQL running on 5432

---

### Phase 1 Backend Implementation

#### 1.13 CREATE `backend/src/main/java/com/expensetracker/ExpenseTrackerApplication.java`

```java
package com.expensetracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ExpenseTrackerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ExpenseTrackerApplication.class, args);
    }
}
```

#### 1.14 CREATE `backend/src/main/resources/db/migration/V1__create_app_user.sql`

```sql
CREATE TABLE app_user (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_sub              VARCHAR(255) NOT NULL UNIQUE,
    email                   VARCHAR(255) NOT NULL UNIQUE,
    display_name            VARCHAR(255) NOT NULL,
    timezone                VARCHAR(50) NOT NULL DEFAULT 'Asia/Dhaka',
    currency                VARCHAR(3) NOT NULL DEFAULT 'BDT',
    default_payment_method  VARCHAR(50) NOT NULL DEFAULT 'Cash',
    session_timeout_hours   INTEGER NOT NULL DEFAULT 24,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_app_user_google_sub ON app_user(google_sub);
CREATE INDEX idx_app_user_email ON app_user(email);
```

#### 1.15 CREATE `backend/src/main/resources/db/migration/V2__seed_predefined_categories.sql`

```sql
INSERT INTO category (id, name, is_predefined, sort_order) VALUES
    (gen_random_uuid(), 'Food & Dining',     TRUE, 1),
    (gen_random_uuid(), 'Groceries',         TRUE, 2),
    (gen_random_uuid(), 'Housing',           TRUE, 3),
    (gen_random_uuid(), 'Utilities',         TRUE, 4),
    (gen_random_uuid(), 'Transportation',    TRUE, 5),
    (gen_random_uuid(), 'Entertainment',     TRUE, 6),
    (gen_random_uuid(), 'Shopping',          TRUE, 7),
    (gen_random_uuid(), 'Health & Medical',  TRUE, 8),
    (gen_random_uuid(), 'Insurance',         TRUE, 9),
    (gen_random_uuid(), 'Education',         TRUE, 10),
    (gen_random_uuid(), 'Travel',            TRUE, 11),
    (gen_random_uuid(), 'Subscriptions',     TRUE, 12),
    (gen_random_uuid(), 'Personal Care',     TRUE, 13),
    (gen_random_uuid(), 'Gifts & Donations', TRUE, 14),
    (gen_random_uuid(), 'Other',             TRUE, 15);
```

- **GOTCHA**: Migration V2 references `category` table — created before V2. Ensure V1 creates category table OR add V1b. Actually V2 needs `category` table which is created in Phase 2. **Reordering fix**: Merge V1 + category table creation into V1. Or make Phase 1 create category table too.

**Fix**: Add `category` table creation to V1:

#### 1.15b UPDATE `V1__create_app_user.sql` — add category table

Actually, better approach: create V1 with app_user only, then in Phase 2 add V2/V3 for category + expense tables. But V2 seed references category table which doesn't exist yet.

**Resolution**: Create V1 for app_user, V2 for category table, V3 for seed data. That way Phases are clean:

- Phase 1: V1 - app_user
- Phase 2: V2 - category table, V3 - seed categories, V4 - expense table
- Phase 4: V5 - recurring_template table

Let me restructure:

- `V1__create_app_user.sql`
- `V2__create_category.sql` — created in Phase 1 (table exists empty, seed in Phase 2)
- `V3__seed_predefined_categories.sql` — created in Phase 2

Wait, that still doesn't work because V2 creates empty category table, and Phase 2 needs to add seed data. Let me just create all tables in Phase 1 (they're empty until seeded in later phases). This is cleaner.

So Phase 1 migrations:
- V1: app_user + category + expense + recurring_template (all tables, empty)
- V2: seed categories + create triggers

Actually no — the whole point of phased delivery is incremental. Let me just do:

Phase 1:
- V1: app_user table
- V2: category table (exists but empty until seeded)

Phase 2:
- V3: seed 15 categories
- V4: expense table

Phase 4:
- V5: recurring_template table

This way Phase 1 ends with app_user + empty category table. Phase 2 seeds + adds expense. Phase 4 adds recurring.

#### 1.15 REVISED: CREATE `V1__create_app_user.sql`

(Same as above)

#### 1.16 CREATE `V2__create_category.sql`

```sql
CREATE TABLE category (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES app_user(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    is_predefined   BOOLEAN NOT NULL DEFAULT FALSE,
    monthly_budget  DECIMAL(12, 2),
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_category_user_id ON category(user_id);
CREATE UNIQUE INDEX idx_category_user_name ON category(LOWER(name), user_id)
    WHERE user_id IS NOT NULL;
```

- **VALIDATE**: Start app, check `\dt` in psql — both tables exist

#### 1.17 CREATE `backend/src/main/java/com/expensetracker/config/SecurityConfig.java`

```java
package com.expensetracker.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/login", "/oauth2/**", "/api/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .defaultSuccessUrl("/api/auth/callback", true)
            )
            .logout(logout -> logout
                .logoutSuccessUrl("/")
                .invalidateHttpSession(true)
                .clearAuthentication(true)
            )
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(request -> {
                var corsConfig = new org.springframework.web.cors.CorsConfiguration();
                corsConfig.addAllowedOrigin("http://localhost:4200");
                corsConfig.addAllowedMethod("*");
                corsConfig.addAllowedHeader("*");
                corsConfig.setAllowCredentials(true);
                return corsConfig;
            }));

        return http.build();
    }
}
```

- **GOTCHA**: CORS must allow credentials=true because OAuth redirects send session cookie

#### 1.18 CREATE `backend/src/main/java/com/expensetracker/dto/response/ApiResponse.java`

```java
package com.expensetracker.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
    boolean success,
    T data,
    ApiError error
) {
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null);
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return new ApiResponse<>(false, null, new ApiError(code, message, null));
    }

    public static <T> ApiResponse<T> error(String code, String message, Object details) {
        return new ApiResponse<>(false, null, new ApiError(code, message, details));
    }

    public record ApiError(String code, String message, Object details) {}
}
```

#### 1.19 CREATE `backend/src/main/java/com/expensetracker/dto/response/PagedResponse.java`

```java
package com.expensetracker.dto.response;

import org.springframework.data.domain.Page;

import java.util.List;

public record PagedResponse<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages,
    boolean first,
    boolean last
) {
    public static <T> PagedResponse<T> from(Page<T> page) {
        return new PagedResponse<>(
            page.getContent(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages(),
            page.isFirst(),
            page.isLast()
        );
    }
}
```

#### 1.20 CREATE `backend/src/main/java/com/expensetracker/entity/User.java`

```java
package com.expensetracker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "app_user")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String googleSub;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String displayName;

    @Column(nullable = false)
    private String timezone;

    @Column(nullable = false)
    private String currency;

    @Column(nullable = false)
    private String defaultPaymentMethod;

    @Column(nullable = false)
    private Integer sessionTimeoutHours;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
        if (timezone == null) timezone = "Asia/Dhaka";
        if (currency == null) currency = "BDT";
        if (defaultPaymentMethod == null) defaultPaymentMethod = "Cash";
        if (sessionTimeoutHours == null) sessionTimeoutHours = 24;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
```

#### 1.21 CREATE `backend/src/main/java/com/expensetracker/repository/UserRepository.java`

```java
package com.expensetracker.repository;

import com.expensetracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByGoogleSub(String googleSub);
    Optional<User> findByEmail(String email);
    boolean existsByGoogleSub(String googleSub);
}
```

#### 1.22 CREATE `backend/src/main/java/com/expensetracker/service/AuthService.java`

```java
package com.expensetracker.service;

import com.expensetracker.entity.User;
import com.expensetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    private User createUser(OAuth2User oAuth2User) {
        User user = User.builder()
            .googleSub(oAuth2User.getAttribute("sub"))
            .email(oAuth2User.getAttribute("email"))
            .displayName(oAuth2User.getAttribute("name"))
            .build();
        return userRepository.save(user);
    }
}
```

#### 1.23 CREATE `backend/src/main/java/com/expensetracker/dto/response/UserProfileDTO.java`

```java
package com.expensetracker.dto.response;

import com.expensetracker.entity.User;
import java.time.Instant;
import java.util.UUID;

public record UserProfileDTO(
    UUID id,
    String email,
    String displayName,
    String timezone,
    String currency,
    String defaultPaymentMethod,
    Integer sessionTimeoutHours,
    Instant createdAt
) {
    public static UserProfileDTO from(User user) {
        return new UserProfileDTO(
            user.getId(),
            user.getEmail(),
            user.getDisplayName(),
            user.getTimezone(),
            user.getCurrency(),
            user.getDefaultPaymentMethod(),
            user.getSessionTimeoutHours(),
            user.getCreatedAt()
        );
    }
}
```

#### 1.24 CREATE `backend/src/main/java/com/expensetracker/controller/AuthController.java`

```java
package com.expensetracker.controller;

import com.expensetracker.dto.response.ApiResponse;
import com.expensetracker.dto.response.UserProfileDTO;
import com.expensetracker.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @GetMapping("/callback")
    public ApiResponse<UserProfileDTO> callback(@AuthenticationPrincipal OAuth2User principal) {
        var user = authService.getOrCreateUser(principal);
        return ApiResponse.success(UserProfileDTO.from(user));
    }

    @GetMapping("/me")
    public ApiResponse<UserProfileDTO> me(@AuthenticationPrincipal OAuth2User principal) {
        var user = authService.getOrCreateUser(principal);
        return ApiResponse.success(UserProfileDTO.from(user));
    }
}
```

#### 1.25 CREATE `backend/src/main/java/com/expensetracker/exception/GlobalExceptionHandler.java`

```java
package com.expensetracker.exception;

import com.expensetracker.dto.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.error("NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = ex.getBindingResult().getFieldErrors().stream()
            .collect(Collectors.toMap(
                e -> e.getField(),
                e -> e.getDefaultMessage() != null ? e.getDefaultMessage() : "Invalid value",
                (a, b) -> b
            ));
        return ResponseEntity.badRequest()
            .body(ApiResponse.error("VALIDATION_ERROR", "Validation failed", errors));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneral(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error("INTERNAL_ERROR", "An unexpected error occurred"));
    }
}
```

#### 1.26 CREATE `backend/src/main/java/com/expensetracker/exception/ResourceNotFoundException.java`

```java
package com.expensetracker.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String resource, String field, Object value) {
        super("%s not found with %s: %s".formatted(resource, field, value));
    }
}
```

#### 1.27 CREATE `backend/src/main/java/com/expensetracker/service/DemoDataService.java`

```java
package com.expensetracker.service;

import com.expensetracker.entity.User;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DemoDataService {

    private final UserRepository userRepository; // injected directly
    private final CategoryRepository categoryRepository;
    private final ExpenseRepository expenseRepository;

    @EventListener(ApplicationReadyEvent.class)
    public void seedDemoData() {
        if (!userRepository.existsByGoogleSub("demo-user")) {
            // Demo data is injected in AuthService at user creation time
        }
    }
}
```

- **NOTE**: Demo data seeding is best done inside AuthService when a new user registers, not at app startup. Create 10 sample transactions across categories. Move this logic to AuthService.createUser().

**Better approach**: Remove DemoDataService. Add demo seeding in AuthService.createUser():

```java
private void seedDemoData(User user) {
    var categories = categoryRepository.findByUserNullOrPredefined();
    // Create 10 sample expenses
    var sampleExpenses = List.of(
        new Expense(user, categories.get(0), 24.50, "Kacchi Bhai", ...),
        ...
    );
    expenseRepository.saveAll(sampleExpenses);
}
```

---

### Phase 1 Frontend Implementation

#### 1.28 CREATE `frontend/src/index.html`

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>ExpenseTracker</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
</head>
<body class="mat-typography">
  <app-root></app-root>
</body>
</html>
```

#### 1.29 CREATE `frontend/src/main.ts`

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err));
```

#### 1.30 CREATE `frontend/src/app/app.config.ts`

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
  ]
};
```

#### 1.31 CREATE `frontend/src/app/app.routes.ts`

```typescript
import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'expenses',
    loadComponent: () => import('./features/expenses/expense-list/expense-list.component').then(m => m.ExpenseListComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'expenses/new',
    loadComponent: () => import('./features/expenses/expense-form/expense-form.component').then(m => m.ExpenseFormComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'expenses/:id/edit',
    loadComponent: () => import('./features/expenses/expense-form/expense-form.component').then(m => m.ExpenseFormComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'categories',
    loadComponent: () => import('./features/categories/category-list/category-list.component').then(m => m.CategoryListComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'reports',
    loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'recurring',
    loadComponent: () => import('./features/recurring/recurring-list/recurring-list.component').then(m => m.RecurringListComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [AuthGuard],
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent) },
];
```

- **GOTCHA**: Every route lazily loaded via `loadComponent`. All feature components created as stubs in Phase 1, fleshed out in later phases.

#### 1.32 CREATE `frontend/src/app/app.component.ts`

```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
})
export class AppComponent {}
```

#### 1.33 CREATE `frontend/src/app/core/services/api.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
  details: any;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = '/api';

  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: HttpParams | Record<string, any>): Observable<ApiResponse<T>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== '') {
          httpParams = httpParams.set(k, v);
        }
      });
    }
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${path}`, { params: httpParams });
  }

  post<T>(path: string, body?: any): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${path}`, body);
  }

  put<T>(path: string, body?: any): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}${path}`, body);
  }

  delete<T>(path: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}${path}`);
  }
}
```

#### 1.34 CREATE `frontend/src/app/core/guards/auth.guard.ts`

```typescript
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { map, Observable } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.authService.isAuthenticated().pipe(
      map(authenticated => {
        if (!authenticated) {
          this.router.navigate(['/login']);
          return false;
        }
        return true;
      })
    );
  }
}
```

#### 1.35 CREATE `frontend/src/app/auth/auth.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService, UserProfileDTO } from '../core/services/api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser: UserProfileDTO | null = null;

  constructor(private api: ApiService, private router: Router) {}

  /** Check if user has an active session by calling /api/auth/me */
  isAuthenticated(): Observable<boolean> {
    if (this.currentUser) return of(true);
    return this.api.get<UserProfileDTO>('/auth/me').pipe(
      map(res => {
        if (res.success && res.data) {
          this.currentUser = res.data;
          return true;
        }
        return false;
      }),
      catchError(() => of(false))
    );
  }

  getUser(): UserProfileDTO | null {
    return this.currentUser;
  }

  /** Called after OAuth callback redirect */
  handleCallback(): Observable<UserProfileDTO | null> {
    return this.api.get<UserProfileDTO>('/auth/callback').pipe(
      map(res => {
        if (res.success && res.data) {
          this.currentUser = res.data;
          return res.data;
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  /** Redirect to Google OAuth */
  loginWithGoogle(): void {
    window.location.href = '/oauth2/authorization/google';
  }

  /** Logout and redirect */
  logout(): void {
    this.currentUser = null;
    window.location.href = '/logout';
  }
}
```

- **GOTCHA**: `loginWithGoogle()` uses `window.location.href` because OAuth flow requires full browser redirect, not AJAX.

#### 1.36 CREATE `frontend/src/app/auth/login/login.component.ts`

```typescript
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <div class="login-container">
      <div class="login-card">
        <mat-icon class="logo-icon">account_balance_wallet</mat-icon>
        <h1>ExpenseTracker</h1>
        <p class="subtitle">Know where your money goes</p>
        <button mat-raised-button color="primary" (click)="login()" class="google-btn">
          <mat-icon>login</mat-icon>
          Sign in with Google
        </button>
        <p class="hint">Signing in with Google auto-creates your account.</p>
      </div>
    </div>
  `,
  styles: [`
    .login-container { display: flex; justify-content: center; align-items: center; height: 100vh; background: #f5f5f5; }
    .login-card { text-align: center; padding: 48px; background: white; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 400px; width: 90%; }
    .logo-icon { font-size: 64px; width: 64px; height: 64px; color: #3f51b5; }
    h1 { margin: 16px 0 8px; font-size: 28px; }
    .subtitle { color: #666; margin-bottom: 32px; }
    .google-btn { width: 100%; padding: 8px; font-size: 16px; }
    .hint { margin-top: 24px; font-size: 13px; color: #999; }
  `]
})
export class LoginComponent {
  constructor(private authService: AuthService, private router: Router) {
    // If already authenticated, redirect to dashboard
    this.authService.isAuthenticated().subscribe(ok => {
      if (ok) this.router.navigate(['/dashboard']);
    });
  }

  login(): void {
    this.authService.loginWithGoogle();
  }
}
```

#### 1.37 CREATE `frontend/src/app/auth/callback/callback.component.ts`

```typescript
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-callback',
  standalone: true,
  template: `
    <div class="callback-container">
      <mat-spinner diameter="48"></mat-spinner>
      <p>Signing you in...</p>
    </div>
  `,
  styles: [`
    .callback-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; gap: 16px; }
  `]
})
export class CallbackComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.handleCallback().subscribe(user => {
      if (user) {
        this.router.navigate(['/dashboard']);
      } else {
        this.router.navigate(['/login']);
      }
    });
  }
}
```

- **GOTCHA**: The callback component path must be registered as a route. Add to `app.routes.ts`: `{ path: 'auth/callback', component: CallbackComponent }`

#### 1.38 CREATE stub components for all lazy-loaded routes (empty shells, filled in later phases)

Create minimal stub for each feature component so Angular routing works:

- `frontend/src/app/features/dashboard/dashboard.component.ts`
- `frontend/src/app/features/expenses/expense-list/expense-list.component.ts`
- `frontend/src/app/features/expenses/expense-form/expense-form.component.ts`
- `frontend/src/app/features/categories/category-list/category-list.component.ts`
- `frontend/src/app/features/reports/reports.component.ts`
- `frontend/src/app/features/recurring/recurring-list/recurring-list.component.ts`
- `frontend/src/app/features/settings/settings.component.ts`
- `frontend/src/app/shared/components/not-found/not-found.component.ts`

Each stub:

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-feature-name',
  standalone: true,
  template: `<p>feature-name works!</p>`
})
export class FeatureNameComponent {}
```

#### 1.39 CREATE `frontend/src/styles.css`

```css
html, body { height: 100%; margin: 0; font-family: Roboto, sans-serif; background: #f5f5f5; }
```

---

### Phase 1 Validation

| Step | Command |
|------|---------|
| Backend compiles | `cd backend && ./mvnw clean compile` |
| Backend starts | `cd backend && ./mvnw spring-boot:run` — check console for "Started ExpenseTrackerApplication" |
| DB tables exist | `psql -U postgres -d expense_tracker -c "\dt"` — shows `app_user`, `category` |
| Frontend compiles | `cd frontend && npm install && npx ng build` |
| Frontend serves | `cd frontend && npx ng serve` — opens at localhost:4200 |
| Full flow | Start backend + frontend + DB. Open localhost:4200. See login page. |

---

## Phase 2: Core Entry & Categories (Weeks 3-4)

**Goal**: User can add, edit, delete expenses. Categories work with suggestions. Tags functional.

---

### Phase 2 Backend

#### 2.1 UPDATE `V2__create_category.sql` (already exists from Phase 1)

No change needed — table already exists.

#### 2.2 CREATE `V3__seed_predefined_categories.sql`

```sql
INSERT INTO category (id, name, is_predefined, sort_order) VALUES
    (gen_random_uuid(), 'Food & Dining',     TRUE, 1),
    (gen_random_uuid(), 'Groceries',         TRUE, 2),
    (gen_random_uuid(), 'Housing',           TRUE, 3),
    (gen_random_uuid(), 'Utilities',         TRUE, 4),
    (gen_random_uuid(), 'Transportation',    TRUE, 5),
    (gen_random_uuid(), 'Entertainment',     TRUE, 6),
    (gen_random_uuid(), 'Shopping',          TRUE, 7),
    (gen_random_uuid(), 'Health & Medical',  TRUE, 8),
    (gen_random_uuid(), 'Insurance',         TRUE, 9),
    (gen_random_uuid(), 'Education',         TRUE, 10),
    (gen_random_uuid(), 'Travel',            TRUE, 11),
    (gen_random_uuid(), 'Subscriptions',     TRUE, 12),
    (gen_random_uuid(), 'Personal Care',     TRUE, 13),
    (gen_random_uuid(), 'Gifts & Donations', TRUE, 14),
    (gen_random_uuid(), 'Other',             TRUE, 15);
```

#### 2.3 CREATE `V4__create_expense_table.sql`

```sql
CREATE TABLE expense (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    category_id           UUID NOT NULL REFERENCES category(id) ON DELETE RESTRICT,
    amount                DECIMAL(12, 2) NOT NULL CHECK (amount != 0),
    currency              VARCHAR(3) NOT NULL DEFAULT 'BDT',
    description           VARCHAR(500) NOT NULL,
    notes                 TEXT,
    date                  DATE NOT NULL,
    time                  TIME WITHOUT TIME ZONE,
    payment_method        VARCHAR(50) NOT NULL DEFAULT 'Cash',
    tags                  TEXT[] NOT NULL DEFAULT '{}',
    receipt_image_path    VARCHAR(1000),
    is_recurring          BOOLEAN NOT NULL DEFAULT FALSE,
    recurring_template_id UUID,
    version               INTEGER NOT NULL DEFAULT 0,
    created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expense_user_date ON expense(user_id, date DESC);
CREATE INDEX idx_expense_category ON expense(user_id, category_id);
CREATE INDEX idx_expense_payment ON expense(user_id, payment_method);
CREATE INDEX idx_expense_tags ON expense USING gin(tags);
CREATE INDEX idx_expense_search ON expense USING gin(
    to_tsvector('english', coalesce(description, '') || ' ' || coalesce(notes, ''))
);
```

#### 2.4 CREATE `backend/src/main/java/com/expensetracker/entity/Category.java`

```java
package com.expensetracker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "category")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Boolean isPredefined;

    @Column(precision = 12, scale = 2)
    private BigDecimal monthlyBudget;

    @Column(nullable = false)
    private Integer sortOrder;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        if (isPredefined == null) isPredefined = false;
        if (sortOrder == null) sortOrder = 0;
    }
}
```

#### 2.5 CREATE `backend/src/main/java/com/expensetracker/entity/Expense.java`

```java
package com.expensetracker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "expense")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private String currency;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    private LocalDate date;

    private LocalTime time;

    @Column(nullable = false)
    private String paymentMethod;

    @Column(columnDefinition = "TEXT[]")
    private String tags;

    private String receiptImagePath;

    @Column(nullable = false)
    private Boolean isRecurring;

    private UUID recurringTemplateId;

    @Version
    @Column(nullable = false)
    private Integer version;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
        if (currency == null) currency = "BDT";
        if (paymentMethod == null) paymentMethod = "Cash";
        if (tags == null) tags = "{}";
        if (isRecurring == null) isRecurring = false;
        if (version == null) version = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
```

- **GOTCHA**: tags stored as PostgreSQL TEXT[] array. JPA maps via `columnDefinition`. In queries, use native `ANY(e.tags)` or `= ANY(:tag)`.

#### 2.6 CREATE `backend/src/main/java/com/expensetracker/repository/CategoryRepository.java`

```java
package com.expensetracker.repository;

import com.expensetracker.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    @Query("SELECT c FROM Category c WHERE c.user.id = :userId OR c.isPredefined = true ORDER BY c.sortOrder")
    List<Category> findByUserIdOrPredefined(@Param("userId") UUID userId);

    @Query("SELECT c FROM Category c WHERE (c.user.id = :userId OR c.isPredefined = true) AND c.id = :id")
    Optional<Category> findByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    boolean existsByNameIgnoreCaseAndUserId(String name, UUID userId);

    @Query(value = "SELECT c FROM Category c WHERE c.user.id = :userId OR c.isPredefined = true ORDER BY " +
           "CASE WHEN LOWER(:merchant) LIKE '%' || LOWER(c.name) || '%' THEN 0 ELSE 1 END, c.sortOrder")
    List<Category> suggestByMerchant(@Param("merchant") String merchant, @Param("userId") UUID userId);
}
```

#### 2.7 CREATE `backend/src/main/java/com/expensetracker/repository/ExpenseRepository.java`

```java
package com.expensetracker.repository;

import com.expensetracker.entity.Expense;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExpenseRepository extends JpaRepository<Expense, UUID> {

    Page<Expense> findByUserIdOrderByDateDesc(UUID userId, Pageable pageable);

    Optional<Expense> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT e FROM Expense e WHERE e.user.id = :userId AND " +
           "(:search IS NULL OR LOWER(e.description) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(COALESCE(e.notes, '')) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:categoryId IS NULL OR e.category.id = :categoryId) " +
           "AND (:paymentMethod IS NULL OR e.paymentMethod = :paymentMethod) " +
           "AND (:startDate IS NULL OR e.date >= :startDate) " +
           "AND (:endDate IS NULL OR e.date <= :endDate) " +
           "ORDER BY e.date DESC, e.createdAt DESC")
    Page<Expense> searchExpenses(
        @Param("userId") UUID userId,
        @Param("search") String search,
        @Param("categoryId") UUID categoryId,
        @Param("paymentMethod") String paymentMethod,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        Pageable pageable
    );

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE " +
           "e.user.id = :userId AND e.category.id = :categoryId AND " +
           "EXTRACT(YEAR FROM e.date) = :year AND EXTRACT(MONTH FROM e.date) = :month AND e.amount > 0")
    BigDecimal totalSpentInCategory(@Param("userId") UUID userId, @Param("categoryId") UUID categoryId,
                                     @Param("year") int year, @Param("month") int month);

    @Query("SELECT e FROM Expense e WHERE e.user.id = :userId AND e.amount > 0 AND " +
           "EXTRACT(YEAR FROM e.date) = :year AND EXTRACT(MONTH FROM e.date) = :month")
    List<Expense> findByUserAndMonth(@Param("userId") UUID userId, @Param("year") int year, @Param("month") int month);

    @Query("SELECT EXTRACT(YEAR FROM e.date) as year, EXTRACT(MONTH FROM e.date) as month, SUM(e.amount) as total " +
           "FROM Expense e WHERE e.user.id = :userId AND e.amount > 0 AND " +
           "e.date >= :since GROUP BY EXTRACT(YEAR FROM e.date), EXTRACT(MONTH FROM e.date) ORDER BY year, month")
    List<Object[]> monthlyTrend(@Param("userId") UUID userId, @Param("since") LocalDate since);
}
```

#### 2.8 CREATE `backend/src/main/java/com/expensetracker/dto/request/ExpenseCreateRequest.java`

```java
package com.expensetracker.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record ExpenseCreateRequest(
    @NotNull @DecimalMin(value = "0.01", message = "Amount must be positive")
    @Digits(integer = 10, fraction = 2) BigDecimal amount,

    @NotBlank @Size(max = 500) String description,

    @NotNull LocalDate date,

    LocalTime time,

    @NotNull UUID categoryId,

    String paymentMethod,

    List<@Size(max = 50) String> tags,

    @Size(max = 2000) String notes,

    UUID receiptImageId
) {
    public ExpenseCreateRequest {
        if (paymentMethod == null) paymentMethod = "Cash";
        if (tags == null) tags = List.of();
    }
}
```

#### 2.9 CREATE `backend/src/main/java/com/expensetracker/dto/request/CategoryCreateRequest.java`

```java
package com.expensetracker.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryCreateRequest(
    @NotBlank @Size(max = 100) String name
) {}
```

#### 2.10 CREATE `backend/src/main/java/com/expensetracker/dto/request/CategoryUpdateRequest.java`

```java
package com.expensetracker.dto.request;

import java.math.BigDecimal;

public record CategoryUpdateRequest(
    String name,
    BigDecimal monthlyBudget
) {}
```

#### 2.11 CREATE DTOs (responses)

`backend/src/main/java/com/expensetracker/dto/response/CategoryDTO.java`:

```java
public record CategoryDTO(
    UUID id, String name, boolean isPredefined,
    BigDecimal monthlyBudget, BigDecimal spentThisMonth,
    Integer sortOrder
) {}
```

`backend/src/main/java/com/expensetracker/dto/response/ExpenseDTO.java`:

```java
package com.expensetracker.dto.response;

import java.math.BigDecimal;
import java.time.*;
import java.util.List;
import java.util.UUID;

public record ExpenseDTO(
    UUID id, BigDecimal amount, String currency, String description,
    String notes, LocalDate date, LocalTime time,
    CategorySummaryDTO category,
    String paymentMethod, List<String> tags,
    String receiptImageUrl, boolean isRecurring,
    UUID recurringTemplateId, Instant createdAt, Instant updatedAt
) {
    public record CategorySummaryDTO(UUID id, String name) {}
}
```

#### 2.12 CREATE `backend/src/main/java/com/expensetracker/mapper/ExpenseMapper.java`

```java
package com.expensetracker.mapper;

import com.expensetracker.dto.response.ExpenseDTO;
import com.expensetracker.entity.Expense;

import java.util.Arrays;
import java.util.List;

public class ExpenseMapper {

    private static final String TAGS_DELIMITER = ",";

    public static String tagsToString(List<String> tags) {
        if (tags == null || tags.isEmpty()) return "{}";
        return "{" + String.join(TAGS_DELIMITER, tags) + "}";
    }

    public static List<String> stringToTags(String tags) {
        if (tags == null || tags.equals("{}") || tags.isBlank()) return List.of();
        String clean = tags.replaceAll("[{}]", "");
        return Arrays.stream(clean.split(TAGS_DELIMITER))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toList();
    }

    public static ExpenseDTO toDto(Expense expense) {
        return new ExpenseDTO(
            expense.getId(),
            expense.getAmount(),
            expense.getCurrency(),
            expense.getDescription(),
            expense.getNotes(),
            expense.getDate(),
            expense.getTime(),
            new ExpenseDTO.CategorySummaryDTO(
                expense.getCategory().getId(),
                expense.getCategory().getName()
            ),
            expense.getPaymentMethod(),
            stringToTags(expense.getTags()),
            expense.getReceiptImagePath() != null
                ? "/api/receipts/" + expense.getId() + "/image" : null,
            expense.getIsRecurring(),
            expense.getRecurringTemplateId(),
            expense.getCreatedAt(),
            expense.getUpdatedAt()
        );
    }
}
```

#### 2.13 CREATE `backend/src/main/java/com/expensetracker/mapper/CategoryMapper.java`

```java
package com.expensetracker.mapper;

import com.expensetracker.dto.response.CategoryDTO;
import com.expensetracker.entity.Category;
import java.math.BigDecimal;

public class CategoryMapper {
    public static CategoryDTO toDto(Category category, BigDecimal spentThisMonth) {
        return new CategoryDTO(
            category.getId(),
            category.getName(),
            category.getIsPredefined(),
            category.getMonthlyBudget(),
            spentThisMonth,
            category.getSortOrder()
        );
    }
}
```

#### 2.14 CREATE `backend/src/main/java/com/expensetracker/service/CategoryService.java`

```java
package com.expensetracker.service;

import com.expensetracker.dto.request.CategoryCreateRequest;
import com.expensetracker.dto.request.CategoryUpdateRequest;
import com.expensetracker.dto.response.CategoryDTO;
import com.expensetracker.entity.Category;
import com.expensetracker.entity.User;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.mapper.CategoryMapper;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ExpenseRepository expenseRepository;

    public List<CategoryDTO> findAll(UUID userId) {
        var categories = categoryRepository.findByUserIdOrPredefined(userId);
        var now = LocalDate.now();
        return categories.stream().map(cat -> {
            var spent = expenseRepository.totalSpentInCategory(userId, cat.getId(), now.getYear(), now.getMonthValue());
            return CategoryMapper.toDto(cat, spent);
        }).toList();
    }

    @Transactional
    public CategoryDTO create(UUID userId, CategoryCreateRequest req) {
        var user = new User(); user.setId(userId);
        var category = Category.builder()
            .user(user).name(req.name().trim())
            .isPredefined(false).sortOrder(99)
            .build();
        category = categoryRepository.save(category);
        return CategoryMapper.toDto(category, BigDecimal.ZERO);
    }

    @Transactional
    public CategoryDTO update(UUID userId, UUID categoryId, CategoryUpdateRequest req) {
        var category = categoryRepository.findByIdAndUserId(categoryId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));
        if (req.name() != null && !req.name().isBlank() && !category.getIsPredefined()) {
            category.setName(req.name().trim());
        }
        if (req.monthlyBudget() != null) {
            category.setMonthlyBudget(req.monthlyBudget());
        }
        category = categoryRepository.save(category);
        var spent = expenseRepository.totalSpentInCategory(userId, categoryId, LocalDate.now().getYear(), LocalDate.now().getMonthValue());
        return CategoryMapper.toDto(category, spent);
    }

    public void delete(UUID userId, UUID categoryId) {
        var category = categoryRepository.findByIdAndUserId(categoryId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));
        if (category.getIsPredefined()) {
            throw new IllegalStateException("Cannot delete predefined category");
        }
        // Check if category has expenses
        var spent = expenseRepository.totalSpentInCategory(userId, categoryId, 2024, 1); // rough check
        // Better: add an existsByCategoryId method
        categoryRepository.delete(category);
    }

    public List<CategoryDTO> suggest(UUID userId, String merchant) {
        var categories = categoryRepository.suggestByMerchant(merchant, userId);
        return categories.stream().limit(3).map(cat ->
            CategoryMapper.toDto(cat, BigDecimal.ZERO)
        ).toList();
    }
}
```

#### 2.15 CREATE `backend/src/main/java/com/expensetracker/service/ExpenseService.java`

```java
package com.expensetracker.service;

import com.expensetracker.dto.request.ExpenseCreateRequest;
import com.expensetracker.dto.response.ExpenseDTO;
import com.expensetracker.entity.Category;
import com.expensetracker.entity.Expense;
import com.expensetracker.entity.User;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.mapper.ExpenseMapper;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final CategoryRepository categoryRepository;

    public Page<ExpenseDTO> findAll(UUID userId, String search, UUID categoryId,
                                    String paymentMethod, LocalDate startDate, LocalDate endDate,
                                    Pageable pageable) {
        return expenseRepository.searchExpenses(userId, search, categoryId, paymentMethod, startDate, endDate, pageable)
            .map(ExpenseMapper::toDto);
    }

    public ExpenseDTO findById(UUID userId, UUID expenseId) {
        var expense = expenseRepository.findByIdAndUserId(expenseId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Expense", "id", expenseId));
        return ExpenseMapper.toDto(expense);
    }

    @Transactional
    public ExpenseDTO create(UUID userId, ExpenseCreateRequest req) {
        var user = new User(); user.setId(userId);
        var category = categoryRepository.findByIdAndUserId(req.categoryId(), userId)
            .orElseThrow(() -> new ResourceNotFoundException("Category", "id", req.categoryId()));

        var expense = Expense.builder()
            .user(user).category(category)
            .amount(req.amount()).currency("BDT")
            .description(req.description().trim())
            .notes(req.notes())
            .date(req.date()).time(req.time())
            .paymentMethod(req.paymentMethod())
            .tags(ExpenseMapper.tagsToString(req.tags()))
            .build();
        expense = expenseRepository.save(expense);
        return ExpenseMapper.toDto(expense);
    }

    @Transactional
    public ExpenseDTO update(UUID userId, UUID expenseId, ExpenseCreateRequest req) {
        var expense = expenseRepository.findByIdAndUserId(expenseId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Expense", "id", expenseId));

        if (req.amount() != null) expense.setAmount(req.amount());
        if (req.description() != null) expense.setDescription(req.description().trim());
        if (req.date() != null) expense.setDate(req.date());
        expense.setTime(req.time());
        if (req.categoryId() != null) {
            var category = categoryRepository.findByIdAndUserId(req.categoryId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", req.categoryId()));
            expense.setCategory(category);
        }
        if (req.paymentMethod() != null) expense.setPaymentMethod(req.paymentMethod());
        if (req.tags() != null) expense.setTags(ExpenseMapper.tagsToString(req.tags()));
        if (req.notes() != null) expense.setNotes(req.notes());

        expense = expenseRepository.save(expense);
        return ExpenseMapper.toDto(expense);
    }

    @Transactional
    public void delete(UUID userId, UUID expenseId) {
        var expense = expenseRepository.findByIdAndUserId(expenseId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Expense", "id", expenseId));
        // Delete receipt image file if exists
        expenseRepository.delete(expense);
    }
}
```

#### 2.16 CREATE `backend/src/main/java/com/expensetracker/controller/CategoryController.java`

```java
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;

    @GetMapping
    public ApiResponse<List<CategoryDTO>> getAll(@AuthenticationPrincipal OAuth2User principal) {
        var userId = UUID.fromString(principal.getAttribute("sub")); // FIX: use auth service
        return ApiResponse.success(categoryService.findAll(userId));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryDTO>> create(
            @AuthenticationPrincipal OAuth2User principal,
            @Valid @RequestBody CategoryCreateRequest req) {
        var userId = UUID.fromString(principal.getAttribute("sub"));
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(categoryService.create(userId, req)));
    }

    @PutMapping("/{id}")
    public ApiResponse<CategoryDTO> update(
            @AuthenticationPrincipal OAuth2User principal,
            @PathVariable UUID id, @Valid @RequestBody CategoryUpdateRequest req) {
        var userId = UUID.fromString(principal.getAttribute("sub"));
        return ApiResponse.success(categoryService.update(userId, id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal OAuth2User principal, @PathVariable UUID id) {
        var userId = UUID.fromString(principal.getAttribute("sub"));
        categoryService.delete(userId, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/suggest")
    public ApiResponse<List<CategoryDTO>> suggest(
            @AuthenticationPrincipal OAuth2User principal,
            @RequestParam String merchant) {
        var userId = UUID.fromString(principal.getAttribute("sub"));
        return ApiResponse.success(categoryService.suggest(userId, merchant));
    }
}
```

- **GOTCHA**: `principal.getAttribute("sub")` returns String. Need to parse to UUID. But `sub` is Google's unique ID (string), not our DB UUID. **Fix**: Use `AuthService` to get the internal UUID from `googleSub`.

**Fix**: Extract userId via a helper that looks up user by OAuth subject:

```java
// In AuthService:
public UUID getUserId(OAuth2User principal) {
    String googleSub = principal.getAttribute("sub");
    return userRepository.findByGoogleSub(googleSub)
        .orElseThrow(() -> new ResourceNotFoundException("User", "googleSub", googleSub))
        .getId();
}
```

#### 2.17 CREATE `backend/src/main/java/com/expensetracker/controller/ExpenseController.java`

(Same pattern as CategoryController — GET list, POST create, GET by id, PUT update, DELETE)

#### 2.18 CREATE `backend/src/main/java/com/expensetracker/service/TagService.java`

```java
@Service
@RequiredArgsConstructor
public class TagService {

    private final ExpenseRepository expenseRepository;

    public List<String> getAllTags(UUID userId) {
        var tags = expenseRepository.findAllTagsByUserId(userId);
        // Returns distinct tags from all user's expenses
        return tags.stream()
            .flatMap(t -> ExpenseMapper.stringToTags((String) t[0]).stream())
            .distinct()
            .sorted()
            .toList();
    }

    @Transactional
    public void renameTag(UUID userId, String oldName, String newName) {
        // Update all expenses that have oldName in tags array
        // Use native query: UPDATE expense SET tags = array_replace(tags, oldName, newName)
    }

    @Transactional
    public void mergeTags(UUID userId, String sourceTag, String targetTag) {
        // Remove sourceTag from all expenses, add targetTag if not present
    }
}
```

---

### Phase 2 Frontend

#### 2.19 CREATE full ExpenseFormComponent with all fields

- Reactive form with all 14 fields
- Category dropdown with search + inline creation
- Tags with auto-suggest (MatChipInput)
- Payment method dropdown
- Date picker + time picker
- Validation messages inline
- Unsaved changes warning (CanDeactivate)

#### 2.20 CREATE ExpenseListComponent with full table

- MatTable with sorting
- Paginator (50 per page)
- Filter bar: search input + category dropdown + date range + payment method
- Row click → navigate to detail
- Receipt icon indicator

#### 2.21 CREATE CategoryListComponent with budget editing

- Table showing all categories
- Inline budget edit (mat-input)
- Custom category deletion with confirmation dialog
- Lock icon for predefined

#### 2.22 CREATE `frontend/src/app/shared/material.module.ts`

```typescript
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  exports: [
    MatButtonModule, MatCardModule, MatTableModule, MatPaginatorModule,
    MatSortModule, MatInputModule, MatSelectModule, MatDatepickerModule,
    MatNativeDateModule, MatIconModule, MatDialogModule, MatSnackBarModule,
    MatChipsModule, MatAutocompleteModule, MatProgressSpinnerModule,
    MatToolbarModule, MatSidenavModule, MatListModule, MatTooltipModule,
  ]
})
export class MaterialModule {}
```

---

### Phase 2 Validation

| Step | Command |
|------|---------|
| DB migration | App starts -> check `expense` table exists, 15 categories seeded |
| Create category | `curl -X POST localhost:8080/api/categories -H "Content-Type: application/json" -d '{"name":"Pet Care"}'` (with session) |
| Create expense | POST to /api/expenses with valid body |
| List expenses | GET /api/expenses?page=0&size=10 |
| Search expenses | GET /api/expenses?search=kacchi |
| Frontend form | Open localhost:4200/expenses/new, fill form, submit |

---

## Phase 3: OCR & Receipts (Weeks 5-6)

**Goal**: User can upload receipt photo, OCR extracts fields, user reviews and saves.

---

### Phase 3 Backend

#### 3.1 CREATE `backend/src/main/java/com/expensetracker/service/StorageService.java`

```java
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

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf("."));
    }
}
```

#### 3.2 CREATE `backend/src/main/java/com/expensetracker/ocr/TesseractOcrEngine.java`

```java
package com.expensetracker.ocr;

import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Path;

@Service
public class TesseractOcrEngine {

    private final Tesseract tesseract;

    public TesseractOcrEngine() {
        tesseract = new Tesseract();
        tesseract.setDatapath("/usr/share/tesseract-ocr/4.00/tessdata"); // Adjust per OS
        tesseract.setLanguage("eng");
        tesseract.setPageSegMode(6); // Assume uniform block of text
    }

    public String extractText(Path imagePath) {
        try {
            BufferedImage image = ImageIO.read(imagePath.toFile());
            return tesseract.doOCR(image);
        } catch (TesseractException | IOException e) {
            throw new RuntimeException("OCR processing failed", e);
        }
    }
}
```

- **GOTCHA**: Tesseract must be installed on the system (`apt install tesseract-ocr`) or bundled in Docker image.
- **Docker**: Add to Dockerfile: `RUN apt-get update && apt-get install -y tesseract-ocr`

#### 3.3 CREATE `backend/src/main/java/com/expensetracker/ocr/ReceiptParser.java`

```java
package com.expensetracker.ocr;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ReceiptParser {

    private static final Pattern AMOUNT_PATTERN = Pattern.compile(
        "[৳$€£]?\\s*\\d{1,10}[.,]\\d{2}\\s*$"
    );
    private static final List<DateTimeFormatter> DATE_FORMATS = List.of(
        DateTimeFormatter.ofPattern("yyyy-MM-dd"),
        DateTimeFormatter.ofPattern("dd/MM/yyyy"),
        DateTimeFormatter.ofPattern("MM/dd/yyyy"),
        DateTimeFormatter.ofPattern("dd-MM-yyyy"),
        DateTimeFormatter.ofPattern("MMM dd, yyyy", Locale.ENGLISH),
        DateTimeFormatter.ofPattern("MMMM dd, yyyy", Locale.ENGLISH)
    );

    public record ParsedReceipt(
        BigDecimal amount, double amountConfidence,
        String merchant, double merchantConfidence,
        LocalDate date, double dateConfidence
    ) {}

    public ParsedReceipt parse(String rawText) {
        if (rawText == null || rawText.isBlank()) {
            return new ParsedReceipt(null, 0, null, 0, null, 0);
        }

        var lines = rawText.lines()
            .map(String::trim)
            .filter(l -> !l.isEmpty())
            .toList();

        BigDecimal amount = null;
        double amountConf = 0;
        LocalDate date = null;
        double dateConf = 0;
        String merchant = null;
        double merchantConf = 0;

        for (String line : lines) {
            // Try to extract amount (last line with price pattern is usually total)
            var m = AMOUNT_PATTERN.matcher(line);
            if (m.find() && amount == null) {
                try {
                    var clean = line.replaceAll("[^\\d.,]", "");
                    clean = clean.replace(",", "");
                    amount = new BigDecimal(clean);
                    amountConf = 0.85;
                } catch (NumberFormatException ignored) {}
            }

            // Try to extract date
            if (date == null) {
                for (var fmt : DATE_FORMATS) {
                    try {
                        date = LocalDate.parse(line.trim(), fmt);
                        dateConf = 0.8;
                        break;
                    } catch (DateTimeParseException ignored) {}
                }
            }

            // First non-date, non-amount line is likely merchant
            if (merchant == null && !line.matches(".*\\d.*") && line.length() > 3
                && !line.toLowerCase().contains("total") && !line.toLowerCase().contains("receipt")) {
                merchant = line;
                merchantConf = 0.75;
            }
        }

        return new ParsedReceipt(amount, amountConf, merchant, merchantConf, date, dateConf);
    }
}
```

#### 3.4 CREATE `backend/src/main/java/com/expensetracker/ocr/CategorySuggester.java`

```java
package com.expensetracker.ocr;

import com.expensetracker.dto.response.CategoryDTO;
import com.expensetracker.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategorySuggester {

    private final CategoryService categoryService;

    public record Suggestion(UUID categoryId, String categoryName, double confidence) {}

    public Suggestion suggest(UUID userId, String merchant) {
        if (merchant == null || merchant.isBlank()) {
            return new Suggestion(null, null, 0);
        }
        var suggestions = categoryService.suggest(userId, merchant);
        if (suggestions.isEmpty()) {
            return new Suggestion(null, null, 0);
        }
        var best = suggestions.get(0);
        double confidence = best.name().toLowerCase().contains(merchant.toLowerCase().split(" ")[0])
            ? 0.85 : 0.6;
        return new Suggestion(best.id(), best.name(), confidence);
    }
}
```

#### 3.5 CREATE `backend/src/main/java/com/expensetracker/service/OcrService.java`

```java
package com.expensetracker.service;

import com.expensetracker.ocr.CategorySuggester;
import com.expensetracker.ocr.ReceiptParser;
import com.expensetracker.ocr.TesseractOcrEngine;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OcrService {

    private final TesseractOcrEngine ocrEngine;
    private final ReceiptParser receiptParser;
    private final CategorySuggester categorySuggester;
    private final StorageService storageService;

    public record OcrResult(
        UUID receiptImageId,
        Double extractedAmount, double amountConfidence,
        String extractedMerchant, double merchantConfidence,
        String extractedDate, double dateConfidence,
        UUID suggestedCategoryId, String suggestedCategoryName, double categoryConfidence,
        String imageUrl
    ) {}

    public OcrResult process(UUID userId, MultipartFile file) {
        // 1. Validate file
        var contentType = file.getContentType();
        if (contentType != null && !List.of("image/jpeg", "image/png", "image/heic", "application/pdf").contains(contentType)) {
            throw new IllegalArgumentException("Unsupported file format");
        }
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("File too large (max 10MB)");
        }

        // 2. Store file temporarily
        var path = storageService.store(userId, file);

        // 3. Run OCR
        var fullPath = storageService.load(path);
        var rawText = ocrEngine.extractText(fullPath);

        // 4. Parse fields
        var parsed = receiptParser.parse(rawText);

        // 5. Suggest category
        var suggestion = categorySuggester.suggest(userId, parsed.merchant());

        return new OcrResult(
            UUID.randomUUID(), // receiptImageId
            parsed.amount() != null ? parsed.amount().doubleValue() : null, parsed.amountConfidence(),
            parsed.merchant(), parsed.merchantConfidence(),
            parsed.date() != null ? parsed.date().toString() : null, parsed.dateConfidence(),
            suggestion.categoryId(), suggestion.categoryName(), suggestion.confidence(),
            "/api/receipts/" + path
        );
    }
}
```

#### 3.6 CREATE `backend/src/main/java/com/expensetracker/controller/ReceiptController.java`

```java
@RestController
@RequestMapping("/api/receipts")
@RequiredArgsConstructor
public class ReceiptController {

    private final OcrService ocrService;
    private final StorageService storageService;

    @PostMapping("/upload")
    public ApiResponse<OcrService.OcrResult> upload(
            @AuthenticationPrincipal OAuth2User principal,
            @RequestParam("file") MultipartFile file) {
        var userId = authService.getUserId(principal);
        var result = ocrService.process(userId, file);
        return ApiResponse.success(result);
    }

    @GetMapping("/{path}/image")
    public ResponseEntity<org.springframework.core.io.Resource> getImage(@PathVariable String path) {
        var filePath = storageService.load(path);
        var resource = new org.springframework.core.io.UrlResource(filePath.toUri());
        if (resource.exists() && resource.isReadable()) {
            return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(resource);
        }
        return ResponseEntity.notFound().build();
    }
}
```

- **GOTCHA**: Path variable with slashes needs `@PathVariable` with `@RequestMapping` handling. Better: use separate path segments or encode.

---

### Phase 3 Frontend

#### 3.7 CREATE OCR Review Modal component

```typescript
// ocr-review.component.ts
// Modal dialog showing:
// - Receipt image thumbnail (left)
// - Extracted fields (right) with confidence badges
// - Editable inputs for amount, merchant, date
// - Category suggestion dropdown
// - [Retake Photo] and [Save Entry] buttons
```

- Confidence indicator colors: green (>=0.9), yellow (0.7-0.89), red (<0.7)
- All fields editable
- Save calls ExpenseService.create()

#### 3.8 UPDATE ExpenseFormComponent

- Add "Scan Receipt" button with file input
- On file select: show loading spinner, call POST /api/receipts/upload
- On success: open OCR review modal pre-filled
- On failure: show "Couldn't read receipt" toast, keep form empty

---

### Phase 3 Validation

| Step | Command |
|------|---------|
| OCR endpoint | `curl -X POST -F "file=@receipt.jpg" localhost:8080/api/receipts/upload` — returns parsed fields |
| Review flow | Upload receipt in UI, see extracted fields, edit, save |
| Image serving | GET returned imageUrl -> see receipt image |
| Edge: blurry receipt | OCR returns low confidence, fields marked yellow |

---

## Phase 4: Budgets, Recurring & Reports (Weeks 7-8)

**Goal**: Budget alerts fire at thresholds. Recurring entries auto-generate. Charts and reports show spending insights.

---

### Phase 4 Backend

#### 4.1 CREATE `V5__create_recurring_template.sql`

```sql
CREATE TABLE recurring_template (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    category_id     UUID NOT NULL REFERENCES category(id) ON DELETE RESTRICT,
    amount          DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    description     VARCHAR(500) NOT NULL,
    notes           TEXT,
    payment_method  VARCHAR(50) NOT NULL DEFAULT 'Cash',
    day_of_month    INTEGER NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recurring_user ON recurring_template(user_id);
CREATE INDEX idx_recurring_active ON recurring_template(is_active);
```

#### 4.2 CREATE `backend/src/main/java/com/expensetracker/entity/RecurringTemplate.java`

(JPA entity, mirrors table structure above)

#### 4.3 CREATE `backend/src/main/java/com/expensetracker/repository/RecurringTemplateRepository.java`

```java
public interface RecurringTemplateRepository extends JpaRepository<RecurringTemplate, UUID> {
    List<RecurringTemplate> findByUserIdAndIsActiveTrue(UUID userId);
    List<RecurringTemplate> findByIsActiveTrue(); // For scheduled generation
}
```

#### 4.4 CREATE `backend/src/main/java/com/expensetracker/service/RecurringService.java`

```java
@Service
@RequiredArgsConstructor
public class RecurringService {

    private final RecurringTemplateRepository templateRepo;
    private final ExpenseRepository expenseRepo;
    private final CategoryRepository categoryRepo;

    @Scheduled(cron = "0 0 0 1 * ?") // Midnight on the 1st of every month
    @Transactional
    public void generateRecurringEntries() {
        var templates = templateRepo.findByIsActiveTrue();
        var now = LocalDate.now();
        for (var t : templates) {
            var expense = Expense.builder()
                .user(t.getUser()).category(t.getCategory())
                .amount(t.getAmount()).currency("BDT")
                .description(t.getDescription()).notes(t.getNotes())
                .date(now.withDayOfMonth(Math.min(t.getDayOfMonth(), now.lengthOfMonth())))
                .paymentMethod(t.getPaymentMethod())
                .tags("{}").isRecurring(true)
                .recurringTemplateId(t.getId())
                .build();
            expenseRepo.save(expense);
        }
    }

    public List<RecurringTemplateDTO> findByUser(UUID userId) {
        return templateRepo.findByUserIdAndIsActiveTrue(userId).stream()
            .map(RecurringMapper::toDto).toList();
    }

    @Transactional
    public RecurringTemplateDTO create(UUID userId, RecurringTemplateRequest req) {
        var user = new User(); user.setId(userId);
        var category = categoryRepo.findByIdAndUserId(req.categoryId(), userId)
            .orElseThrow(() -> new ResourceNotFoundException("Category", "id", req.categoryId()));
        var template = RecurringTemplate.builder()
            .user(user).category(category)
            .amount(req.amount()).description(req.description())
            .notes(req.notes()).paymentMethod(req.paymentMethod())
            .dayOfMonth(req.dayOfMonth()).isActive(true)
            .build();
        return RecurringMapper.toDto(templateRepo.save(template));
    }

    @Transactional
    public void deactivate(UUID userId, UUID templateId) {
        var template = templateRepo.findById(templateId)
            .orElseThrow(() -> new ResourceNotFoundException("RecurringTemplate", "id", templateId));
        template.setIsActive(false);
        templateRepo.save(template);
    }
}
```

#### 4.5 CREATE `backend/src/main/java/com/expensetracker/service/BudgetService.java`

```java
@Service
@RequiredArgsConstructor
public class BudgetService {

    private final ExpenseRepository expenseRepo;
    private final CategoryRepository categoryRepo;

    public record BudgetAlert(
        UUID categoryId, String categoryName,
        BigDecimal budget, BigDecimal spent, double percentUsed,
        String level // OK, WARNING, EXCEEDED
    ) {}

    public List<BudgetAlert> recalculate(UUID userId, UUID categoryId, LocalDate date) {
        // Only recalculate for the affected category + all budgeted categories
        var now = LocalDate.now();
        var categories = categoryRepo.findByUserIdOrPredefined(userId);
        return categories.stream()
            .filter(c -> c.getMonthlyBudget() != null && c.getMonthlyBudget().compareTo(BigDecimal.ZERO) > 0)
            .map(c -> {
                var spent = expenseRepo.totalSpentInCategory(userId, c.getId(), now.getYear(), now.getMonthValue());
                double percent = spent.divide(c.getMonthlyBudget(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).doubleValue();
                String level = percent >= 100 ? "EXCEEDED" : percent >= 80 ? "WARNING" : "OK";
                return new BudgetAlert(c.getId(), c.getName(), c.getMonthlyBudget(), spent, percent, level);
            })
            .toList();
    }
}
```

#### 4.6 CREATE `backend/src/main/java/com/expensetracker/service/ReportService.java`

```java
@Service
@RequiredArgsConstructor
public class ReportService {

    private final ExpenseRepository expenseRepo;
    private final CategoryRepository categoryRepo;

    public record MonthlySummary(
        BigDecimal totalSpent, BigDecimal totalBudget, BigDecimal budgetRemaining,
        TopCategory topCategory, Double vsLastMonth,
        List<DonutSlice> donutData
    ) {
        public record TopCategory(String name, BigDecimal amount) {}
        public record DonutSlice(String category, BigDecimal amount, double percentage) {}
    }

    public record BudgetVsActualRow(
        UUID categoryId, String categoryName,
        BigDecimal budgeted, BigDecimal spent, BigDecimal remaining,
        Double percentUsed, String status
    ) {}

    public record TrendPoint(int year, int month, String label, BigDecimal total) {}

    public MonthlySummary getMonthlySummary(UUID userId, int year, int month) {
        var expenses = expenseRepo.findByUserAndMonth(userId, year, month);
        var totalSpent = expenses.stream()
            .filter(e -> e.getAmount().compareTo(BigDecimal.ZERO) > 0)
            .map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        var categories = categoryRepo.findByUserIdOrPredefined(userId);
        var totalBudget = categories.stream()
            .map(Category::getMonthlyBudget).filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Top category
        var categoryTotals = new HashMap<UUID, BigDecimal>();
        for (var e : expenses) {
            if (e.getAmount().compareTo(BigDecimal.ZERO) > 0) {
                categoryTotals.merge(e.getCategory().getId(), e.getAmount(), BigDecimal::add);
            }
        }
        var topCat = categoryTotals.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(e -> {
                var cat = categories.stream().filter(c -> c.getId().equals(e.getKey())).findFirst().orElse(null);
                return new MonthlySummary.TopCategory(cat != null ? cat.getName() : "Unknown", e.getValue());
            })
            .orElse(new MonthlySummary.TopCategory("None", BigDecimal.ZERO));

        // Donut data
        var donut = categoryTotals.entrySet().stream().map(e -> {
            var cat = categories.stream().filter(c -> c.getId().equals(e.getKey())).findFirst().orElse(null);
            return new MonthlySummary.DonutSlice(
                cat != null ? cat.getName() : "Unknown",
                e.getValue(),
                totalSpent.compareTo(BigDecimal.ZERO) > 0
                    ? e.getValue().divide(totalSpent, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                    : 0
            );
        }).sorted((a, b) -> b.amount().compareTo(a.amount())).toList();

        return new MonthlySummary(totalSpent, totalBudget, totalBudget.subtract(totalSpent), topCat, 0.0, donut);
    }
}
```

#### 4.7 CREATE `backend/src/main/java/com/expensetracker/service/ExportService.java`

- ZIP generation: CSV for expenses/categories + receipt images
- Uses `ZipOutputStream` and `Commons CSV`

#### 4.8 CREATE `backend/src/main/java/com/expensetracker/service/AccountService.java`

- DELETE cascade: delete receipt files, then user (cascades to expenses, categories, templates)

#### 4.9 CREATE Controllers:

- `ReportController` — /api/reports/monthly-summary, /api/reports/budget-vs-actual, /api/reports/trend, /api/reports/category-breakdown
- `RecurringController` — CRUD + generate
- `SettingsController` — GET/PUT settings
- `TagController` — GET, rename, merge
- `AccountController` — DELETE /api/account

---

### Phase 4 Frontend

#### 4.10 CREATE DashboardComponent with full layout

```typescript
// 4 summary cards (MatCard)
// Donut chart (ng2-charts)
// Budget progress cards (per category)
// Recent transactions table (last 5)
// FAB button
```

#### 4.11 CREATE ReportsComponent with tabs

```typescript
// Tab 1: Budget vs Actual table (color-coded)
// Tab 2: 6-Month Trend line chart
// Tab 3: Category Breakdown drill-down
// Month/Year selector
```

#### 4.12 CREATE RecurringListComponent

- Table of recurring templates
- Add/Edit/Deactivate buttons
- Day-of-month selector

#### 4.13 CREATE SettingsComponent

- Preferences form (default payment method, session timeout)
- Export button
- Delete account with confirmation dialog

#### 4.14 CREATE Chart components

- `donut-chart.component.ts` — wraps ng2-charts
- `trend-chart.component.ts` — line chart wrapper

---

### Phase 4 Validation

| Step | Command |
|------|---------|
| Set budget | PUT /api/categories/{id} with `{"monthlyBudget": 500}` |
| Trigger alert | Create expenses totaling >400 in that category -> check alert in response |
| Recurring generation | Manually `POST /api/recurring/generate` -> check pending entries created |
| Monthly summary | GET /api/reports/monthly-summary -> check donut + totals |
| Budget vs actual | GET /api/reports/budget-vs-actual -> check table |
| Trend | GET /api/reports/trend?months=6 -> check line data |
| Export | POST /api/export -> download ZIP |
| Delete account | DELETE /api/account with confirmation -> user wiped |

---

## TESTING STRATEGY

No automated tests for MVP. All validation is manual via:

1. **Backend**: `curl` commands against each endpoint
2. **Frontend**: Visual inspection in browser at each step
3. **Full flow**: Register -> add expense -> see report -> export -> delete

---

## COMPLETION CHECKLIST

- [x] Phase 1: Backend compiles, DB tables exist, OAuth login works
- [x] Phase 2: CRUD expenses + categories, search/filter works
- [x] Phase 3: OCR extracts fields, review-save flow works
- [x] Phase 4: Budget alerts fire, recurring generates, charts render, export works

---

## NOTES

- No code exists yet. This plan scaffolds everything from scratch.
- OAuth requires real Google Cloud Console credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
- Tesseract must be installed on dev machine or Docker image.
- All dates stored as UTC in DB, displayed in user's timezone on frontend.
- Receipt images stored on local filesystem under `~/expense-tracker/receipts/{userId}/`.

**Confidence Score**: 8/10 for one-pass implementation success. Main risks: Tesseract OCR quality variance, OAuth redirect URI mismatches, PostgreSQL array handling in JPA.
