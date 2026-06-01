from __future__ import annotations


def create_product(client, *, sku="SKU-1", price=10, quantity=5):
    response = client.post(
        "/products",
        json={
            "sku": sku,
            "name": f"Product {sku}",
            "description": "",
            "price": price,
            "quantity_in_stock": quantity,
        },
    )
    assert response.status_code == 201
    return response.json()


def create_customer(client, *, email="buyer@example.com"):
    response = client.post(
        "/customers",
        json={
            "name": "Buyer One",
            "email": email,
            "phone": "+1-555-0100",
            "address": "100 Test Street",
        },
    )
    assert response.status_code == 201
    return response.json()


def test_product_sku_must_be_unique(client):
    create_product(client, sku="UNIQUE-SKU")

    response = client.post(
        "/products",
        json={
            "sku": "UNIQUE-SKU",
            "name": "Duplicate",
            "price": 12,
            "quantity_in_stock": 4,
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "SKU already exists."


def test_customer_email_must_be_unique(client):
    create_customer(client, email="same@example.com")

    response = client.post(
        "/customers",
        json={
            "name": "Another Buyer",
            "email": "same@example.com",
            "phone": "+1-555-0101",
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Email already exists."


def test_product_quantity_cannot_be_negative(client):
    response = client.post(
        "/products",
        json={
            "sku": "NEGATIVE-STOCK",
            "name": "Invalid Product",
            "price": 20,
            "quantity_in_stock": -1,
        },
    )

    assert response.status_code == 422


def test_order_rejects_insufficient_stock_without_deducting_inventory(client):
    product = create_product(client, sku="LOW-STOCK", price=15, quantity=2)
    customer = create_customer(client)

    response = client.post(
        "/orders",
        json={
            "customer_id": customer["id"],
            "items": [{"product_id": product["id"], "quantity": 3}],
        },
    )

    assert response.status_code == 422
    assert response.json()["detail"]["message"] == "Insufficient stock."

    product_after = client.get(f"/products/{product['id']}").json()
    assert product_after["quantity_in_stock"] == 2


def test_order_total_is_calculated_and_stock_is_deducted(client):
    scanner = create_product(client, sku="SCANNER", price=129, quantity=10)
    labels = create_product(client, sku="LABELS", price=14.5, quantity=20)
    customer = create_customer(client)

    response = client.post(
        "/orders",
        json={
            "customer_id": customer["id"],
            "items": [
                {"product_id": scanner["id"], "quantity": 2},
                {"product_id": labels["id"], "quantity": 3},
            ],
        },
    )

    assert response.status_code == 201
    order = response.json()
    assert order["total_amount"] == "301.50"

    scanner_after = client.get(f"/products/{scanner['id']}").json()
    labels_after = client.get(f"/products/{labels['id']}").json()
    assert scanner_after["quantity_in_stock"] == 8
    assert labels_after["quantity_in_stock"] == 17


def test_deleting_order_restores_stock(client):
    product = create_product(client, sku="RESTORE", price=25, quantity=7)
    customer = create_customer(client)
    order = client.post(
        "/orders",
        json={
            "customer_id": customer["id"],
            "items": [{"product_id": product["id"], "quantity": 4}],
        },
    ).json()

    response = client.delete(f"/orders/{order['id']}")

    assert response.status_code == 204
    product_after = client.get(f"/products/{product['id']}").json()
    assert product_after["quantity_in_stock"] == 7
    assert client.get(f"/orders/{order['id']}").status_code == 404
