package com.school.erp.config;

import com.school.erp.security.JwtUtil;
import com.school.erp.tenant.TenantContext;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;

/**
 * STOMP broker endpoint is {@code /ws} on this server (not under {@code /api/v1}).
 * The UI derives {@code wss://api-host/ws} from the REST base URL; use {@code websocketUrl} in {@code config.json} if a gateway uses a different path.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final JwtUtil jwtUtil;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app");
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null) return message;

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String auth = accessor.getFirstNativeHeader(HttpHeaders.AUTHORIZATION);
                    if (auth == null || auth.isBlank()) {
                        auth = accessor.getFirstNativeHeader("authorization");
                    }
                    if (auth != null && auth.toLowerCase().startsWith("bearer ")) {
                        String token = auth.substring(7);
                        try {
                            var claims = jwtUtil.parseToken(token);
                            String tenantId = claims.get("tenantId", String.class);
                            Long userId = claims.get("userId", Long.class);
                            String role = claims.get("role", String.class);

                            TenantContext.setTenantId(tenantId);
                            TenantContext.setUserId(userId);
                            TenantContext.setUserRole(role);

                            var principal = new UsernamePasswordAuthenticationToken(
                                    String.valueOf(userId),
                                    null,
                                    List.of(new SimpleGrantedAuthority("ROLE_" + role))
                            );
                            accessor.setUser(principal);
                        } catch (Exception ignored) {
                            // If token invalid, let Spring security block subscription/send on secured endpoints (REST is the source of truth).
                        }
                    }
                }

                return message;
            }
        });
    }

    public WebSocketConfig(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }
}

