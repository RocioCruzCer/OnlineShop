package com.onlineshop.usuario.repository;

import com.onlineshop.usuario.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    // Spring Boot crea la consulta SQL automáticamente con solo nombrar bien el método
    Optional<Usuario> findByUsername(String username);
}