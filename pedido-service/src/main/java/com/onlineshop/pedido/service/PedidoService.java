package com.onlineshop.pedido.service;

import com.onlineshop.pedido.entity.Pedido;
import com.onlineshop.pedido.entity.PedidoDetalle;
import com.onlineshop.pedido.repository.PedidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class PedidoService {

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private RestTemplate restTemplate;

    @SuppressWarnings("unchecked")
    public Pedido crearPedido(Pedido pedido) {
        if (pedido.getDetalles() != null) {
            for (PedidoDetalle detalle : pedido.getDetalles()) {
                detalle.setPedido(pedido);

                Map<String, Object> producto;
                try {
                    producto = restTemplate.getForObject(
                        "http://producto-service/api/productos/" + detalle.getProductoId(),
                        Map.class
                    );
                } catch (Exception e) {
                    throw new RuntimeException("No se pudo obtener el producto con id: " + detalle.getProductoId());
                }

                if (producto == null) {
                    throw new RuntimeException("Producto no encontrado con id: " + detalle.getProductoId());
                }

                Integer stockActual = (Integer) producto.get("stock");
                if (stockActual == null || stockActual < detalle.getCantidad()) {
                    String nombre = (String) producto.get("nombre");
                    throw new RuntimeException("Stock insuficiente para \"" + nombre + "\". Disponible: " + stockActual + ", solicitado: " + detalle.getCantidad());
                }

                try {
                    restTemplate.exchange(
                        "http://producto-service/api/productos/" + detalle.getProductoId() + "/stock",
                        HttpMethod.PUT,
                        new HttpEntity<>(Map.of("cantidad", -detalle.getCantidad())),
                        Object.class
                    );
                } catch (Exception e) {
                    throw new RuntimeException("Error al reducir stock para producto " + detalle.getProductoId() + ": " + e.getMessage());
                }
            }
        }
        pedido.setFechaCreacion(LocalDateTime.now());
        return pedidoRepository.save(pedido);
    }

    public List<Pedido> obtenerTodos() {
        return pedidoRepository.findAll();
    }

    public List<Pedido> obtenerPorUsuario(Long usuarioId) {
        return pedidoRepository.findByUsuarioId(usuarioId);
    }

    public Pedido actualizarEstado(Long id, String estado) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado con id: " + id));
        pedido.setEstado(estado);
        if ("ENTREGADO".equals(estado)) {
            pedido.setFechaEntrega(LocalDateTime.now());
        } else if ("CANCELADO".equals(estado)) {
            pedido.setFechaCancelacion(LocalDateTime.now());
        }
        return pedidoRepository.save(pedido);
    }
}
