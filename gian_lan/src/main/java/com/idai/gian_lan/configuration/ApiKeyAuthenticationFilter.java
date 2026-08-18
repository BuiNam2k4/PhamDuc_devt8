package com.idai.gian_lan.configuration;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class ApiKeyAuthenticationFilter extends OncePerRequestFilter {

    @Value("${app.api-key:super-secret-ai-token-123}")
    private String apiKey;

    private static final String API_KEY_HEADER = "X-API-KEY";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String requestApiKey = request.getHeader(API_KEY_HEADER);

        if (requestApiKey != null && apiKey.equals(requestApiKey)) {
            // Create an authenticated token for the AI service client
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    "AI_SERVICE",
                    null,
                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_AI_SERVICE"))
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }
}
