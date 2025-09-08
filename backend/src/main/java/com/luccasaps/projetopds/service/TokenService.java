package com.luccasaps.projetopds.service;

import com.luccasaps.projetopds.model.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;

@Service
public class TokenService {

    @Value("${jwt.secret}")      // Segredo em Base64 (deve ter >= 32 bytes após decode)
    private String secret;

    @Value("${jwt.expiration}")  // Expiração em milissegundos
    private long expiration;

    public String gerarToken(User user) {
        long agora = System.currentTimeMillis();
        return Jwts.builder()
                .setSubject(user.getEmail())
                .setIssuedAt(new Date(agora))
                .setExpiration(new Date(agora + expiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String getSubject(String tokenJWT) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .setAllowedClockSkewSeconds(60)
                    .build()
                    .parseClaimsJws(tokenJWT)
                    .getBody()
                    .getSubject();
        } catch (JwtException | IllegalArgumentException e) {
            return null; // inválido/expirado
        }
    }

    private Key getSigningKey() {
        // Decodifica Base64 e usa como chave HMAC-SHA256
        byte[] keyBytes = Decoders.BASE64.decode(this.secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
