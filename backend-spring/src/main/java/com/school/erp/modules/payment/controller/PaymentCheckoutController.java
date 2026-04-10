package com.school.erp.modules.payment.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.payment.dto.PaymentDTOs;
import com.school.erp.modules.payment.service.PaymentCheckoutService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
@Tag(name = "Payments", description = "Hosted checkout orders (Razorpay / Stripe adapters)")
public class PaymentCheckoutController {

    private final PaymentCheckoutService checkoutService;

    public PaymentCheckoutController(PaymentCheckoutService checkoutService) {
        this.checkoutService = checkoutService;
    }

    @PostMapping("/checkout/orders")
    @PreAuthorize("hasAnyRole('ADMIN','PARENT')")
    @Operation(summary = "Create payment order", description = "Returns provider order id and JSON options for the browser SDK (Razorpay Checkout, Stripe Elements, …).")
    public ResponseEntity<ApiResponse<PaymentDTOs.CreateOrderResponse>> createOrder(
            @Valid @RequestBody PaymentDTOs.CreateOrderRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(checkoutService.createOrder(req)));
    }
}
