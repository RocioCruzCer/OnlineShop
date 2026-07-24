package com.onlineshop.producto.service;

import com.onlineshop.producto.entity.Producto;
import com.onlineshop.producto.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductoService {

    @Autowired
    private ProductoRepository productoRepository;

    public Producto crearProducto(Producto producto) {
        return productoRepository.save(producto);
    }

    public List<Producto> obtenerTodos() {
        return productoRepository.findAll();
    }

    public Producto obtenerPorId(Long id) {
        return productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con id: " + id));
    }

    public Producto actualizar(Long id, Producto producto) {
        Producto existente = obtenerPorId(id);
        existente.setNombre(producto.getNombre());
        existente.setDescripcion(producto.getDescripcion());
        existente.setPrecio(producto.getPrecio());
        existente.setStock(producto.getStock());
        existente.setImagenData(producto.getImagenData());
        return productoRepository.save(existente);
    }

    public Producto actualizarStock(Long id, Integer cantidad) {
        Producto existente = obtenerPorId(id);
        existente.setStock(existente.getStock() + cantidad);
        return productoRepository.save(existente);
    }

    public void eliminar(Long id) {
        obtenerPorId(id);
        productoRepository.deleteById(id);
    }
}