package com.onlineshop.carrito.service;

import com.onlineshop.carrito.entity.CarritoItem;
import com.onlineshop.carrito.repository.CarritoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CarritoService {

    @Autowired
    private CarritoRepository carritoRepository;

    public CarritoItem agregarProducto(CarritoItem item) {
        return carritoRepository.save(item);
    }

    public List<CarritoItem> obtenerCarrito(Long usuarioId) {
        return carritoRepository.findByUsuarioId(usuarioId);
    }

    public void eliminarItem(Long itemId) {
        carritoRepository.deleteById(itemId);
    }

    @Transactional
    public void vaciarCarrito(Long usuarioId) {
        carritoRepository.deleteByUsuarioId(usuarioId);
    }
}