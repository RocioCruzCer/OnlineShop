package com.onlineshop.producto.config;

import com.onlineshop.producto.entity.Producto;
import com.onlineshop.producto.repository.ProductoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private ProductoRepository productoRepository;

    @Override
    public void run(String... args) {
        if (productoRepository.count() > 0) {
            log.info("BD ya contiene productos, omitiendo seed");
            return;
        }

        log.info("Inicializando productos por defecto...");

        Producto p1 = new Producto();
        p1.setNombre("Laptop HP Pavilion");
        p1.setDescripcion("Laptop HP Pavilion 15.6\" Intel Core i5, 8GB RAM, 256GB SSD");
        p1.setPrecio(new BigDecimal("15000.00"));
        p1.setStock(10);
        productoRepository.save(p1);

        Producto p2 = new Producto();
        p2.setNombre("Audifonos Sony");
        p2.setDescripcion("Audifonos inalambricos Sony WH-1000XM5 con cancelacion de ruido");
        p2.setPrecio(new BigDecimal("3500.00"));
        p2.setStock(15);
        productoRepository.save(p2);

        Producto p3 = new Producto();
        p3.setNombre("Teclado Mecanico");
        p3.setDescripcion("Teclado mecanico Logitech G Pro RGB, switches GX Blue");
        p3.setPrecio(new BigDecimal("2500.00"));
        p3.setStock(20);
        productoRepository.save(p3);

        log.info("Productos inicializados correctamente");
    }
}
